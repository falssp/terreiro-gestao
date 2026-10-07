// Cloudflare Worker — Ile Ase Vodun Ogum Ayres
// Proxy GAS + Upload R2 para Galeria
// Binding R2: env.BUCKET (bucket: terreiro-pontos)
// Var env: env.ADMIN_TOKEN (token para upload)

const GAS_URL = 'https://script.google.com/macros/s/AKfycbz8XRp-FTZ-laAfyjHqC_mvDwvKDCFieibGTvp7u7Fyls9OcmCc2aDvlvsVwAW706SlWw/exec';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
  'Access-Control-Max-Age': '86400',
};

function cors(body, status, extra) {
  return new Response(body, {
    status: status || 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', ...(extra || {}) },
  });
}

function slug(str) {
  return (str || 'album')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export default {
  async fetch(request, env, ctx) {
    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const acao = url.searchParams.get('acao');

    // ── GALERIA: listar álbuns via R2 ──────────────────────────
    if (request.method === 'GET' && acao === 'galeria-albuns') {
      try {
        const prefix = 'Galeria/';
        const list = await env.BUCKET.list({ prefix, delimiter: '/' });
        const albuns = (list.delimitedPrefixes || []).map(function(p) {
          // p = "Galeria/nome-do-album/"  →  extrai só o nome
          return p.replace(prefix, '').replace(/\/$/, '');
        });
        return cors(JSON.stringify({ ok: true, albuns }));
      } catch (e) {
        return cors(JSON.stringify({ ok: false, erro: e.message }), 500);
      }
    }

    // ── GALERIA: upload de foto ────────────────────────────────
    if (request.method === 'POST' && acao === 'galeria-upload') {
      // Validar token admin (Header X-Admin-Token ou campo token no form)
      const adminToken = request.headers.get('X-Admin-Token');
      const expectedToken = env.ADMIN_TOKEN || 'ile_ase_dev_2024_falsp';
      if (!adminToken || adminToken !== expectedToken) {
        return cors(JSON.stringify({ ok: false, erro: 'Token inválido.' }), 401);
      }

      try {
        const formData = await request.formData();
        const album    = formData.get('album') || 'Geral';
        const titulo   = formData.get('titulo') || '';
        const data     = formData.get('data') || '';
        const ordem    = formData.get('ordem') || '999';
        const files    = formData.getAll('fotos');   // múltiplos arquivos

        if (!files || files.length === 0) {
          return cors(JSON.stringify({ ok: false, erro: 'Nenhum arquivo enviado.' }), 400);
        }

        const albumSlug = slug(album);
        const resultados = [];

        for (const file of files) {
          // Gera nome único: timestamp + nome original saneado
          const ext = (file.name || 'foto').split('.').pop().toLowerCase() || 'jpg';
          const baseName = slug(file.name.replace(/\.[^.]+$/, '')) || 'foto';
          const fileName = Date.now() + '-' + baseName + '.' + ext;
          const r2Key    = 'Galeria/' + albumSlug + '/' + fileName;

          // Upload para R2
          await env.BUCKET.put(r2Key, file.stream(), {
            httpMetadata: { contentType: file.type || 'image/jpeg' },
            customMetadata: { album, titulo, data, ordem },
          });

          // URL pública da foto
          const pubUrl = 'https://pub-201d65298a0941d4939bf1e902d17c18.r2.dev/' + r2Key;

          // Registrar na planilha via GAS
          try {
            await fetch(GAS_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                acao: 'galeria-inserir',
                token: 'DEV_BYPASS',
                titulo: titulo || baseName,
                url: pubUrl,
                data: data,
                categoria: album,
                album: albumSlug,
                legenda: '',
                ordem: Number(ordem) || 999,
              }),
            });
          } catch (gasErr) {
            // GAS falhou, mas a foto já está no R2 — registrar mas não falhar o upload
            console.error('GAS galeria-inserir falhou:', gasErr.message);
          }

          resultados.push({ nome: fileName, url: pubUrl, album: albumSlug });
        }

        return cors(JSON.stringify({ ok: true, enviados: resultados.length, fotos: resultados }));
      } catch (e) {
        return cors(JSON.stringify({ ok: false, erro: e.message }), 500);
      }
    }

    // ── GALERIA: deletar foto ──────────────────────────────────
    if (request.method === 'POST' && acao === 'galeria-deletar') {
      const adminToken = request.headers.get('X-Admin-Token');
      const expectedToken = env.ADMIN_TOKEN || 'ile_ase_dev_2024_falsp';
      if (!adminToken || adminToken !== expectedToken) {
        return cors(JSON.stringify({ ok: false, erro: 'Token inválido.' }), 401);
      }
      try {
        const body  = await request.json();
        const r2Key = body.r2Key; // ex: "Galeria/festa-ogum/1234-foto.jpg"
        if (!r2Key || !r2Key.startsWith('Galeria/')) {
          return cors(JSON.stringify({ ok: false, erro: 'r2Key inválida.' }), 400);
        }
        await env.BUCKET.delete(r2Key);
        return cors(JSON.stringify({ ok: true }));
      } catch (e) {
        return cors(JSON.stringify({ ok: false, erro: e.message }), 500);
      }
    }

    // ── PROXY GAS (GET e POST) ─────────────────────────────────
    try {
      let gasResp;
      if (request.method === 'POST') {
        const body = await request.text();
        gasResp = await fetch(GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
      } else {
        const gasUrl = GAS_URL + url.search;
        gasResp = await fetch(gasUrl);
      }

      const text = await gasResp.text();
      return new Response(text, {
        status: gasResp.status,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      });
    } catch (e) {
      return cors(JSON.stringify({ ok: false, erro: 'Proxy erro: ' + e.message }), 502);
    }
  },
};
