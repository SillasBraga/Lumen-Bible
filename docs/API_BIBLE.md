# Integrando uma Bíblia oficial com API.Bible

## Por que esta opção

- O plano `Starter` da API.Bible custa `US$0/mês`.
- Ele inclui `5.000 chamadas por mês`.
- Permite escolher `3 Bíblias protegidas por copyright` no uso `estritamente não comercial`.
- Também dá acesso a Bíblias `Creative Commons` e `domínio público`.

## O que já foi preparado no projeto

- Proxy local em `scripts/api-bible-proxy.mjs`
- Script de execução em `package.json`
- Cliente base em `src/services/officialBible.ts`
- Configuração exemplo em `.env.example`

## Como ligar

1. Crie uma conta em [API.Bible](https://api.bible/).
2. Copie sua chave da dashboard.
3. Descubra os IDs das versões desejadas no endpoint `/bibles`.
   Dica: no campo de idioma, use `por` para português ou deixe em branco para listar tudo.
4. Copie `.env.example` para `.env`.
5. Preencha pelo menos:

```env
API_BIBLE_KEY=...
API_BIBLE_PORT=8787
VITE_OFFICIAL_BIBLE_PROXY_URL=http://localhost:8787
```

6. Inicie o proxy:

```bash
npm run proxy:api-bible
```

## Endpoint local criado

### `GET /health`

Retorna se o proxy está ativo.

### `GET /chapter?bibleId=...&chapterId=GEN.1`

Busca um capítulo na API.Bible e devolve:

```json
{
  "bibleId": "exemplo",
  "chapterId": "GEN.1",
  "reference": "Genesis 1",
  "content": "1 In the beginning...",
  "verses": [
    { "number": 1, "text": "In the beginning..." }
  ]
}
```

## Observações importantes

- A chave da API não deve ficar no React direto. Por isso o proxy local foi separado.
- O parser atual normaliza a resposta `text` em versos. Ele é suficiente para começar, mas pode ser refinado quando escolhermos a versão final.
- Nem toda tradução protegida estará liberada gratuitamente. Isso depende da licença mostrada pela própria API.Bible.
- Para publicar comercialmente depois, provavelmente será preciso trocar de plano ou de tradução.
