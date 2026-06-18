# Lumen Bible

Aplicativo web de leitura da Biblia com foco em:

- leitura bonita e confortavel
- modo claro e escuro
- leitura bilingue
- estudo de ingles com a Biblia
- anotacoes, destaques e favoritos
- integracao com versoes oficiais via API.Bible

O projeto foi construido com `React`, `TypeScript`, `Tailwind CSS` e `Vite`.

## Visao geral

O `Lumen Bible` foi pensado para deixar o texto no centro da experiencia.
Em vez de uma interface cheia de blocos concorrendo com a leitura, o app usa:

- fluxo continuo de versiculos
- paineis laterais recolhiveis
- leitura bilingue lado a lado ou em fluxo
- painel de estudo do verso selecionado
- controles discretos e foco em tipografia

Hoje o projeto esta configurado para trabalhar com estas 3 versoes oficiais:

- `NVT` (`Bíblia Sagrada, Nova Versão Transformadora`)
- `NLT` (`New Living Translation`)
- `NASB 1995` (`New American Standard Bible 1995`)

## Demo do conceito

Principais comportamentos da interface:

- leitura principal em `NVT`
- comparacao com `NLT` ou `NASB 1995`
- alternancia entre leitura em fluxo e leitura lado a lado
- anotacoes locais por verso
- destaques e favoritos salvos no navegador
- paineis laterais para manter o texto como foco central

## Stack

- `React 18`
- `TypeScript`
- `Vite`
- `Tailwind CSS`
- `Node.js`
- `API.Bible`

## Estrutura do projeto

```text
.
├─ docs/
│  └─ API_BIBLE.md
├─ scripts/
│  ├─ api-bible-proxy.mjs
│  ├─ build-verify.mjs
│  ├─ dev-server.mjs
│  └─ start-official.mjs
├─ src/
│  ├─ data/
│  │  └─ bible.ts
│  ├─ services/
│  │  └─ officialBible.ts
│  ├─ App.tsx
│  ├─ index.css
│  └─ main.tsx
├─ .env.example
├─ package.json
└─ README.md
```

## Como funciona a integracao da Biblia oficial

O app **nao** acessa a `API.Bible` diretamente do navegador com a chave privada.

Em vez disso, ele usa um pequeno proxy local:

- o proxy recebe as requisicoes do frontend
- o proxy chama a `API.Bible` com a chave
- o frontend recebe os livros, capitulos e versiculos prontos para uso

Isso ajuda a:

- evitar expor a chave no navegador
- separar a camada visual da camada de dados
- preparar o projeto para futura evolucao de backend

## Versoes configuradas

Os IDs atuais utilizados no projeto sao:

- `NVT`: `41a6caa722a21d88-01`
- `NLT`: `d6e14a625393b4da-01`
- `NASB 1995`: `b8ee27bcd1cae43a-01`

Esses IDs podem ser alterados depois no `.env` e no arquivo de dados, se voce quiser trocar as versoes.

## Requisitos

Antes de rodar localmente, tenha instalado:

- `Node.js 18+`
- `npm`

## Como rodar localmente

### 1. Instale as dependencias

```bash
npm install
```

### 2. Crie seu arquivo `.env`

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell, voce pode criar manualmente ou duplicar o arquivo.

Depois, preencha sua chave da `API.Bible`:

```env
API_BIBLE_KEY=sua_chave_aqui
API_BIBLE_PORT=8787
API_BIBLE_PRIMARY_ID=41a6caa722a21d88-01
API_BIBLE_SECONDARY_ID=d6e14a625393b4da-01
API_BIBLE_TERTIARY_ID=b8ee27bcd1cae43a-01
VITE_OFFICIAL_BIBLE_PROXY_URL=http://localhost:8787
```

### 3. Inicie a aplicacao

Opcao mais simples:

```bash
npm run start:official
```

Esse comando sobe:

- o proxy local da `API.Bible`
- o servidor de desenvolvimento do app

### 4. Abra no navegador

Normalmente o app fica disponivel em:

```text
http://localhost:4173
```

## Scripts disponiveis

### Desenvolvimento

```bash
npm run dev
```

Inicia apenas o app frontend.

### Proxy da Biblia oficial

```bash
npm run proxy:api-bible
```

Inicia apenas o proxy local da `API.Bible`.

### Desenvolvimento completo

```bash
npm run start:official
```

Inicia frontend + proxy juntos.

### Build de producao

```bash
npm run build
```

### Preview da build

```bash
npm run preview
```

### Deploy na Vercel

```bash
npm run deploy:vercel
```

## Como usar

Depois de abrir o app:

- clique no painel lateral esquerdo para escolher livro e capitulo
- altere a versao principal e a versao paralela
- ative ou desative o modo bilingue
- ajuste tamanho e espacamento da leitura
- clique em um versiculo para abrir o estudo lateral
- salve anotacoes, destaques e favoritos

## Persistencia local

O app salva no `localStorage`:

- preferencias de leitura
- tema claro/escuro
- anotacoes
- destaques
- favoritos

Isso significa que os dados permanecem no navegador local do usuario, mas ainda **nao** existe sincronizacao com conta ou backend proprio.

## Observacoes importantes sobre licenca e uso

Este projeto usa a `API.Bible` para carregar versoes oficiais.
Mesmo quando uma versao aparece com custo `US$0/mês`, o uso continua sujeito aos termos e licencas da propria plataforma e dos detentores das traducoes.

Antes de publicar um produto em producao, confira:

- o plano da sua conta
- as permissoes de uso comercial ou nao comercial
- as exigencias de atribuicao e copyright

Links uteis:

- [API.Bible](https://api.bible/)
- [How to use your API key](https://api.bible/api-key-guide)
- [Available Bibles](https://api.bible/bibles)

## Publicando no GitHub

Se este repositório for publico:

- **nunca** envie o arquivo `.env`
- **nunca** exponha sua `API_BIBLE_KEY`
- mantenha apenas o `.env.example` no repositório
- gere uma nova chave se uma chave anterior tiver sido compartilhada em conversa, imagem, commit ou print

O `.gitignore` deste projeto ja ignora:

- `.env`
- `node_modules`
- `dist`

## Deploy na Vercel

O projeto esta preparado para deploy na `Vercel` com:

- frontend `Vite`
- funcoes serverless em `api/bible/*`
- variavel segura `API_BIBLE_KEY` no ambiente da Vercel

### Variaveis de ambiente na Vercel

Configure pelo menos:

```env
API_BIBLE_KEY=sua_chave
```

Opcionalmente, para desenvolvimento local com proxy separado:

```env
VITE_OFFICIAL_BIBLE_PROXY_URL=http://localhost:8787
```

Em producao na Vercel, o frontend usa automaticamente as rotas:

- `/api/bible/books`
- `/api/bible/chapters`
- `/api/bible/chapter`

### Fluxo recomendado com o Vercel CLI

```bash
vercel pull
vercel env add API_BIBLE_KEY
vercel --prod
```

Se voce preferir, tambem pode usar:

```bash
npm run deploy:vercel
```

## Troubleshooting

### O app abre, mas nao carrega os versiculos

Verifique se:

- o proxy esta rodando
- a chave da `API.Bible` esta correta
- a porta do proxy bate com `VITE_OFFICIAL_BIBLE_PROXY_URL`

### O painel abre, mas os livros nao aparecem

Verifique:

- se a sua chave tem acesso as versoes configuradas
- se o proxy consegue acessar a internet
- se os IDs das versoes estao corretos

### O app volta para o conteudo vazio

Isso geralmente significa:

- falha no proxy
- erro de rede
- erro de chave ou permissao na `API.Bible`

## Proximos passos sugeridos

Algumas evolucoes interessantes para o projeto:

- cache local de capitulos para reduzir chamadas da API
- busca global na Biblia inteira
- plano de leitura
- audio e narracao
- sincronizacao de anotacoes
- PWA para instalacao no celular
- login e biblioteca pessoal

## Creditos

Projeto de leitura e estudo bilingue da Biblia com design focado em experiencia de leitura, construido com `React + TypeScript + Tailwind + Vite` e integracao oficial via `API.Bible`.
