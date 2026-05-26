<h1 align="center">Rejis Finance</h1>

<p align="center">
  Sistema web de controle financeiro construído sob demanda para uma empresa de construção civil que sofria com falta de visibilidade e organização do fluxo de caixa.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss" alt="Tailwind">
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/Claude_API-Anthropic-D97757" alt="Claude">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT">
</p>

---

## 📋 Sobre o projeto

A empresa registrava todas as movimentações financeiras manualmente (em planilha + papel), o que tornava impossível ter qualquer visão consolidada de fluxo de caixa, contas a pagar ou resultado do mês. Esse projeto resolve isso entregando:

- Cadastro rápido de **entradas e saídas** com upload de comprovantes
- **OCR automático** dos documentos via IA (lê o boleto/nota e preenche os campos)
- **Calendário visual** de contas a pagar com legenda de status
- **Relatórios diários, mensais, trimestrais e anuais** com exportação em PDF
- **Dashboard** com saldo do mês, gráfico de fluxo e últimas movimentações
- Tudo persistido em **banco de dados na nuvem**, acessível de qualquer dispositivo

## ✨ Principais features

| Área | O que tem |
|------|-----------|
| **Dashboard** | Cards animados (entradas, saídas, saldo, transações) + gráfico de barras do fluxo mensal + lista das últimas movimentações |
| **Entradas/Saídas** | CRUD completo com upload de documentos (PDF/JPG/PNG) pro Supabase Storage; OCR automático via Claude API preenche descrição/valor/data/categoria |
| **Contas a Pagar** | Calendário interativo com marcadores coloridos por status (paga/pendente/atrasada); modal de detalhes com botões de imprimir e exportar PDF |
| **Relatórios** | 4 níveis de fechamento (diário/mensal/trimestral/anual) com seletores de período, cards animados que revelam cor conforme saldo, e exportação em PDF |
| **Tema** | Light/Dark mode com persistência por usuário (next-themes) |
| **Input monetário** | Componente custom que digita no padrão ATM brasileiro (R$ 0,00 → R$ 0,01 → R$ 0,12 → R$ 1,23) |
| **Estado em tempo real** | Context API com sincronização entre abas via storage event + optimistic updates |

## 🛠️ Stack técnica

### Frontend
- **Next.js 16** (App Router) com **React 19** e **TypeScript**
- **TailwindCSS** + sistema de design baseado em **CSS variables** (HSL) para suporte dark mode
- **Motion** (Framer Motion) para animações declarativas (page transitions, stagger, optimistic UI)
- **Recharts** para visualização de dados financeiros
- **React Hook Form + Zod** para formulários validados
- **Sonner** para toasts não-bloqueantes
- **react-day-picker** para o calendário de vencimentos
- **next-themes** para gerenciamento de tema com SSR

### Backend
- **API Routes** do Next.js (serverless functions)
- **Supabase** (PostgreSQL gerenciado) para persistência
- **Supabase Storage** para upload de documentos com **signed URLs** (1h de expiração)
- **Service Role** isolado no servidor — frontend nunca acessa o banco diretamente

### Inteligência
- **Anthropic Claude API** para extração de dados de notas fiscais/comprovantes
  - Suporta PDF e imagens (JPEG, PNG, WEBP)
  - Prompt estruturado retorna JSON validado (descricao, valor, data, categoria)

### PDF
- **jsPDF** para geração client-side de relatórios e detalhes de contas
- Layouts customizados com cabeçalho colorido, destaque de saldo positivo/negativo, e tabela de movimentação

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────┐
│             Browser (Next.js)               │
│  ┌───────────────────────────────────────┐  │
│  │  Pages (App Router) + Client Comps    │  │
│  │       ↓                                │  │
│  │  Stores (Context + optimistic UI)     │  │
│  │       ↓                                │  │
│  └───────────────────────────────────────┘  │
└──────────────────┬──────────────────────────┘
                   │ fetch
                   ↓
┌─────────────────────────────────────────────┐
│        API Routes (server-side only)         │
│  /api/transacoes   /api/contas              │
│  /api/upload       /api/upload/url           │
│  /api/ocr          /api/supabase-test        │
└──────────────────┬──────────────────────────┘
                   │ Service Role
                   ↓
┌─────────────────────────────────────────────┐
│              Supabase                        │
│   PostgreSQL  +  Storage  +  Auth (ready)   │
└─────────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│           Claude API (Anthropic)             │
│        OCR de notas fiscais/recibos          │
└─────────────────────────────────────────────┘
```

## 📁 Estrutura de pastas

```
src/
├── app/                    # App Router (páginas + API routes)
│   ├── page.tsx           # Dashboard
│   ├── entradas/          # CRUD de entradas
│   ├── saidas/            # CRUD de saídas
│   ├── contas-a-pagar/    # Calendário + lista de contas
│   ├── relatorios/        # 4 níveis de fechamento + export PDF
│   ├── investimentos/     # Sugestões (placeholder)
│   └── api/               # Endpoints serverless
│       ├── transacoes/    # GET, POST, DELETE
│       ├── contas/        # GET, POST, DELETE, PATCH
│       ├── upload/        # POST file + GET signed URL
│       └── ocr/           # POST file → JSON estruturado
├── components/
│   ├── ui/                # Primitives (Button, Card, Dialog, Calendar, Spinner, CurrencyInput…)
│   ├── dashboard/         # CardResumo, FluxoMesGrafico, StaggerContainer
│   ├── contas/            # Dialogs de nova conta e detalhes
│   ├── transacoes/        # Dialog genérico (entrada/saída)
│   ├── relatorios/        # CardFechamento com animação de cor
│   └── documento/         # Botão de visualizar/baixar arquivos do Storage
├── lib/
│   ├── store/             # Context providers (transacoes, contas) com persistência
│   ├── supabase/          # Clients (admin com service_role, server, browser)
│   ├── ocr/               # Integração Claude
│   ├── pdf/               # Geradores de PDF (relatório, conta)
│   ├── formatters.ts      # BRL, datas pt-BR
│   └── utils.ts
└── types/
    └── financeiro.ts

supabase/
└── schema.sql             # Tabelas, índices, triggers, RLS, bucket de storage
```

## 🚀 Setup local

### Pré-requisitos
- Node.js 20+ e npm
- Conta no [Supabase](https://supabase.com) (free tier)
- Conta na [Anthropic](https://console.anthropic.com) (opcional — só pra OCR)

### Instalação

```bash
git clone https://github.com/DiogoLamera/Rejis-Finanças.git
cd Rejis-Finanças
npm install
```

### Configurar Supabase

1. Crie um projeto novo no Supabase
2. Rode o conteúdo de `supabase/schema.sql` no SQL Editor
3. Copie as credenciais da seção "API" das configurações
4. Crie um arquivo `.env.local` na raiz:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
ANTHROPIC_API_KEY=sk-ant-...  # opcional
```

### Rodar em desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:3000

### Build de produção

```bash
npm run build
npm start
```

## 🎯 Decisões técnicas notáveis

- **Service Role isolado no servidor** — frontend só fala com API Routes, nunca direto com o Supabase. Isso permite manter RLS estrito e adicionar autorização granular depois sem reescrever o frontend.
- **Optimistic UI** nos stores — transações aparecem instantaneamente; revertem só se a API retornar erro. UX percebida como local mesmo dependendo de rede.
- **Signed URLs com expiração de 1h** para documentos — bucket privado, links temporários gerados sob demanda.
- **CSS variables HSL** no design system — permite trocar paleta inteira mudando 1 arquivo, e dark mode "de graça".
- **Mock determinístico para fechamentos** durante desenvolvimento — função `seeded()` retornava valores plausíveis e consistentes por data antes da integração real com o banco.
- **Input monetário no padrão brasileiro** — implementação custom que mantém o cursor sempre no fim e trata digitação como appending de centavos.

## 📄 Licença

[MIT](LICENSE) © Diogo Lamera

---

<p align="center">
  <sub>Construído com Next.js, Supabase e Claude API.</sub>
</p>
