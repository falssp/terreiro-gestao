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
| `worker.js` | Cloudflare Worker — proxy GAS + upload R2 galeria |
| `wrangler.toml` | Config de deploy do Worker (Cloudflare) |

## Pastas de mídia no R2

| Pasta | Conteúdo |
|-------|----------|
| `Pontos Cantados/` | Pontos organizados por entidade |
| `Pontos de Fundamento/` | Pontos de fundamento do terreiro |
| `Galeria/` | Fotos organizadas por álbum — `Galeria/<slug-album>/<arquivo>` |

## Dev key (acesso admin sem login)

https://falssp.github.io/terreiro-gestao/ile-ase-vodun/admin.html?dev=ile_ase_dev_2024_falsp

---

## Camadas de acesso

O app tem três níveis de acesso, controlados por `localStorage._nivelAcesso`:

| Nível | Código | O que vê |
|-------|--------|----------|
| `publico` | — | Início, Agenda (eventos abertos), Galeria, Orixás, Pontos |
| `filho` | `ile2025` | + Acervo, Consumíveis, eventos fechados no calendário |
| `admin` | `ogumayre$` | Tudo acima + área admin |

> Os códigos ficam em `app.js` nas variáveis `_CODIGO_MEMBRO` e `_CODIGO_ADMIN`. Troque antes de ir para produção.

O chip **🔒 Filhos** aparece na barra de navegação desktop (ao lado de Admin / Ajuda). Em mobile não aparece — acesso se faz clicando diretamente em Acervo ou Consumíveis.

---

## Endpoints do GAS (via proxy)

Todos passam `?token=ile_ase_dev_2024_falsp` no frontend.

| Endpoint (`acao=`) | Retorno |
|-------------------|---------|
| `acervo-listar` | `{ok, itens[]}` |
| `consumiveis-listar` | `{ok, itens[]}` |
| `entidades-listar` | `{ok, itens[]}` |
| `calendario-listar` | `{ok, eventos[]}` — inclui campo `visibilidade` |
| `galeria-listar` | `{ok, fotos[]}` — cada foto inclui `album` e `albumSlug` |
| `galeria-inserir` | POST — `{titulo, url, data, categoria, album, albumSlug, legenda, ordem}` |
| `galeria-deletar` | POST — `{id}` — remove linha da planilha |
| `datas-mes` | `{ok, aniversariantes[], festas[]}` |
| `pontos-listar` | `{ok, itens[]}` |
| `lista-listar` | `{ok, itens[]}` |

## Endpoints do Worker (R2 direto)

| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `?acao=galeria-albuns` | GET | — | Lista álbuns (`Galeria/` prefix + delimiter no R2) |
| `?acao=galeria-upload` | POST (multipart) | `X-Admin-Token` | Upload de fotos para R2 + registra na planilha |
| `?acao=galeria-deletar` | POST (JSON) | `X-Admin-Token` | Deleta objeto R2 por `r2Key` |

### Upload de fotos (`galeria-upload`)

```
POST https://terreiro-proxy.falssp.workers.dev?acao=galeria-upload
Header: X-Admin-Token: <admin_token>
Body: multipart/form-data
  album   = "Festa Ogum 2025"   # nome legível (Worker gera o slug)
  titulo  = "Depois da gira"    # opcional
  data    = "2025-04-23"        # opcional
  ordem   = "1"                 # opcional
  fotos   = [File, File, ...]   # campo repetido, múltiplos arquivos
```

Retorna `{ok, enviados, fotos: [{nome, url, album}]}`.

### Token admin

Definido no Cloudflare Dashboard: Workers → terreiro-proxy → Settings → Variables → `ADMIN_TOKEN`.
**Nunca colocar no `wrangler.toml` nem no frontend.**
No modo dev: usa `DEV_KEY = 'ile_ase_dev_2024_falsp'` (token de desenvolvimento).

---

## Planilha — abas necessárias

### Calendário (aba `Calendário`)

| Col | Campo | Notas |
|-----|-------|-------|
| A | ID | gerado pelo admin |
| B | Data | `YYYY-MM-DD` |
| C | Título | |
| D | Tipo | Gira, Festa, Consulta… |
| E | Descrição | texto livre |
| F | Responsável | |
| G | Observações | |
| H | Cadastrado em | |
| **I** | **Visibilidade** | `aberto` (padrão) ou `fechado` / `filhos` — eventos fechados só aparecem para filhos |

### Galeria (aba `Galeria`)

| Col | Campo | Notas |
|-----|-------|-------|
| A | ID | ex: `GAL-001` |
| B | Título | legenda da foto |
| C | URL | link direto da imagem (R2) |
| D | Data | `YYYY-MM-DD` (opcional) |
| E | Álbum | nome legível do álbum (ex: `Festa Ogum 2025`) |
| F | Legenda extra | texto livre (opcional) |
| G | Ordem | número para controlar a sequência (menor = primeiro) |
| H | Album Slug | slug do álbum (ex: `festa-ogum-2025`) — gerado automaticamente pelo Worker |

As fotos aparecem organizadas por **álbum** na aba Galeria do app:
- Tela inicial: cards de álbuns com thumbnail e contagem de fotos
- Tela do álbum: grid de fotos com lightbox (← → Esc)

A aba é criada automaticamente ao rodar `setup()` no GAS.

---

## Calendário — comportamento

- Ao abrir o app, o calendário **navega automaticamente para o próximo evento** e abre o painel do dia.
- Eventos `fixo: true` (festas recorrentes hardcoded) sempre visíveis para todos.
- Eventos com `visibilidade: "fechado"` ou `"filhos"` aparecem só para filhos/admin — marcados com **ponto azul** no grid.
- Eventos abertos: **ponto dourado**. Festas recorrentes: **ponto roxo**.
