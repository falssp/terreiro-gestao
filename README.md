# terreiro-gestao

Sistema de gestão para terreiros de Umbanda, desenvolvido com GitHub Pages + Google Apps Script + Cloudflare.

## Terreiros

| Terreiro | URL | Pasta |
|----------|-----|-------|
| Ile Ase Vodun Ogum Ayres | [ile-ase-vodun](https://falssp.github.io/terreiro-gestao/ile-ase-vodun/) | `ile-ase-vodun/` |

## Estrutura

```
terreiro-gestao/
  index.html                    ← landing page
  ile-ase-vodun/
    index.html                  ← app principal
    app.js                      ← todo o JS
    admin.html                  ← painel administrativo
    faq.html                    ← ajuda
    player.html                 ← player de pontos (backup)
    pontos_catalog.json         ← catálogo de 645+ pontos cantados
    pontos_cantados.csv         ← dados dos pontos
    Terreiro_AppsScript.gs      ← código do Google Apps Script
    manifest.json               ← PWA manifest
    sw.js                       ← service worker
    icon-192.png / icon-512.png ← ícones PWA
```

## Arquitetura

- **Frontend**: GitHub Pages (estático)
- **Backend**: Google Apps Script (proxy via Cloudflare Worker)
- **Proxy**: `https://terreiro-proxy.falssp.workers.dev`
- **Mídia (principal)**: Cloudflare R2 — `pub-201d65298a0941d4939bf1e902d17c18.r2.dev`
- **Mídia (backup)**: Backblaze B2 — `terreiro-pontos-backup`

## Adicionar novo terreiro

1. Criar pasta `nome-do-terreiro/` no repo
2. Copiar todos os arquivos de `ile-ase-vodun/`
3. Atualizar `app.js` com o GAS URL e dados do terreiro
4. Adicionar card na `index.html` da raiz
