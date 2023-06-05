# Plugins (Continuação Fastify):

Os plugins do Fastify são uma forma de separar pedaços da aplicação em diferentes arquivos. Separar requisições e rotas em diferentes lugares do projeto, mas ainda respeitando a entidade "centralizada" e única do **app** (app, no caso, instância do fastify).

A ideia dessa diversificação é implementar a parte pesada da aplicação, os códigos verbosos em outros arquivos, e esses arquivos serem importados para dentro do `server.ts`, que é a porta de entrada para nossa aplicação. 

Um exemplo de plugin seria a utilização de um arquivo separado para a criação das rotas. Vamos, por exemplo, criar um plugin para as rotas de transações: o primeiro passo é de fato implementar essa rota, em um arquivo específico (`src/routes/transactions.ts`):

```js
    import { FastifyInstance } from "fastify";
    import { knex } from "../database";


    export async function transactionsRoutes(app: FastifyInstance) {

        app.get('/hello', async () => {
            const transactions = await knex('transactions').select('*');
        
            return transactions;
        })
    }
```

E, no nosso arquivo principal `server.ts`, vamos apenas inserir esse plugin usando o **register**:

```js
    const app = fastify();

    app.register(transactionsRoutes)
```

Feito isso, estaremos devidamente pluginado.