# Terreiro Gestão — Ile Ase Vodun Ogum Ayres

Sistema de gestão para terreiro de Umbanda. Hospedado no GitHub Pages, sem custo de servidor.

**URL pública:** https://falssp.github.io/terreiro-gestao/

---

## Arquitetura

| Camada | Tecnologia | Função |
|--------|-----------|--------|
| Frontend | GitHub Pages (HTML/JS/CSS) | Interface pública e admin |
| Backend | Google Apps Script (GAS) | CRUD na planilha |
| Proxy | Cloudflare Worker `terreiro-proxy` | CORS + acesso anônimo |
| Storage de áudio | Cloudflare R2 `terreiro-pontos` | 645 áudios de pontos |
| Backup de áudio | Backblaze B2 `terreiro-pontos-backup` | Redundância dos áudios |
| Dados | Google Sheets | Fonte de verdade |

---

## Arquivos principais

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | App principal — responsivo (desktop + mobile), uma URL só |
| `admin.html` | Painel administrativo (requer senha) |
| `player.html` | Player de pontos cantados (645 áudios do R2 por entidade) |
| `faq.html` | Ajuda / perguntas frequentes |
| `pontos.html` | Redirect para player.html (legado) |
| `mobile.html` | Redirect para index.html (legado) |
| `Terreiro_AppsScript.gs` | Backend Google Apps Script v17.2 |
| `sw.js` | Service Worker para cache offline |
| `manifest.json` | PWA manifest |

---

## Seções do app

- **Início** — contadores de estoque (OK / Repor / Alerta / Urgente) + eventos do mês
- **Acervo** — inventário de itens sagrados (filtro por categoria, ordem alfabética)
- **Consumíveis** — estoque com nível visual e barra de progresso (ordem alfabética)
- **Calendário** — eventos e festas do terreiro
- **Orixás & Entidades** — fichas dos orixás com saudação, cores, oferendas (filtro Ketu/Umbanda, ordem alfabética)
- **Pontos** — 51 pontos cantados com letra e player YouTube integrado

---

## Admin

**Acesso:** `admin.html` — login por telefone `(11) 98xxx` ou e-mail  
**Dev:** `admin.html?dev=ile_ase_dev_2024_falsp`

### Seções do admin
- **Estoque** — dar saída, repor, recalcular níveis
- **Calendário** — criar/editar eventos
- **Filhos de Santo** — cadastro de membros
- **Financeiro** — entradas e saídas
- **Usuários** — gerenciar contas de acesso
- **Pontos Cantados** — cadastrar/editar letras, links YouTube e entidades
- **Log de Atividades** — histórico de todas as alterações

---

## Infraestrutura Cloudflare

### Worker Proxy
- **URL:** `https://terreiro-proxy.falssp.workers.dev`
- **Função:** Proxy entre o app e o GAS. Resolve CORS e acesso em aba anônima.

### R2 Storage
- **Bucket:** `terreiro-pontos`
- **URL pública:** `https://pub-201d65298a0941d4939bf1e902d17c18.r2.dev`
- **Estrutura:** `Pontos Cantados/{Entidade}/arquivo.mp3`
- **Volume:** ~3.2 GB, 937 arquivos

### Backblaze B2 (backup)
- **Bucket:** `terreiro-pontos-backup`
- **Tipo:** Privado (backup manual via rclone)
- **Sync:** `.clone copy r2:terreiro-pontos b2:terreiro-pontos-backup --progress`

---

## Google Apps Script

**Versão atual:** v17.2  
**URL de produção:** `https://script.google.com/macros/s/AKfycbz8XRp-FTZ-laAfyjHqC_mvDwvKDCFieibGTvp7u7Fyls9OcmCc2aDvlvsVwAW706SlWw/exec`

### Endpoints GET (públicos)
| Ação | Descrição |
|------|-----------|
| `consumiveis-listar` | Lista consumíveis com nível de estoque |
| `acervo-listar` | Lista itens do acervo |
| `entidades-listar` | Lista orixás e entidades |
| `pontos-listar` | Lista pontos cantados |
| `calendario-listar` | Lista eventos do calendário |
| `datas-mes` | Aniversariantes e festas do mês atual |

### Endpoints POST (autenticados)
| Ação | Descrição |
|------|-----------|
| `consumivel-saida` | Dar saída em consumível |
| `consumivel-repor` | Repor estoque |
| `ponto-inserir` | Cadastrar novo ponto |
| `ponto-editar` | Editar ponto existente |

### Trigger de aquecimento
Função `warmup()` configurada para rodar a cada 5 minutos — mantém o GAS sempre aquecido e evita cold start de 10-30s.  
Para (re)instalar: execute `instalarTriggerWarmup()` no editor do Apps Script.

---

## Dados estáticos embutidos

Para evitar dependência do GAS no carregamento inicial, dois datasets ficam embutidos no `index.html`:

- **PONTOS_STATIC** — 51 pontos com letra completa (atualiza em background do GAS)
- **ENTIDADES_STATIC** — 19 orixás/entidades com fichas completas (atualiza em background do GAS)

---

## Manutenção

### Sincronizar áudios Drive → R2 → B2
```
# Na pasta do rclone (Windows)
cd C:\Users\falsp\desktop\rclone-v1.75.1-windows-amd64

# Drive → R2
.\rclone copy "gdrive:Umbanda/Pontos" r2:terreiro-pontos --progress --exclude "AlbumArt*" --exclude "Folder.jpg"

# R2 → B2 (backup)
.\rclone copy r2:terreiro-pontos b2:terreiro-pontos-backup --progress
```

### Atualizar GAS
1. Baixar `Terreiro_AppsScript.gs` do repo
2. Colar no editor do Apps Script
3. Implantar → Gerenciar implantações → editar versão ativa → Implantar
4. Executar `instalarTriggerWarmup()` se necessário

### Regra: sempre que houver mudança no app
- Atualizar `faq.html` se a mudança afeta o uso do app
- Atualizar este `README.md`
- Testar em aba anônima antes de considerar fechado

---

## Roadmap futuro

- [ ] Estrutura multi-terreiro (`/terreiros/{slug}/`)
- [ ] Candomblé / Ketu no player (áudios separados)
- [ ] Login por telefone com OTP (WhatsApp)
- [ ] Dashboard financeiro com gráficos
- [ ] Notificações de estoque crítico via WhatsApp
