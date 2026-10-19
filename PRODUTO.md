# Terreiro Gestão — Produto & Modelo de Negócio

> Documento interno. Não publicar.

---

## Stack e pontos de ruptura de infra

A infra começa gratuita mas escala com o número de terreiros ativos. Precificar considerando os custos reais desde o primeiro terreiro pago.

| Serviço | Cota gratuita | Custo excedente | Ponto de ruptura |
|---------|--------------|-----------------|-----------------|
| Cloudflare R2 (storage áudio) | 10 GB/mês | US$ 0,015/GB | ~20 terreiros (500 MB cada) |
| Cloudflare R2 (leitura) | 1M ops/mês | US$ 0,36/M ops | ~15 terreiros ativos |
| Cloudflare Worker (proxy) | 100k req/dia | US$ 5/mês (+10M req) | ~200 terreiros |
| Google Apps Script | 90 min exec/dia | Sem plano pago — requer conta separada por terreiro | ~400 terreiros no mesmo projeto |
| GitHub Pages (bandwidth) | 100 GB/mês | Plano pago GitHub | ~2.000 terreiros |
| Domínio .com.br | — | R$ 40/ano (Registro.br) | por terreiro |

**Custo operacional estimado por terreiro/mês (a partir do 15º terreiro ativo):**
- R2 storage: ~US$ 0,008 (R$ ~0,05)
- R2 leitura: ~US$ 0,024 (R$ ~0,14)
- Worker proporcional: ~US$ 0,025 (R$ ~0,15)
- GAS: precisa de conta Google separada por bloco de terreiros
- **Total infra: ~R$ 0,35–1,00/terreiro/mês**

> O custo de infra é irrelevante para precificação — o valor está no serviço e na exclusividade para o nicho.

---

## Proposta de valor

**Para o terreiro:**
- Para de perder consumível por falta de controle (compra de emergência custa mais)
- Zelador/a para de responder "qual a data da gira?" no WhatsApp
- Filhos acessam pontos, calendário e entidades pelo celular a qualquer hora
- Galeria e catálogo espiritual = memória e identidade da casa
- Aparência profissional para visitantes e novos filhos

**Posicionamento de mercado:**

| Solução | Custo mensal | Serve terreiro? |
|---------|-------------|----------------|
| Site Wix/Squarespace | R$ 80–150/mês | Parcialmente — só vitrine |
| Linktree pago | R$ 40–80/mês | Só links |
| App por agência | R$ 500+/mês + setup R$ 5k–15k | Genérico, caro |
| Planilha manual | R$ 0 | Sem controle, sem app |
| **Terreiro Gestão** | **a definir** | **Único feito para Umbanda** |

---

## Módulos do sistema

| Módulo | Acesso padrão | Pode ser opcional |
|--------|--------------|-------------------|
| Calendário de giras | Público | Não — é core |
| Pontos Cantados (645+) | Público | Não — é core |
| Galeria fotográfica | Público | Sim |
| Orixás & Entidades | Público | Sim |
| Acervo de peças | Filhos | Sim |
| Controle de estoque | Filhos | Sim |
| Área dos filhos (auth) | Filhos | Não se tiver Acervo/Estoque |
| Painel administrativo | Admin | Sim |
| Player de áudio offline | Todos | Sim (depende de ter áudio no R2) |
| PWA (instala no celular) | Todos | Não — é a entrega |

---

## Modelos de comercialização

### Modelo 1 — SaaS Mensal (recorrência, recomendado para escala)

O terreiro paga uma mensalidade que inclui tudo.

| Plano | Módulos | Valor sugerido |
|-------|---------|---------------|
| **Básico** | Calendário + Pontos + PWA | R$ 97/mês |
| **Completo** | Tudo acima + Acervo + Estoque + Galeria + Entidades | R$ 197/mês |
| **Premium** | Tudo + domínio personalizado + suporte prioritário | R$ 297/mês |

Setup único (todos os planos): R$ 500–800

**Por que funciona:** Wix cobra R$ 80–150 e não faz nada disso. R$ 97–197 é defensável.

---

### Modelo 2 — Anual (desconto por comprometimento)

| Plano | Valor anual | Equivalente mensal | Economia |
|-------|------------|-------------------|----------|
| Básico anual | R$ 870/ano | R$ 72,50/mês | ~25% |
| Completo anual | R$ 1.740/ano | R$ 145/mês | ~26% |
| Premium anual | R$ 2.640/ano | R$ 220/mês | ~26% |

Setup único: R$ 500–800

---

### Modelo 3 — One-time + Manutenção opcional

Para terreiros que querem pagar uma vez e ter autonomia.

| Item | Valor |
|------|-------|
| Setup completo (todos os módulos) | R$ 2.500–4.000 |
| Inclui: 6 meses de suporte | — |
| Manutenção mensal opcional após 6 meses | R$ 150/mês |
| Hora avulsa de suporte | R$ 150/hora |

**Risco:** sem receita recorrente. Indicado como exceção, não como padrão.

---

### Modelo 4 — Módulos à la carte (para terreiros menores)

Só paga o que usa. Útil para entrada no produto.

| Módulo | Valor/mês | Valor/ano |
|--------|-----------|-----------|
| Core (Calendário + Pontos + PWA) | R$ 67/mês | R$ 670/ano |
| + Galeria | +R$ 30/mês | +R$ 300/ano |
| + Acervo & Estoque | +R$ 50/mês | +R$ 500/ano |
| + Entidades | +R$ 20/mês | +R$ 200/ano |
| + Domínio personalizado | +R$ 40/ano | — |
| Setup | R$ 300–500 | — |

---

## O que está incluso no setup (todos os planos)

- Configuração do repositório e GitHub Pages
- Google Sheets com as abas do plano contratado
- Google Apps Script (backend) com URL do terreiro
- Cloudflare Worker (proxy) configurado
- Upload do acervo de áudio no R2 (se plano tiver Pontos)
- Personalização: nome, cores, informações do terreiro
- Importação dos dados iniciais fornecidos pelo terreiro
- Domínio personalizado (se plano incluir)
- Treinamento com o zelador/a — 1h via chamada
- Documentação de uso simplificada

**Tempo estimado de setup: 4–8 horas**

---

## Processo de onboarding (novo terreiro)

### 1. Coleta de dados
- Nome e linha do terreiro
- Responsável e WhatsApp
- Plano escolhido / módulos desejados
- Quer domínio? Qual nome?
- Lista de consumíveis e acervo (pode ser depois)
- Agenda recorrente de giras
- Fotos iniciais (logo + galeria)

### 2. Provisionar infra (~2h)

```
1. Fork do repositório template no GitHub
2. Criar planilha Google Sheets (copiar template)
3. Deploy do Google Apps Script → anotar URL do Web App
4. Criar Cloudflare Worker (copiar worker.js, ajustar URL do GAS)
5. Criar bucket R2 (se plano tiver Pontos com áudio)
6. Registrar domínio no Registro.br (se contratado)
7. Configurar DNS no Cloudflare
8. Ativar GitHub Pages no repositório
```

### 3. Personalizar (~1h)

```
- Editar app.js: nome do terreiro, GAS URL, R2 URL
- Ajustar cores CSS se solicitado
- Filtrar catálogo de pontos por linha do terreiro
- Configurar ícones PWA
```

### 4. Importar dados (~1–2h)

```
- Preencher aba Consumíveis com estoque inicial
- Cadastrar acervo inicial
- Adicionar eventos no Calendário
- Upload das fotos iniciais
- Definir código(s) de acesso dos filhos
```

### 5. Entrega e treinamento (~1h)

```
- Testar todos os módulos contratados
- Apresentar para o zelador/a
- Entregar documentação de uso
- Combinar dinâmica de suporte
```

---

## Escalabilidade da infra com crescimento

| Nº de terreiros | Custo de infra/mês | Receita estimada (Completo) | Margem |
|----------------|--------------------|-----------------------------|--------|
| 1–15 | R$ 0 | R$ 197–2.955 | ~100% |
| 16–50 | ~R$ 20–60 | R$ 3.152–9.850 | >99% |
| 51–200 | ~R$ 80–200 | R$ 10.047–39.400 | >99% |
| 200+ | ~R$ 300–800 | R$ 39.400+ | >98% |

> A infra escala de forma irrelevante frente à receita. O gargalo real é o tempo de setup e suporte — não o custo de servidor.

**Implicação:** para escalar, o produto precisa de documentação de self-service ou de um processo de setup semi-automatizado. Não de mais servidor.

---

## URLs de referência

| Recurso | URL |
|---------|-----|
| Landing page | https://falssp.github.io/terreiro-gestao/ |
| Demo navegável | https://falssp.github.io/terreiro-gestao/demo/ |
| Terreiro ativo | https://falssp.github.io/terreiro-gestao/ile-ase-vodun/ |
| Repositório | https://github.com/falssp/terreiro-gestao |
| WhatsApp | https://wa.me/5511989202958 |

---

*Última atualização: outubro 2026*
