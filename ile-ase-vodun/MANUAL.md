# Ile Ase Vodun Ogum Ayres — Manual e Documentação

_Atualizado em: 2026-10-09 · Felipe Lima_

---

## 1. Visão Geral

Sistema web para gestão do Ile Ase Vodun Ogum Ayres, terreiro de Umbanda em São Paulo. Funciona como dois portais na mesma URL: um público (visitantes) e um interno (filhos de santo e administração).

**Tecnologias usadas:**

- **Frontend:** HTML + JavaScript puro, hospedado no GitHub Pages (grátis, sem servidor)
- **Backend:** Google Apps Script (GAS) conectado a uma planilha Google Sheets
- **Proxy / Upload:** Cloudflare Worker (plano gratuito) — intermedia as chamadas ao GAS e faz upload de fotos para o R2
- **Mídia:** Cloudflare R2 (armazenamento de fotos e áudios) + Backblaze B2 (backup)
- **PWA:** O app pode ser instalado na tela inicial do celular como se fosse um aplicativo nativo

---

## 2. Infraestrutura

| Componente | URL / Endereço | Notas |
|------------|---------------|-------|
| App (público) | https://falssp.github.io/terreiro-gestao/ile-ase-vodun/ | GitHub Pages |
| Painel Admin | https://falssp.github.io/terreiro-gestao/ile-ase-vodun/admin.html | Login com e-mail e senha |
| GAS Proxy | https://terreiro-proxy.falssp.workers.dev | Cloudflare Worker |
| Mídia (principal) | https://pub-201d65298a0941d4939bf1e902d17c18.r2.dev | Cloudflare R2 |
| Mídia (backup) | Backblaze B2 | bucket `terreiro-pontos-backup` |
| Repositório | https://github.com/falssp/terreiro-gestao | GitHub |
| Cloudflare Dashboard | https://dash.cloudflare.com | |
| Google Apps Script | https://script.google.com | |

**Fluxo de dados:**

```
Usuário → GitHub Pages (HTML/JS) → Cloudflare Worker → Google Apps Script → Google Sheets
Upload de fotos: Admin → Cloudflare Worker → Cloudflare R2 + Google Sheets (registro)
```

---

## 3. Camadas de Acesso

O sistema tem quatro níveis:

| Nível | Como acessa | O que vê |
|-------|-------------|----------|
| `publico` | Padrão (sem login) | Início, Agenda (eventos abertos), Galeria, Orixás, Pontos |
| `membro` | Código de acesso na tela principal | Tudo acima + Acervo, Consumíveis, eventos fechados, grupo WhatsApp |
| `admin` | Login com e-mail e senha em `admin.html` | Painel administrativo completo |
| `dev` | URL com dev key | Acesso irrestrito ao backend (apenas para desenvolvimento) |

### Acesso de filhos de santo (membro)

Na tela principal, clique em **Acervo** ou **Consumíveis** — o sistema pede o código de acesso.

O código é uma senha única compartilhada com todos os filhos. Está definida em `app.js`:

```javascript
const _CODIGO_MEMBRO = 'ile2025';
```

Para trocar: edite essa variável, faça commit e push.

> **Limitação:** com senha única não é possível identificar individualmente cada filho. Para senhas por pessoa seria necessário um backend com autenticação individual. Evolução possível no futuro.

### Acesso admin

Acesse `admin.html`. O login pede **e-mail** e **senha** — credenciais criadas e gerenciadas no próprio painel (seção Admins). Múltiplos admins são suportados (pai/mãe de santo, dev).

O sistema de autenticação roda no backend (Google Apps Script) — as senhas nunca ficam expostas no código frontend.

- **Primeiro acesso:** cria a conta do primeiro admin diretamente pelo GAS
- **Novos admins:** criados pelo painel admin → seção Admins → Novo admin
- **Recuperação de senha:** pelo painel admin → Admins → Trocar senha

### Dev key

Acesso direto ao GAS sem passar pelo painel admin:

```
admin.html?dev=ile_ase_dev_2024_falsp
```

Use apenas em desenvolvimento. A dev key dá acesso irrestrito ao backend mas **não** ao upload de fotos (que exige o `ADMIN_TOKEN`).

---

## 4. Navegação — Hub

A tela principal funciona como hub: não tem barra de navegação fixa. Cada seção tem um botão **← Início** no topo que volta para a home.

**Seções disponíveis (home → cards):**

- 📅 Calendário
- 🖼 Galeria
- 🌿 Orixás e Entidades
- 🎵 Pontos Cantados
- 📦 Acervo _(membro/admin)_
- 🕯 Consumíveis _(membro/admin)_

**Na home (área de membros):**
- Dashboard de estoque (consumíveis) com contadores OK / Repor / Alerta / Urgente
- Card do grupo de WhatsApp dos filhos (abre direto o grupo)
- Card de consultas espirituais

---

## 5. Manual do Usuário — Dia a Dia

### Adicionar um evento no calendário

1. Acesse o painel admin: `admin.html`
2. Clique em **Calendário → Novo evento**
3. Preencha: data, título, tipo (Gira, Festa, Consulta…), descrição, responsável
4. Em **Visibilidade**: `aberto` para todos verem, `fechado` para mostrar só para membros
5. Clique em **Salvar** — o evento aparece na planilha e no app imediatamente

### Próximo evento (card na home)

O card na home exibe automaticamente o próximo evento do calendário. Clicar nele abre o calendário no dia do evento. Nenhuma configuração necessária — atualiza sozinho.

### Adicionar fotos à galeria

1. No painel admin, clique em **Galeria → Upload de fotos**
2. Escolha o **álbum** (existente ou crie um novo digitando o nome)
3. Selecione as fotos (múltiplos arquivos de uma vez)
4. Preencha título e data (opcionais)
5. Clique em **Enviar** — o Worker faz o upload para o R2 e registra na planilha

### Gerenciar o acervo

1. No painel admin, clique em **Acervo**
2. Use **Novo item** para cadastrar roupas, guias, ferramentas, etc.
3. Campos: nome, categoria, localização, quantidade, estado, observações

### Controlar consumíveis

O dashboard na home (visível para membros/admin) mostra o estoque em 4 níveis:

- **OK** (verde) — estoque suficiente
- **REPOR** (amarelo) — atenção, repor em breve
- **ALERTA** (laranja) — estoque baixo
- **URGENTE** (vermelho) — acabando, comprar já

Para atualizar: painel admin → **Consumíveis → editar item**.

### Acessar pontos cantados

1. Clique em **Pontos** na home
2. Filtre por entidade
3. Clique no ponto para abrir o player de áudio

### Grupo de WhatsApp dos filhos

O card aparece na home apenas para membros logados. O link aponta diretamente para o grupo. Para atualizar o link (quando o link mudar):

```html
<!-- index.html — procure por chat.whatsapp.com -->
<a href="https://chat.whatsapp.com/GDF8NbcI6uREwlKM3U25lY" ...>
```

### Instalar o app no celular (PWA)

**Android (Chrome):** menu (⋮) → _Adicionar à tela inicial_

**iPhone (Safari):** Compartilhar (□↑) → _Adicionar à Tela de Início_

O app abre em tela cheia com ícone próprio, sem barra do navegador.

---

## 6. Painel Admin — Guia Completo

### Acessando

- **URL:** `admin.html`
- **Dev key (sem login):** `admin.html?dev=ile_ase_dev_2024_falsp`

### Login

Insira o **e-mail** e a **senha** cadastrados. No primeiro acesso o sistema pede criação de conta.

Se esquecer a senha: acesse o painel admin com a dev key → seção Admins → Trocar senha.

### Seções do painel

**Calendário**
- Listar, criar, editar e excluir eventos
- Visibilidade: `aberto` (todos) ou `fechado` (só membros)
- Cores no calendário: dourado = aberto, azul = fechado, roxo = festa recorrente

**Galeria**
- Upload de fotos para o R2 (múltiplos arquivos de uma vez)
- Organizadas por álbum
- Excluir: remove do R2 e da planilha simultaneamente

**Acervo**
- Cadastro de itens (roupas, guias, objetos rituais)
- Campos: nome, categoria, localização, quantidade, estado (bom/regular/ruim), observações

**Consumíveis**
- Estoque com limites configuráveis (mínimo, baixo, normal, ideal)
- Dashboard visível para membros na home

**Entidades**
- Cadastro das entidades do terreiro
- Campos: nome, qualidade, cor, saudação, dia da semana, descrição

**Pontos Cantados**
- Lista de pontos com áudio no R2
- Associados a uma entidade

**Admins**
- Criar novos admins (nome, e-mail, senha provisória)
- Bloquear / desbloquear acesso
- Trocar senha de qualquer admin

**Log de operações**
- Histórico de ações (quem fez o quê e quando)
- Salvo na aba `Log` da planilha

### Token do Worker (upload de fotos)

O upload exige o `ADMIN_TOKEN` definido no Cloudflare Dashboard. No painel admin o campo **Token do Worker** recebe esse valor para autorizar uploads.

---

## 7. Google Apps Script (GAS)

O GAS é o backend: lê e escreve na planilha Google Sheets, gerencia autenticação de admins e responde às requisições do Worker.

### Arquivo

`Terreiro_AppsScript.gs` no repositório.

### Como instalar / atualizar

1. Abra a planilha Google Sheets do terreiro
2. Vá em **Extensões → Apps Script**
3. Apague o conteúdo e cole o arquivo `.gs`
4. Salve (Ctrl+S)
5. **Implantar → Gerenciar implantações**
6. Primeira vez: **Nova implantação** — tipo App da Web, executar como **Eu**, acesso **Qualquer pessoa**
7. Atualização: edite a implantação e incremente a versão
8. Copie a URL gerada — vai no Worker como `GAS_URL`

### Primeira configuração

Execute a função `setup()` no editor do GAS para criar as abas da planilha.

### Endpoints

| `acao=` | Descrição |
|---------|-----------|
| `acervo-listar` | Lista itens do acervo |
| `consumiveis-listar` | Lista consumíveis com nível de estoque |
| `entidades-listar` | Lista entidades cadastradas |
| `calendario-listar` | Lista eventos |
| `galeria-listar` | Lista fotos com album e albumSlug |
| `galeria-inserir` | POST — registra foto na planilha |
| `galeria-deletar` | POST — remove linha da planilha |
| `pontos-listar` | Lista pontos cantados |
| `login` | POST — autentica admin, retorna TOKEN |
| `logout` | POST — invalida TOKEN |
| `admin-criar` | POST — cria novo admin |
| `admin-listar` | Lista admins |
| `admin-trocar-senha` | POST — troca senha |

---

## 8. Cloudflare Worker — Deploy

### O que faz

- Intermedia chamadas do frontend para o GAS (CORS, autenticação)
- Upload de fotos para o R2
- Endpoints de galeria (listar, upload, deletar)

### Arquivos

- `worker.js` — código do Worker
- `wrangler.toml` — configuração de deploy

### Pré-requisitos

```bash
npm install -g wrangler
wrangler login
```

### Variáveis de ambiente (Secrets)

**NUNCA** colocar no `wrangler.toml`. Definir via CLI ou Dashboard:

```bash
wrangler secret put ADMIN_TOKEN
wrangler secret put GAS_URL
```

| Variável | Descrição |
|----------|-----------|
| `GAS_URL` | URL da implantação do Apps Script |
| `ADMIN_TOKEN` | Token para autenticar uploads de fotos |

### Deploy

```bash
cd ile-ase-vodun
npx wrangler deploy
```

### Bucket R2

```bash
npx wrangler r2 bucket create terreiro-pontos
```

### Pastas do R2

| Pasta | Conteúdo |
|-------|----------|
| `Pontos Cantados/` | Áudios dos pontos por entidade |
| `Pontos de Fundamento/` | Pontos de fundamento |
| `Galeria/` | Fotos: `Galeria/<slug-album>/<timestamp>-<nome>.<ext>` |

---

## 9. Planilha Google Sheets — Estrutura

Criada automaticamente pela função `setup()` do GAS.

### Aba: Calendário

| Col | Campo | Notas |
|-----|-------|-------|
| A | ID | gerado |
| B | Data | `YYYY-MM-DD` |
| C | Título | |
| D | Tipo | Gira, Festa, Consulta… |
| E | Descrição | |
| F | Responsável | |
| G | Observações | |
| H | Cadastrado em | |
| I | Visibilidade | `aberto` ou `fechado` |

### Aba: Galeria

| Col | Campo | Notas |
|-----|-------|-------|
| A | ID | ex: `GAL-001` |
| B | Título | legenda |
| C | URL | link no R2 |
| D | Data | `YYYY-MM-DD` (opcional) |
| E | Álbum | nome legível |
| F | Legenda extra | opcional |
| G | Ordem | menor = primeiro |
| H | Album Slug | ex: `festa-ogum-2025` |

### Aba: Acervo

| Col | Campo | Notas |
|-----|-------|-------|
| A | ID | |
| B | Nome | |
| C | Categoria | |
| D | Localização | |
| E | Quantidade | |
| F | Estado | bom, regular, ruim |
| G | Observações | |
| H | Cadastrado em | |

### Aba: Consumíveis

| Col | Campo | Notas |
|-----|-------|-------|
| A | ID | |
| B | Nome | |
| C | Quantidade | estoque atual |
| D | Unidade | un, kg, L… |
| E | Mínimo | abaixo = URGENTE |
| F | Baixo | abaixo = ALERTA |
| G | Normal | abaixo = REPOR |
| H | Observações | |

### Aba: Entidades

| Col | Campo | Notas |
|-----|-------|-------|
| A | ID | |
| B | Nome | |
| C | Qualidade | |
| D | Cor | |
| E | Saudação | |
| F | Dia da semana | |
| G | Descrição | |

### Aba: Admins

| Col | Campo | Notas |
|-----|-------|-------|
| A | ID | |
| B | Nome | |
| C | E-mail | identificador único de login |
| D | Senha (hash) | nunca em texto puro |
| E | Permissões | lista separada por vírgula |
| F | Status | ativo, bloqueado, troca-senha |
| G | Criado em | |

### Aba: Log

Registro automático de todas as operações (quem, o que, quando).

---

## 10. Deploy no GitHub Pages

Qualquer push para a branch `main` publica automaticamente.

### Fluxo

1. Edite os arquivos
2. Commit com mensagem descritiva
3. Push para `main`
4. GitHub Pages serve em segundos

### Editar direto no GitHub (sem instalar nada)

1. `github.com/falssp/terreiro-gestao`
2. Navegue até o arquivo
3. Clique no lápis (Edit this file)
4. Commit changes

### Arquivos principais

| Arquivo | Quando editar |
|---------|---------------|
| `app.js` | Lógica, código de acesso de membros |
| `index.html` | Layout e estilos do app |
| `admin.html` | Painel administrativo |
| `Terreiro_AppsScript.gs` | Backend (GAS) |
| `worker.js` | Cloudflare Worker |

### Forçar atualização no celular (PWA)

- **Android:** Informações do app → Armazenamento → Limpar cache
- **iPhone:** Configurações → Safari → Limpar histórico e dados

---

## 11. Segurança

### Proteções implementadas (frontend)

| Ação | Método |
|------|--------|
| Clique direito | `contextmenu` preventDefault |
| Ctrl+P/S/U / F12 | `keydown` preventDefault |
| DevTools (Ctrl+Shift+I/J/C) | `keydown` preventDefault |
| Selecionar texto | CSS `user-select: none` |
| Imprimir via browser | CSS `@media print` |
| Arrastar imagens | `dragstart` preventDefault |

### Limite das proteções

Não impedem: Print Screen do SO, captura de tela pelo celular, fotografar a tela. Isso é uma limitação fundamental do navegador — nenhum site resolve completamente.

### Tokens e chaves

| Item | Onde está | Visível no frontend? |
|------|-----------|----------------------|
| Código de membros (`ile2025`) | `app.js` — `_CODIGO_MEMBRO` | Sim (hardcoded) |
| Dev key | `app.js` — hardcoded | Sim (apenas desenvolvimento) |
| Senhas dos admins | Planilha GAS (hash) | Não — autenticação no backend |
| ADMIN_TOKEN (upload fotos) | Cloudflare Dashboard — Secret | Nunca |
| GAS_URL | Cloudflare Dashboard — Variável | Não (passada via Worker) |

### Boas práticas

- Troque `_CODIGO_MEMBRO` antes de disponibilizar para uso real
- O `ADMIN_TOKEN` nunca deve aparecer no `wrangler.toml` nem no frontend
- A dev key dá acesso irrestrito ao GAS — não compartilhar

---

## 12. Referência Rápida

### URLs

| Recurso | URL |
|---------|-----|
| App | https://falssp.github.io/terreiro-gestao/ile-ase-vodun/ |
| Painel admin | https://falssp.github.io/terreiro-gestao/ile-ase-vodun/admin.html |
| Painel admin (dev) | https://falssp.github.io/terreiro-gestao/ile-ase-vodun/admin.html?dev=ile_ase_dev_2024_falsp |
| Worker | https://terreiro-proxy.falssp.workers.dev |
| Mídia (R2) | https://pub-201d65298a0941d4939bf1e902d17c18.r2.dev |
| Repositório | https://github.com/falssp/terreiro-gestao |
| Cloudflare | https://dash.cloudflare.com |
| Google Apps Script | https://script.google.com |

### Acesso ao app

| Nível | Como | Variável no código |
|-------|------|--------------------|
| Público | Padrão | — |
| Membro (filhos) | Código de acesso na tela | `_CODIGO_MEMBRO` em `app.js` |
| Admin | E-mail + senha em `admin.html` | Gerenciado pelo GAS |
| Dev | URL com dev key | `ile_ase_dev_2024_falsp` em `app.js` |

### Serviços — links de administração

| Serviço | Acesso |
|---------|--------|
| GitHub Pages | github.com/falssp/terreiro-gestao |
| Cloudflare Worker | dash.cloudflare.com → Workers → terreiro-proxy |
| Cloudflare R2 | dash.cloudflare.com → R2 → terreiro-pontos |
| Google Apps Script | script.google.com |
| Google Sheets | sheets.google.com (planilha do terreiro) |
| Backblaze B2 | secure.backblaze.com → terreiro-pontos-backup |

### Cores do sistema (CSS)

| Variável | Valor | Uso |
|----------|-------|-----|
| `--bg` | `#0f0f0f` | Fundo geral |
| `--card` | `#1a1a1a` | Fundo dos cards |
| `--ouro` | `#c9a84c` | Cor principal |
| `--ouro-lt` | `#f0d060` | Dourado claro |
| `--cinza` | `#999` | Texto secundário |
| `--borda` | `rgba(201,168,76,.22)` | Bordas |

### Calendário — cores dos pontos

| Cor | Significado |
|-----|-------------|
| Dourado | Evento aberto (todos) |
| Azul | Evento fechado (só membros) |
| Roxo | Festa recorrente (hardcoded) |
