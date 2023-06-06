# Plugins (Continuação Fastify):

Os plugins do Fastify são uma forma de separar pedaços da aplicação em diferentes arquivos. Separar requisições e rotas em diferentes lugares do projeto, mas ainda respeitando a entidade "centralizada" e única do **app** (app, no caso, instância do fastify).

A ideia dessa diversificação é implementar a parte pesada da aplicação, os códigos verbosos em outros arquivos, e esses arquivos serem importados para dentro do `server.ts`, que é a porta de entrada para nossa aplicação. 

Um exemplo de plugin seria a utilização de um arquivo separado para a criação das rotas. Vamos, por exemplo, criar um plugin para as rotas de transações: o primeiro passo é de fato implementar essa rota, em um arquivo específico (`src/routes/transactions.ts`):

```js
    import { FastifyInstance } from "fastify";
    import { knex } from "../database";


    export async function transactionsRoutes(app: FastifyInstance) {

        app.get('/', async () => {
            const transactions = await knex('transactions').select('*');
        
            return transactions;
        })
    }
```

E, no nosso arquivo principal `server.ts`, vamos apenas inserir esse plugin usando o **register**:

```js
    const app = fastify();

    app.register(transactionsRoutes, {
        prefix: 'transactions'
    })
```

Feito isso, estaremos devidamente pluginado, e também já definimos um endpoint padrão para essas rotas, que terão o prefixo "transactions". Por isso quando crio a requisição, basta colocar apenas o '/' na rota, e ela já vai ser definida como um endpoint **/transactions**.

## Criando uma transação:
Vamos definir uma rota, no nosso arquivo `transaction.ts`, onde o usuário possa criar uma nova transação:

```js
    export async function transactionsRoutes(app: FastifyInstance) {

        app.post('/', async (request, reply) => {
            const createTransactionBodySchema = z.object({
                title: z.string(),
                amount: z.number(),
                type: z.enum(['credit', 'debit'])
            })

            const { title, amount, type } = createTransactionBodySchema.parse(request.body);

            await knex('transactions').insert(
                {
                    id: randomUUID(),
                    title,
                    amount: type === 'credit' ? amount : amount * -1
                }
            )

            return reply.status(201).send();
        })
    }
```

Aqui estamos usando o zod para verificar se o corpo da requisição possui todos os parâmetros obrigatórios, e também estamos inserindo o valor do amount dependendo do tipo da transação. Ela será positiva se a operação for de crédito, e negativa se ela for de débito. 

Veja o arquivo `src/routes/transactions.ts` para ver as outras requisições.

## Tipagem do Knex

Vamos realizar uma tipagem no Knex para que ele consiga sugerir os campos/colunas da tabela que estamos acessando. Vamos criar ela na pasta `src/@types/knex.d.ts`:

```js
    import { Knex } from 'knex'; // Apenas para reaproveitar os tipos existentes no Knex

    declare module 'knex/types/tables' {
        export interface Tables {
            transactions: {
                id: string,
                title: string,
                amount: number,
                created_at: string
                session_id?: string
            }
        }
    }
```

Toda essa estrutura é disponibilizada na doc do Knex. Aqui conseguimos definir as tabelas que temos no nosso banco e suas colunas, facilitando a vida quando formos realizar acessos ao banco de dados.

## Separando transações por usuários
A ideia aqui vai ser criar um id local para um usuário (no navegador dele) quando ele fizer a primeira transação dele. Faremos isso utilizando **Cookies**. 

Os Cookies nada mais são do que formas de criar e manter **contextos entre requisições**, permitindo que a aplicação identifique os usuários mesmo que eles não realizem login ou qualquer processo de autenticação.  

Para podermos integrar os cookies na nossa aplicação, vamos instalar o pacote recomendado pelo Fastify:

```sh
    $ npm i @fastify/cookie
```

E vamos colocar o cookie como um plugin da nossa aplicação:

```js
    import cookie from '@fastify/cookie';

    const app = fastify();

    app.register(cookie);
    app.register(transactionsRoutes, {
        prefix: 'transactions'
    })
```

Conforme comentado antes, vamos atribuir um sessionId para um usuário assim que ele fizer sua primeira transação, e vamos transitar esse dado através de cookies. Na nossa rota de criação de transações, implementaremos a lógica dos cookies antes de inserir a transação no banco de dados:

```js

    ...
    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
        sessionId = randomUUID();

        reply.cookie('sessionId', sessionId, {
            path: '/',
            maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        })
    }

    await knex('transactions').insert(
        {
            id: randomUUID(),
            title,
            amount: type === 'credit' ? amount : amount * -1,
            session_id: sessionId
        }
    )
```

Primeiro estamos verificando os cookies do navegador do usuário, através do objeto de requisição, para ver se essa sessão já foi cadastrada. Se ela já foi cadastrada, então não é a primeira transação desse usuário em específico. Caso não seja, então criamos um novo UUID, e colocamos esse valor no cookie da resposta, dessa forma, esse valor ficará salvo no navegador do usuário, e poderemos obter ele na próxima vez que ele criar uma transação.

Quando criamos esse cookie, podemos definir, na chave `path`, em quais rotas da aplicação esse valor estará disponível. Deixando com o '/', estamos definindo que ele ficará disponível para todas as rotas da aplicação. Também PRECISAMOS definir uma data de expiração desse cookie, no caso, definimos para 7 dias na chave `maxAge`. 

É importante notar que o valor do cookie é transitado automaticamente na nossa aplicação, não vamos inserir esses valores em lugar nenhum, o navegador e a aplicação cuidam disso pra gente. Podemos verificar isso, no Insomnia, nas abas *Cookies* tanto da resposta, quanto da requisição. 

## Atualizando Rotas para inlcuir verificação de Cookies (Middleware):
Agora, em todas as nossas rotas não podemos mais enviar TODAS as transações, apenas as que pertecerem à mesma sessão, e como essa funcionalidade vai ser comum à varias rotas da nossa aplicação, vamos criar um **Middleware** que realize isso pra gente. Primeiro, vamos apenas criar o middleware, ou seja, a função que verifica se o sessionId existe nos cookies e, se não existir, já gera um erro (será implementado no arquivo `src/middlewares/check-session-id-exists.ts`):

```js
    import { FastifyRequest, FastifyReply } from 'fastify';

    export async function checkSessionIdExists(request: FastifyRequest, reply: FastifyReply) {
        const sessionId = request.cookies.sessionId;

        if (!sessionId) {
            return reply.status(401).send({
                error: "Unauthorized"
            })
        }
    }
```

E agora vamos implementar esse middleware nas nossas rotas (em todas as que realizam alguma busca):

```js
    app.get('/', 
    {
        preHandler: [checkSessionIdExists]
    }, 
    async (request) => {
        const { sessionId } = request.cookies;

        const transactions = await knex('transactions')
            .where('session_id', sessionId)
            .select('');

        return { transactions };
    })
```

Basta colocar em um objeto, após a definição da rota, um **preHandler** (é a maneira como o fastify chama os middlewares) com todas as funções interceptadoras. E claro, colocamos um cláusula na nossa busca, para trazer apenas as transações que tenham o mesmo session_id.


## Hooks
Essa forma de implementar o middleware é boa, porém muito manual, sempre que implementarmos uma nova rota precisaríamos colocá-la manualmente para exigir que esse middleware seja chamado. Para facilitar esse trabalho, podemos colocar esse middlewares (entre outras coisas) em contextos maiores, como o contexto da nossa rota, e até mesmo no contexto global. Para isso, podemos fazer uso do **addHook**. 

Se chegarmos na nossa definição da Rota e usarmos o addHook nesse app interno dele, podemos definir um middleware que será executado em TODAS as requisições dessa rota, por exemplo: 

```js
    export async function transactionsRoutes(app: FastifyInstance) {
        app.addHook('preHandler', async () => {
            console.log('Chamou na rota /transactions');
        })

    ...
    }
```

Aqui, todas as requisições feitas na rota `/transactions` terão essa funcão como **preHandler** e, portanto, farão esse console.log. Podemos colocá-la num contexto ainda mais global e adicionar esse Hook no app global do server:

```js
    const app = fastify();

    app.register(cookie);

    app.addHook('preHandler', async () => {
        console.log('Chamou em qualquer rota');
    })
```

Dessa forma acima, essa função será executado como preHandler (middleware) de qualquer requisição em qualquer rota, deixando muito mais ágil a aplicação de middlewares.