# Terreiro Gestão — Produto & Modelo de Negócio

> Documento interno de referência para precificação, onboarding e custos operacionais.

---

## O que é o produto

Sistema completo de gestão digital para terreiros de Umbanda, entregue como PWA (Progressive Web App) acessível pelo celular sem instalação. Cada terreiro recebe sua própria instância com:

- Acervo de peças e itens rituais
- Controle de estoque (consumíveis) com alertas visuais
- Calendário de giras e eventos
- Galeria fotográfica
- Catálogo de orixás e entidades
- Pontos cantados com player de áudio (645+ pontos base)
- Área privada para filhos de santo (acesso por código)
- Painel administrativo para o zelador/a

---

## Stack tecnológica

| Serviço | Uso | Custo |
|---------|-----|-------|
| GitHub Pages | Hospedagem do frontend (HTML/JS) | Grátis |
| Google Apps Script | Backend / API (lógica + autenticação) | Grátis |
| Google Sheets | Banco de dados do terreiro | Grátis |
| Cloudflare Worker | Proxy HTTPS para o GAS (contorna CORS) | Grátis até 100k req/dia |
| Cloudflare R2 | Storage de áudio dos pontos cantados | Grátis até 10 GB + 1M ops/mês |
| Cloudflare DNS | DNS do domínio personalizado | Grátis |
| Domínio `.com.br` | URL própria (ex: meuterreiro.com.br) | ~R$ 40/ano (Registro.br) |

**Custo de infra por terreiro: R$ 0 sem domínio / ~R$ 40/ano com domínio.**

> Todos os serviços operam dentro das cotas gratuitas para o volume típico de um terreiro. O único custo recorrente obrigatório é o domínio, caso o cliente queira URL personalizada.

### Limites das cotas gratuitas (referência)

| Serviço | Cota gratuita | Terreiro típico |
|---------|---------------|-----------------|
| GAS execuções | 6 min/exec, 90 min/dia | < 5 min/dia |
| GAS chamadas URL | 20.000/dia | < 200/dia |
| Cloudflare Worker | 100.000 req/dia | < 1.000/dia |
| Cloudflare R2 storage | 10 GB/mês | ~500 MB (áudio) |
| Cloudflare R2 leitura | 10 milhões ops/mês | < 50.000/mês |
| GitHub Pages bandwidth | 100 GB/mês | < 1 GB/mês |

---

## Modelo de negócio proposto

### Opção A — Setup + Mensalidade (recomendado)

| Item | Valor sugerido |
|------|---------------|
| Setup inicial (configuração, personalização, importação de dados) | R$ 600 – R$ 1.200 |
| Mensalidade (manutenção, suporte, atualizações) | R$ 80 – R$ 150/mês |
| Domínio personalizado (repassado ao cliente) | R$ 40/ano (~R$ 3,50/mês) |

**Racional:** Setup cobre o trabalho de configuração (~4–8h). Mensalidade cobre suporte e garante receita recorrente previsível.

---

### Opção B — Anual (para quem prefere não ter mensalidade)

| Item | Valor sugerido |
|------|---------------|
| Setup inicial | R$ 600 – R$ 1.200 |
| Licença anual (inclui suporte e atualizações) | R$ 600 – R$ 900/ano |
| Domínio (repassado) | R$ 40/ano |

**Racional:** Equivale a ~R$ 50–75/mês. Mais fácil de vender para quem tem resistência a assinatura mensal.

---

### Opção C — One-time (venda única, sem suporte contínuo)

| Item | Valor sugerido |
|------|---------------|
| Setup completo + 3 meses de suporte inclusos | R$ 1.500 – R$ 2.500 |
| Suporte adicional após 3 meses (por hora) | R$ 100 – R$ 150/hora |
| Domínio (repassado) | R$ 40/ano |

**Racional:** Menor barreira de entrada, mas sem receita recorrente. Indicado para clientes que querem autonomia total.

---

## O que está incluso no setup

- [ ] Configuração do repositório GitHub (fork do template)
- [ ] Configuração do Google Sheets com as abas padrão
- [ ] Deploy do Google Apps Script com URL do terreiro
- [ ] Configuração do Cloudflare Worker (proxy)
- [ ] Upload dos arquivos de áudio no Cloudflare R2
- [ ] Personalização: nome, cores, logo e informações do terreiro
- [ ] Importação dos dados iniciais (acervo, consumíveis, pontos)
- [ ] Domínio personalizado + DNS (se contratado)
- [ ] Treinamento com o zelador/a (1 hora via chamada)
- [ ] Documentação de uso simplificada

**Tempo estimado de setup: 4–8 horas**

---

## O que está incluso na manutenção mensal

- Atualização do catálogo de pontos cantados (quando disponível)
- Suporte para dúvidas e pequenas alterações
- Atualização de eventos no calendário (se solicitado)
- Monitoramento de cota dos serviços gratuitos
- Atualização do sistema quando houver melhorias

---

## Processo de onboarding (novo terreiro)

### 1. Coleta de dados (formulário ou conversa)
- Nome do terreiro
- Linha de trabalho (Umbanda, Candomblé, linha específica)
- Responsável (zelador/a) e contato
- Quer domínio? Se sim, qual nome?
- Lista de itens do acervo (pode ser feita depois)
- Lista de consumíveis
- Agenda de giras recorrentes
- Fotos (logo, galeria inicial)

### 2. Provisionar infraestrutura (~2h)
```
1. Fork do repositório template no GitHub
2. Criar planilha Google Sheets (copiar template)
3. Deploy do Google Apps Script (definir doGet/doPost)
4. Criar Cloudflare Worker (copiar worker.js, ajustar URL do GAS)
5. Criar bucket R2 (se vai ter pontos com áudio)
6. Registrar domínio no Registro.br (se contratado)
7. Configurar DNS no Cloudflare
8. Ativar GitHub Pages no repositório
```

### 3. Personalizar app (~1h)
```
- Editar app.js: nome, GAS URL, R2 URL
- Ajustar cores CSS se necessário
- Atualizar pontos cantados (filtrar por linha do terreiro)
- Configurar ícones PWA
```

### 4. Importar dados (~1–2h)
```
- Preencher aba Acervo na planilha
- Preencher aba Consumíveis com estoque inicial
- Adicionar eventos iniciais no Calendário
- Fazer upload das fotos iniciais
- Definir código(s) de acesso para filhos de santo
```

### 5. Entrega e treinamento (~1h)
```
- Testar todos os módulos
- Apresentar para o zelador/a
- Entregar documentação de uso
- Combinação de como funciona o suporte
```

---

## Concorrência e posicionamento

| Solução | Custo | Adequado para terreiros? |
|---------|-------|--------------------------|
| Planilha Excel/Sheets manual | Grátis | Sim, mas sem controle de estoque visual nem app |
| App genérico (Notion, Airtable) | R$ 30–100/mês | Parcialmente, sem identidade visual |
| Sistema de gestão religioso | R$ 200–500/mês | Foco em igrejas cristãs |
| **Terreiro Gestão** | **R$ 0–150/mês** | **Sim, desenvolvido para Umbanda** |

**Diferencial:** Único sistema desenvolvido especificamente para Umbanda, com pontos cantados, entidades, controle de acervo ritual e respeito à LGPD.

---

## Referências de URL

| Recurso | URL |
|---------|-----|
| Landing page (vendas) | https://falssp.github.io/terreiro-gestao/ |
| Demo navegável | https://falssp.github.io/terreiro-gestao/demo/ |
| Terreiro ativo (Ile Ase Vodun) | https://falssp.github.io/terreiro-gestao/ile-ase-vodun/ |
| Repositório | https://github.com/falssp/terreiro-gestao |
| WhatsApp de contato | https://wa.me/5511989202958 |

---

*Última atualização: outubro 2026*
