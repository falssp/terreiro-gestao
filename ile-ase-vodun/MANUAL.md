# Ile Ase Vodun Ogum Ayres — Manual e Documentação

_Atualizado em: 2026-10-07 · Felipe Lima_

---

## 1. Visão Geral

Sistema web completo para gestão do Ile Ase Vodun Ogum Ayres, terreiro de Umbanda em São Paulo. Funciona como dois portais na mesma URL: um público (visitantes e simpatizantes) e um interno (filhos de santo e administração).

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
| Painel Admin | https://falssp.github.io/terreiro-gestao/ile-ase-vodun/admin.html | Login por token |
| Ajuda / FAQ | https://falssp.github.io/terreiro-gestao/ile-ase-vodun/faq.html | |
| GAS Proxy | https://terreiro-proxy.falssp.workers.dev | Cloudflare Worker |
| Mídia (principal) | https://pub-201d65298a0941d4939bf1e902d17c18.r2.dev | Cloudflare R2 |
| Mídia (backup) | Backblaze B2 | bucket `terreiro-pontos-backup` |
| Repositório | https://github.com/falssp/terreiro-gestao | GitHub |
| Cloudflare Dashboard | https://dash.cloudflare.com | |
| Google Apps Script | https://script.google.com | |

**Fluxo de dados:**

```
Usuário no browser → GitHub Pages (HTML/JS) → Cloudflare Worker → Google Apps Script → Google Sheets
Upload de fotos: Admin → Cloudflare Worker → Cloudflare R2 (armazenamento) + Google Sheets (registro)
```

---

## 3. Camadas de Acesso

O sistema tem três níveis de acesso, controlados pela variável `localStorage._nivelAcesso`:

| Nível | Senha | O que vê |
|-------|-------|----------|
| `publico` | — (padrão) | Início, Agenda (eventos abertos), Galeria, Orixás, Pontos |
| `membro` | `ile2025` | Tudo acima + Acervo, Consumíveis, eventos fechados |
| `admin` | `ogumayre$` | Tudo acima + Painel Administrativo completo |

### Como o acesso funciona

A função `_aplicarAcesso()` em `app.js` roda a cada carregamento e oculta ou exibe elementos via classes CSS:

- `.tab-membro` — visível apenas para membro e admin
- `.tab-admin` — visível apenas para admin

Elementos sem essas classes são públicos.

### Trocando as senhas

Edite as variáveis no topo de `app.js`:

```javascript
const _CODIGO_MEMBRO = 'ile2025';    // senha dos filhos de santo
const _CODIGO_ADMIN  = 'ogumayre$'; // senha do administrador
```

Após editar, faça commit e push — o GitHub Pages serve o novo arquivo em segundos.

### Senhas por pessoa (limitação atual)

Com a estrutura atual (senha única hardcoded no JS), não é possível ter uma senha por filho de santo de forma segura. Para isso seria necessário um backend com autenticação individual (usuário + senha validados pelo GAS/banco de dados). Evolução possível no futuro.

### Chip 🔒 Filhos

Aparece na barra de navegação desktop. Em mobile o acesso se faz clicando diretamente em **Acervo** ou **Consumíveis**, que pedem a senha ao detectar nível insuficiente.

### Portal externo × portal interno

Visitantes veem o portal público: eventos abertos, galeria, orixás, pontos cantados. Filhos de santo fazem login com a senha de membro e desbloqueiam o portal interno: consumíveis, acervo e eventos fechados.

---

## 4. Manual do Usuário — Dia a Dia

### Adicionar um evento no calendário

1. Acesse o painel admin: `admin.html` (ou use a dev key)
2. Clique em **Calendário → Novo evento**
3. Preencha: data, título, tipo (Gira, Festa, Consulta…), descrição, responsável
4. Em **Visibilidade**: `aberto` para todos verem, `fechado` para mostrar só para membros
5. Clique em **Salvar** — o evento aparece na planilha e no app imediatamente

### Adicionar fotos à galeria

1. No painel admin, clique em **Galeria → Upload de fotos**
2. Escolha o **álbum** (existente ou crie um novo digitando o nome)
3. Selecione as fotos (múltiplos arquivos de uma vez)
4. Preencha título e data (opcionais)
5. Clique em **Enviar** — o Worker faz o upload para o R2 e registra na planilha

### Gerenciar o acervo (materiais do terreiro)

1. No painel admin, clique em **Acervo**
2. Use **Novo item** para cadastrar roupas, guias, ferramentas, etc.
3. Campos: nome, categoria, localização, quantidade, estado, observações
4. Os itens ficam na aba **Acervo** da planilha Google Sheets

### Controlar consumíveis (sal grosso, velas, etc.)

O dashboard na tela inicial (visível apenas para membros/admin) mostra o estoque em 4 níveis:

- **OK** (verde) — estoque suficiente
- **REPOR** (amarelo) — atenção, repor em breve
- **ALERTA** (laranja) — estoque baixo
- **URGENTE** (vermelho) — acabando, comprar imediatamente

Para atualizar o estoque: painel admin → **Consumíveis → editar item**.

### Acessar pontos cantados

1. Clique em **Pontos** na navegação
2. Filtre por entidade (Ogum, Oxóssi, Xangô, etc.)
3. Clique no ponto para abrir o player de áudio
4. O arquivo fica no R2, na pasta `Pontos Cantados/<Entidade>/`

### Como instalar o app no celular (PWA)

**Android (Chrome):** toque no menu (⋮) → _Adicionar à tela inicial_

**iPhone (Safari):** toque em Compartilhar (□↑) → _Adicionar à Tela de Início_

O app fica com ícone próprio e abre em tela cheia, sem barra do navegador.

---

## 5. Painel Admin — Guia Completo

### Acessando o painel

- **URL normal:** `admin.html` — pede a senha admin (`ogumayre$`)
- **Dev key (sem login):** `admin.html?dev=ile_ase_dev_2024_falsp`

### Seções do painel

**Calendário**
- Listar, criar, editar e excluir eventos
- Campo **Visibilidade**: `aberto` (todos veem) ou `fechado` (só membros)
- Cor dos pontos no calendário: dourado = aberto, azul = fechado, roxo = festa recorrente

**Galeria**
- Upload de fotos para o R2 (múltiplos arquivos de uma vez)
- Organizadas por álbum (slug gerado automaticamente pelo Worker)
- Excluir foto: remove do R2 e da planilha simultaneamente
- Visualizar galeria pública antes de publicar

**Acervo**
- Cadastro de itens do terreiro (roupas, guias, objetos rituais)
- Campos: nome, categoria, localização, quantidade, estado (bom/regular/ruim), observações
- Edição e exclusão de itens

**Consumíveis**
- Estoque de materiais de consumo (velas, sal grosso, etc.)
- Configuração dos limites: mínimo (URGENTE), baixo (ALERTA), normal (REPOR), ideal (OK)
- Dashboard de nível de estoque visível para membros na tela inicial

**Entidades**
- Cadastro das entidades do terreiro (Ogum, Oxóssi, Xangô, etc.)
- Campos: nome, qualidade, cor, saudação, dia da semana, descrição
- Usados na seção Orixás do app

**Pontos Cantados**
- Lista de pontos com link para o áudio no R2
- Associados a uma entidade
- O arquivo CSV `pontos_cantados.csv` no repositório é a fonte de dados do painel

**Log de operações**
- Histórico das ações realizadas no painel (quem fez o quê e quando)
- Salvo na aba `Log` da planilha

### Token do Worker (upload de fotos)

O upload de fotos exige o `ADMIN_TOKEN` definido no Cloudflare Dashboard:

1. Acesse `dash.cloudflare.com` → Workers → terreiro-proxy
2. Vá em **Settings → Variables**
3. O campo `ADMIN_TOKEN` é uma **Secret** (nunca exposta no código)

No painel admin, o campo **Token do Worker** precisa receber esse mesmo valor para que o upload funcione.

---

## 6. Google Apps Script (GAS)

### O que é

O GAS é o backend do sistema: um script hospedado no Google que lê e escreve na planilha Google Sheets. Ele roda como Web App e responde a requisições HTTP do Cloudflare Worker.

### Arquivo

`Terreiro_AppsScript.gs` no repositório — copiar e colar no editor do Google Apps Script.

### Como instalar / atualizar

1. Abra a planilha Google Sheets do terreiro
2. Vá em **Extensões → Apps Script**
3. Apague o conteúdo do editor e cole o conteúdo do arquivo `.gs`
4. Salve (Ctrl+S)
5. Clique em **Implantar → Gerenciar implantações**
6. Se for a primeira vez: **Nova implantação** — tipo **App da Web**, executar como **Eu**, acesso **Qualquer pessoa**
7. Se for atualização: edite a implantação existente e incremente a versão
8. Copie a URL gerada — é a URL que vai no Worker como `GAS_URL`

### Primeira configuração (setup)

Apenas na primeira vez, execute a função `setup()` no editor do GAS:

1. No editor, selecione a função `setup` no menu suspenso
2. Clique em **Executar**
3. Isso cria todas as abas necessárias na planilha (Calendário, Acervo, Consumíveis, etc.)

### Endpoints disponíveis

Todos passam `?token=ile_ase_dev_2024_falsp` e são roteados pelo Worker:

| `acao=` | Descrição |
|---------|-----------|
| `acervo-listar` | Lista itens do acervo |
| `consumiveis-listar` | Lista consumíveis com nível de estoque |
| `entidades-listar` | Lista entidades cadastradas |
| `calendario-listar` | Lista eventos (campo `visibilidade` incluso) |
| `galeria-listar` | Lista fotos com album e albumSlug |
| `galeria-inserir` | POST — registra foto na planilha |
| `galeria-deletar` | POST — remove linha da planilha |
| `datas-mes` | Aniversariantes e festas do mês |
| `pontos-listar` | Lista pontos cantados |
| `lista-listar` | Lista de presença / outra lista |

### Autorizações necessárias

Na primeira execução o GAS pedirá permissão para acessar o Google Sheets. Aceite com a conta dona da planilha. Se aparecer aviso de app não verificado, clique em **Avançado → Ir para [nome] (não seguro)**.

---

## 7. Cloudflare Worker — Deploy

### O que faz o Worker

- Intermedia todas as chamadas do frontend para o Google Apps Script (CORS, autenticação)
- Faz upload de fotos para o Cloudflare R2
- Expõe endpoints de galeria (listar álbuns, upload, deletar foto do R2)

### Arquivos

- `worker.js` — código do Worker
- `wrangler.toml` — configuração de deploy (nome, account_id, bucket R2)

### Pré-requisitos

1. Conta no Cloudflare (plano gratuito funciona)
2. Node.js instalado localmente
3. Wrangler CLI: `npm install -g wrangler`
4. Login: `wrangler login`

### Variáveis de ambiente (Secrets)

**NUNCA** colocar no `wrangler.toml`. Definir no Dashboard ou via CLI:

```bash
wrangler secret put ADMIN_TOKEN
wrangler secret put GAS_URL
```

Ou pelo Dashboard: Workers → terreiro-proxy → Settings → Variables → Add variable (marcar como Secret).

| Variável | Descrição |
|----------|-----------|
| `GAS_URL` | URL da implantação do Apps Script |
| `ADMIN_TOKEN` | Token secreto para autenticar uploads de fotos |

### Deploy

```bash
cd ile-ase-vodun
npx wrangler deploy
```

Isso publica o `worker.js` como Worker chamado `terreiro-proxy` na sua conta Cloudflare.

### Testar localmente

```bash
npx wrangler dev
```

O Worker roda em `localhost:8787`. O frontend precisa apontar para essa URL nos testes locais.

### Bucket R2

O bucket `terreiro-pontos` precisa existir antes do deploy. Para criar:

```bash
npx wrangler r2 bucket create terreiro-pontos
```

No `wrangler.toml` o binding R2 aponta para esse bucket:

```toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "terreiro-pontos"
```

### Pastas do R2

| Pasta | Conteúdo |
|-------|----------|
| `Pontos Cantados/` | Áudios dos pontos por entidade |
| `Pontos de Fundamento/` | Pontos de fundamento do terreiro |
| `Galeria/` | Fotos: `Galeria/<slug-album>/<timestamp>-<nome>.<ext>` |

---

## 8. Planilha Google Sheets — Estrutura

A planilha é criada automaticamente pela função `setup()` do GAS. Cada aba tem estrutura fixa.

### Aba: Calendário

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
| I | Visibilidade | `aberto` (padrão) ou `fechado` |

### Aba: Galeria

| Col | Campo | Notas |
|-----|-------|-------|
| A | ID | ex: `GAL-001` |
| B | Título | legenda da foto |
| C | URL | link direto no R2 |
| D | Data | `YYYY-MM-DD` (opcional) |
| E | Álbum | nome legível (ex: `Festa Ogum 2025`) |
| F | Legenda extra | texto livre (opcional) |
| G | Ordem | número para sequência (menor = primeiro) |
| H | Album Slug | ex: `festa-ogum-2025` (gerado pelo Worker) |

### Aba: Acervo

| Col | Campo | Notas |
|-----|-------|-------|
| A | ID | gerado |
| B | Nome | nome do item |
| C | Categoria | roupa, guia, ferramenta… |
| D | Localização | onde está guardado |
| E | Quantidade | |
| F | Estado | bom, regular, ruim |
| G | Observações | |
| H | Cadastrado em | |

### Aba: Consumíveis

| Col | Campo | Notas |
|-----|-------|-------|
| A | ID | |
| B | Nome | ex: `Vela branca` |
| C | Quantidade | estoque atual |
| D | Unidade | un, kg, L… |
| E | Mínimo | abaixo disso = URGENTE |
| F | Baixo | abaixo disso = ALERTA |
| G | Normal | abaixo disso = REPOR |
| H | Observações | |

### Aba: Entidades

| Col | Campo | Notas |
|-----|-------|-------|
| A | ID | |
| B | Nome | ex: `Ogum` |
| C | Qualidade | ex: `Ayre` |
| D | Cor | |
| E | Saudação | ex: `Oke Oke Ogum!` |
| F | Dia da semana | |
| G | Descrição | texto livre |

### Aba: Log

Registro automático de todas as operações do painel admin (quem, o que, quando).

---

## 9. Deploy no GitHub Pages

### Como funciona

O repositório `falssp/terreiro-gestao` no GitHub tem o GitHub Pages habilitado. Qualquer push para a branch `main` publica automaticamente os arquivos em `https://falssp.github.io/terreiro-gestao/`.

### Fluxo de atualização

1. Edite os arquivos localmente (ou direto no GitHub)
2. Faça commit das alterações
3. Faça push para a branch `main`
4. O GitHub Pages serve o novo conteúdo em segundos (sem build, sem CI)

### Editar direto no GitHub (sem instalar nada)

1. Acesse `github.com/falssp/terreiro-gestao`
2. Navegue até o arquivo que quer editar (ex: `ile-ase-vodun/app.js`)
3. Clique no lápis (Edit this file)
4. Faça a alteração
5. Clique em **Commit changes** com uma mensagem descritiva

### Arquivos principais

| Arquivo | Quando editar |
|---------|---------------|
| `app.js` | Lógica, dados, senhas de acesso |
| `index.html` | Layout e estilos do app |
| `admin.html` | Painel administrativo |
| `faq.html` | Perguntas frequentes / ajuda |
| `pontos_catalog.json` | Catálogo de pontos cantados |
| `Terreiro_AppsScript.gs` | Código do GAS (não é servido pelo Pages) |
| `worker.js` | Código do Worker (deploy via Wrangler) |

### Forçar atualização no celular

O app usa Service Worker (cache). Para forçar o carregamento da versão nova:

- **Android:** Segure o ícone do app → Informações do app → Armazenamento → Limpar cache
- **iPhone:** Configurações → Safari → Limpar histórico e dados
- Ou abra o app, puxe para baixo para recarregar e aguarde alguns segundos

---

## 10. Segurança

### Proteções implementadas

O app bloqueia as formas digitais/browser de copiar ou imprimir conteúdo:

| Ação bloqueada | Método |
|----------------|--------|
| Clique direito | `contextmenu` event preventDefault |
| Ctrl+P (imprimir) | `keydown` event preventDefault |
| Ctrl+S (salvar) | `keydown` event preventDefault |
| Ctrl+U (ver fonte) | `keydown` event preventDefault |
| F12 (DevTools) | `keydown` event preventDefault |
| Ctrl+Shift+I/J/C (DevTools) | `keydown` event preventDefault |
| Selecionar texto | CSS `user-select: none` |
| Imprimir via browser | CSS `@media print { display: none }` |
| Arrastar imagens | `dragstart` event preventDefault |
| Print Screen (flash) | Torna o body opacity:0 por 300ms |

### Limite real das proteções

As proteções **não impedem**:

- Print Screen via sistema operacional (Windows Snipping Tool, botão Print Screen físico)
- Captura de tela pelo próprio celular (botão volume + power)
- Fotografar a tela com outro celular ou câmera
- Inspecionar via ferramentas externas

Isso é uma limitação fundamental do navegador: o JavaScript não tem controle sobre o sistema operacional. Nenhum site resolve isso completamente, nem Netflix, nem bancos.

### Senhas e tokens

| Item | Onde está |
|------|-----------|
| Senha membro (`ile2025`) | `app.js` — variável `_CODIGO_MEMBRO` |
| Senha admin (`ogumayre$`) | `app.js` — variável `_CODIGO_ADMIN` |
| Dev key (GAS token) | `app.js` hardcoded como `ile_ase_dev_2024_falsp` |
| ADMIN_TOKEN (upload fotos) | Cloudflare Dashboard — Secret, nunca no código |
| GAS_URL | Cloudflare Dashboard — Variável |

### Boas práticas

- Troque as senhas (`_CODIGO_MEMBRO` e `_CODIGO_ADMIN`) antes de disponibilizar o app para uso real
- O `ADMIN_TOKEN` do Cloudflare nunca deve aparecer no `wrangler.toml` nem no frontend
- A dev key `ile_ase_dev_2024_falsp` é para uso em desenvolvimento — em produção ela dá acesso irrestrito ao GAS, mas não ao painel admin nem ao upload de fotos (que exige o `ADMIN_TOKEN`)

---

## 11. Referência Rápida

### URLs

| Recurso | URL |
|---------|-----|
| App (público) | https://falssp.github.io/terreiro-gestao/ile-ase-vodun/ |
| Painel admin | https://falssp.github.io/terreiro-gestao/ile-ase-vodun/admin.html |
| Painel admin (dev) | https://falssp.github.io/terreiro-gestao/ile-ase-vodun/admin.html?dev=ile_ase_dev_2024_falsp |
| Ajuda / FAQ | https://falssp.github.io/terreiro-gestao/ile-ase-vodun/faq.html |
| GAS Proxy (Worker) | https://terreiro-proxy.falssp.workers.dev |
| Mídia (R2) | https://pub-201d65298a0941d4939bf1e902d17c18.r2.dev |
| Repositório | https://github.com/falssp/terreiro-gestao |
| Cloudflare Dashboard | https://dash.cloudflare.com |
| Google Apps Script | https://script.google.com |

### Senhas de acesso ao app

| Nível | Senha | Variável no código |
|-------|-------|-------------------|
| Membro (filhos de santo) | `ile2025` | `_CODIGO_MEMBRO` em `app.js` |
| Admin | `ogumayre$` | `_CODIGO_ADMIN` em `app.js` |

### Tokens e chaves

| Item | Onde está |
|------|-----------|
| Dev key (GAS token) | `app.js` — hardcoded como `ile_ase_dev_2024_falsp` |
| ADMIN_TOKEN (upload fotos) | Cloudflare Dashboard — Secret |
| GAS_URL | Cloudflare Dashboard — Variável |

### Tecnologias — links de administração

| Serviço | Acesso |
|---------|--------|
| GitHub Pages | github.com/falssp/terreiro-gestao |
| Cloudflare Worker | dash.cloudflare.com → Workers → terreiro-proxy |
| Cloudflare R2 | dash.cloudflare.com → R2 → terreiro-pontos |
| Google Apps Script | script.google.com (ou Extensões na planilha) |
| Google Sheets | sheets.google.com (planilha do terreiro) |
| Backblaze B2 (backup) | secure.backblaze.com → bucket terreiro-pontos-backup |

### Cores do sistema (CSS)

| Variável | Valor | Uso |
|----------|-------|-----|
| `--bg` | `#0f0f0f` | Fundo geral |
| `--card` | `#1a1a1a` | Fundo dos cards |
| `--ouro` | `#c9a84c` | Cor principal (dourado) |
| `--ouro-lt` | `#f0d060` | Dourado claro (hover) |
| `--cinza` | `#999` | Texto secundário |
| `--borda` | `rgba(201,168,76,.22)` | Bordas suaves |

### Calendário — cores dos pontos

| Cor | Significado |
|-----|-------------|
| Dourado | Evento aberto (todos veem) |
| Azul | Evento fechado (só membros) |
| Roxo | Festa recorrente (hardcoded no código) |
