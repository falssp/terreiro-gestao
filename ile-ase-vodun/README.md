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

---

## Camadas de acesso

O app tem três níveis de acesso, controlados por `localStorage._nivelAcesso`:

| Nível | Código | O que vê |
|-------|--------|----------|
| `publico` | — | Início, Agenda (eventos abertos), Galeria, Orixás, Pontos |
| `membro` | `ile2025` | + Acervo, Consumíveis, eventos fechados no calendário |
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
| `galeria-listar` | `{ok, fotos[]}` |
| `datas-mes` | `{ok, aniversariantes[], festas[]}` |
| `pontos-listar` | `{ok, itens[]}` |
| `lista-listar` | `{ok, itens[]}` |

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
| **I** | **Visibilidade** | `aberto` (padrão) ou `fechado` / `filhos` — eventos fechados só aparecem para membros |

### Galeria (aba `Galeria`) — **nova**

| Col | Campo | Notas |
|-----|-------|-------|
| A | ID | ex: `GAL-001` |
| B | Título | legenda da foto |
| C | URL | link direto da imagem (R2, Drive, etc.) |
| D | Data | `YYYY-MM-DD` (opcional) |
| E | Categoria | ex: Gira, Festa, Natureza |
| F | Legenda extra | texto livre (opcional) |
| G | Ordem | número para controlar a sequência (menor = primeiro) |

As fotos aparecem em grid na aba **Galeria** do app com lightbox (← → Esc).

---

## Calendário — comportamento

- Ao abrir o app, o calendário **navega automaticamente para o próximo evento** e abre o painel do dia.
- Eventos `fixo: true` (festas recorrentes hardcoded) sempre visíveis para todos.
- Eventos com `visibilidade: "fechado"` ou `"filhos"` aparecem só para membros/admin — marcados com **ponto azul** no grid.
- Eventos abertos: **ponto dourado**. Festas recorrentes: **ponto roxo**.
