# Ile Ase Vodun Ogum Ayres

Terreiro de Umbanda — São Paulo, SP

## URLs

- **App**: https://falssp.github.io/terreiro-gestao/ile-ase-vodun/
- **Admin**: https://falssp.github.io/terreiro-gestao/ile-ase-vodun/admin.html
- **Ajuda**: https://falssp.github.io/terreiro-gestao/ile-ase-vodun/faq.html

## Infraestrutura

- **GAS proxy**: https://terreiro-proxy.falssp.workers.dev
- **Mídia (principal)**: https://pub-201d65298a0941d4939bf1e902d17c18.r2.dev
- **Mídia (backup)**: Backblaze B2 — bucket `terreiro-pontos-backup`

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | App principal |
| `app.js` | Todo o JavaScript |
| `admin.html` | Painel administrativo |
| `faq.html` | Ajuda / FAQ |
| `player.html` | Player de pontos (backup) |
| `pontos_catalog.json` | Catálogo de pontos cantados |
| `pontos_cantados.csv` | Dados dos pontos |
| `Terreiro_AppsScript.gs` | Código do Google Apps Script |
| `manifest.json` | PWA manifest |
| `sw.js` | Service worker |

## Pastas de mídia no R2

| Pasta | Conteúdo |
|-------|----------|
| `Pontos Cantados/` | Pontos organizados por entidade |
| `Pontos de Fundamento/` | Pontos de fundamento do terreiro |

## Dev key (acesso admin sem login)

https://falssp.github.io/terreiro-gestao/ile-ase-vodun/admin.html?dev=ile_ase_dev_2024_falsp
