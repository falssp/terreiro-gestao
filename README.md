# Terreiro Gestão

Sistema completo de gestão digital para terreiros de Umbanda — PWA acessível pelo celular, sem instalação.

**→ [Landing page](https://falssp.github.io/terreiro-gestao/) · [Demo](https://falssp.github.io/terreiro-gestao/demo/) · [Modelo de negócio](PRODUTO.md)**

---

## Terreiros ativos

| Terreiro | URL | Status |
|----------|-----|--------|
| Ile Ase Vodun Ogum Ayres | [falssp.github.io/terreiro-gestao/ile-ase-vodun/](https://falssp.github.io/terreiro-gestao/ile-ase-vodun/) | ✅ Ativo |

---

## Estrutura do repositório

```
terreiro-gestao/
│
├── index.html                  ← landing page de vendas
├── PRODUTO.md                  ← modelo de negócio e custos
├── README.md                   ← este arquivo
│
├── demo/
│   └── index.html              ← demo navegável (dados fictícios, sem backend)
│
└── ile-ase-vodun/              ← instância do Ile Ase Vodun Ogum Ayres
    ├── index.html              ← app principal (PWA)
    ├── app.js                  ← toda a lógica JS + dados estáticos
    ├── admin.html              ← painel administrativo
    ├── faq.html                ← ajuda para usuários
    ├── player.html             ← player de pontos (standalone)
    ├── pontos_catalog.json     ← catálogo de 645+ pontos cantados
    ├── pontos_cantados.csv     ← dados tabulares dos pontos
    ├── Terreiro_AppsScript.gs  ← código do Google Apps Script (backend)
    ├── manifest.json           ← PWA manifest
    ├── sw.js                   ← service worker (cache offline)
    ├── icon-192.png            ← ícone PWA
    └── icon-512.png            ← ícone PWA (splash)
```

---

## Arquitetura

```
[Usuário (celular/desktop)]
        │
        ▼ HTTPS
[GitHub Pages]          ← frontend estático (HTML/CSS/JS)
        │
        ▼ fetch()
[Cloudflare Worker]     ← proxy HTTPS (terreiro-proxy.falssp.workers.dev)
        │               ← contorna restrição de CORS do GAS
        ▼
[Google Apps Script]    ← backend / API (doGet / doPost)
        │
        ▼
[Google Sheets]         ← banco de dados
   Abas: Acervo | Consumíveis | Filhos de Santo | Entidades/Orixás | Financeiro

[Cloudflare R2]         ← storage de áudio dos pontos cantados
        │
        ▼ CDN
[player de áudio no app]
```

### URLs de infraestrutura (Ile Ase Vodun)

| Serviço | URL |
|---------|-----|
| App | https://falssp.github.io/terreiro-gestao/ile-ase-vodun/ |
| Proxy Cloudflare | https://terreiro-proxy.falssp.workers.dev |
| R2 (áudio) | https://pub-201d65298a0941d4939bf1e902d17c18.r2.dev |
| GAS Web App | https://script.google.com/macros/s/AKfycbz8XRp-FTZ-laAfyjHqC_mvDwvKDMqFieibGTvp7u7Fyls9OcmCc2aDvlvsVwAW706SlWw/exec |
| Planilha Sheets | ID: `1zzP0TgsT85omd2MyIGLU-B2ONRMwI6aQkgQO4DroIFc` |

---

## Módulos do sistema

| Módulo | Acesso | Descrição |
|--------|--------|-----------|
| Calendário | Público | Giras e eventos; fechados marcados mas sem detalhes |
| Pontos Cantados | Público | 645+ pontos com letra + player de áudio |
| Galeria | Público | Álbuns fotográficos da casa |
| Orixás & Entidades | Público | Catálogo espiritual com saudações |
| Acervo | 🔒 Filhos | Inventário de peças e itens rituais |
| Consumíveis | 🔒 Filhos | Estoque com alertas: ✅ OK / ⚠️ Repor / 🔴 Alerta / 🚨 Urgente |
| Painel Admin | 🔒 Admin | Gestão completa: CRUD de todos os módulos |

### Níveis de estoque
| Badge | Condição | Ação |
|-------|----------|------|
| ✅ OK | ≥ 75% da quantidade máxima | Nenhuma |
| ⚠️ Repor | 25–74% | Planejar reposição |
| 🔴 Alerta | 5–24% | Comprar em breve |
| 🚨 Urgente | < 5% | Comprar antes da próxima gira |

---

## Provisionar novo terreiro

### Pré-requisitos
- Conta GitHub (para fazer fork)
- Conta Google (para GAS + Sheets)
- Conta Cloudflare (Worker + R2, gratuitos)
- Domínio `.com.br` opcional (Registro.br, ~R$40/ano)

### Passo a passo

**1. Fork e GitHub Pages**
```bash
# Fork este repositório no GitHub
# Em Settings → Pages → Source: Deploy from a branch → main / root
# URL será: https://<usuario>.github.io/terreiro-gestao/
```

**2. Criar a planilha Google Sheets**
```
- Copiar template (ou criar nova planilha)
- Criar abas: Acervo | Consumíveis | Filhos de Santo | Entidades/Orixás | Calendário | Configurações
- Anotar o ID da planilha (da URL do Sheets)
```

**3. Deploy do Google Apps Script**
```
- Abrir Google Apps Script: script.google.com
- Novo projeto → copiar conteúdo de Terreiro_AppsScript.gs
- Substituir SHEET_ID pelo ID da planilha
- Implantar → Novo deploy → Web App → Acesso: Qualquer pessoa
- Anotar a URL do Web App
```

**4. Criar Cloudflare Worker (proxy)**
```javascript
// Worker.js — substitui GAS_URL pela URL do Web App acima
export default {
  async fetch(request, env) {
    const GAS_URL = 'https://script.google.com/macros/s/SEU_GAS_ID/exec';
    const url = new URL(request.url);
    const target = GAS_URL + url.search;
    const resp = await fetch(target, { method: request.method, headers: request.headers, body: request.body });
    return new Response(resp.body, {
      status: resp.status,
      headers: { ...Object.fromEntries(resp.headers), 'Access-Control-Allow-Origin': '*' }
    });
  }
}
```

**5. Criar bucket R2 (áudio)**
```
- Cloudflare dashboard → R2 → Create bucket
- Habilitar acesso público (Public Development URL)
- Fazer upload dos arquivos de áudio
- Anotar a URL pública do bucket
```

**6. Personalizar o app**
```javascript
// No arquivo ile-ase-vodun/app.js (ou nova pasta), editar:
const GS = 'https://SEU-WORKER.workers.dev';      // URL do Worker
const R2 = 'https://pub-SEU-BUCKET.r2.dev';       // URL do R2
const TERREIRO_NOME = 'Nome do Terreiro';
const TERREIRO_SUBTITULO = 'Linha de trabalho';
```

**7. Criar pasta e adicionar card na index.html**
```bash
cp -r ile-ase-vodun/ nome-do-terreiro/
# Editar app.js na nova pasta
# Adicionar card na index.html raiz apontando para a nova pasta
```

**8. Configurar domínio personalizado (opcional)**
```
- Registro.br: registrar domínio (~R$40/ano)
- Cloudflare: adicionar site, apontar nameservers
- GitHub Pages Settings → Custom domain → meuterreiro.com.br
- Cloudflare DNS: CNAME meuterreiro.com.br → <usuario>.github.io
```

---

## Custos operacionais

Veja [PRODUTO.md](PRODUTO.md) para detalhes completos de precificação.

| Serviço | Cota gratuita | Custo se exceder |
|---------|--------------|-----------------|
| GitHub Pages | 100 GB bandwidth/mês | Plano pago GitHub |
| Google Apps Script | 90 min execução/dia | — (não tem plano pago direto) |
| Cloudflare Worker | 100.000 req/dia | US$ 5/mês (10M req) |
| Cloudflare R2 | 10 GB + 1M ops/mês | US$ 0,015/GB extra |
| Domínio .com.br | — | ~R$ 40/ano (Registro.br) |

**Para uso típico de terreiro, custo total = R$ 0 (ou R$ 40/ano com domínio).**

---

## Segurança e LGPD

- Autenticação por código hash SHA-256 (sem senha em texto claro)
- Tokens de sessão somente em memória (sem localStorage)
- Nenhum dado sensível nos módulos públicos (sem CPF, endereço, dados de saúde)
- Dados dos Filhos de Santo acessíveis apenas com perfil Admin
- Perfis: Dev / Admin / Filho de Santo (permissões granulares)

---

## Contato

WhatsApp: [(11) 98920-2958](https://wa.me/5511989202958)
