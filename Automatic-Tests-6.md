# Testes Automatizados

Ajudam a manter a confiança a longo prazo quando vamos dar manutenção no código, nos permitindo ter a **certeza** de que nada (em lugar nenhum do código) está sendo quebrado no meio do caminho. 

## Tipo principais de testes

- **Testes Unitários**: Vão testar exclusivamente uma unidade da aplicação. Por "unidade" enteda-se uma pequena parte específica da aplicação, como uma função que serve para formatar algum tipo de input. Geralmente independem de contextos, e compõem a maior parte dos testes.

- **Testes de Integração**: Testam a comunicação entre 2 ou mais unidades. 

- **Teste E2E (end-to-end), ou Ponta a Ponta**: Simulam um usuário operando a aplicação, portanto realizam todas as ações que os usuários podem fazer. Esses testes, no front-end geralmente executam tudo a partir da interface do usuário, como abrir a página da aplicação, inserir dados em inputs, clicar em links ou botões, assim por diante. São bastante completos, porém lentos já que rodam uma parte inteira da aplicação.

Já no back-end, o usuário não possui uma interface com a qual interagir. Nesse caso, o nosso usuário é o front-end, e as ações que ele pode executar são justamente as chamadas HTTP, WebSockets, assim por diante.

## Pirâmide de Testes

Um estudo que propõe, em outras palavras, que cada teste tem uma importância e uma ordem de ser realizado, e que cada teste apresenta uma dificuldade e algumas exigencias da parte da nossa aplicação, para que ele possa ser implementado. Por essa linha de raciocínio, o melhor teste para ser executado por primeiro é o E2E, visto que ele não depende da tecnologia da aplicação, sua arquitetura nem nada do tipo. 

Porém, como eles são testes bastante lentos, não é recomendado se ter muito deles, pois testar uma aplicação muito grande seria desnecessariamente lento. 

A pirâmide de testes propõe que devemos ter poucos testes E2E, alguns testes de Integração, e muitos testes unitários. Nessa aplicação, porém, vamos fazer apenas testes E2E, pois os demais testes exigiriam que nossa aplicação estivesse arquitetada. 

## Criando Testes:
Apesar do node ter uma ferramente de testes embutida nele, ela ainda está em uma fase bastante rudimentar e experimental. Para os nossos testes, vamos utilizar o **Vitest**. Essa tecnologia usa uma ferramenta chamada **esbuild**, que é a mesma utilizada pelo *tsx* (já instalado na nossa aplicação), e ele é, como o nome sugere, um "Extremely fast bundler for the web". 

Nossos testes serão escritos em TS, porém, assim como o restante do código, eles também precisam ser convertidos para JS para que possam ser executados. O Vite faz essa conversão automaticamente, ao contrário do JEST, por exemplo, que exige algumas libs externas. 

## Utilizando o Vitest:
Vamos primeiro instalar o home:

```sh
    $ npm i vitest -D
```

Depois vamos criar um arquivo de exemplo para os testes na raiz do projeto `test/example.spec.ts` (precisa ter spec ou test no nome do arquivo):

```js
    import { expect, test } from 'vitest';

    test('o usuario consegue criar uma nova transação', () => {

        const responseStatus = 201;

        expect(responseStatus).toEqual(201);
    })
```

E para executar os testes, rodamos `npx vitest` ou, ainda mais preguiçoso, criamos o script:

```json
    "test": "vitest"
```

A partir da execução desse script, podemos pressionar a tela `a` para re-executar os testes. 

## Fazendo um teste E2E real
Antes da implementação dos testes, é importante fazer a importação do nosso **app** lá no arquivo de testes. Porém, o simples fato de fazer a importação já vai obrigar a nossa aplicação a subir um servidor na nossa porta definida (por conta do app.listen), e isso não é muito bom para os testes, tanto por conta de possíveis conflitos em portas, quanto por causa do tempo (desnecessário, nesse caso) que se leva para subir a aplicação, e também para encerrá-la depois da realização dos testes. 

Para resolver isso, vamos usar o **supertest**:

```sh
    $ npm i supertest @types/supertest -D
```

Com ele, podemos fazer requisições para nossa aplicação sem a necessidade de subir essa aplicação. Para isso, vamos separá-la em 2 partes diferentes: 

- (1) O arquivo `app.ts`, que vai criar e configurar todo nosso app, ou seja, nossa instância do Fastify;

- (2) O arquivo `server.ts`, que vai realizar o método listen do app, ou seja, vai colocar ele no ar. 

Agora, quando importamos o app, do arquivo `app.ts`, não estamos forçando ele a rodar o servidor. 

Criando o teste para criação de novas transações no arquivo `test/example.spec.ts`:

```js
    import { test, beforeAll, afterAll } from 'vitest';
    import request from 'supertest';

    import { app } from '../src/app';

    beforeAll(async () => {
        await app.ready();
    })

    afterAll(async () => {
        await app.close();
    })

    test('user can create a new transaction', async () => {
        await request(app.server)
            .post('/transactions')
            .send({
                title: 'New transaction',
                amount: 5000,
                type: 'credit'
            })
        .expect(201);
    })
```

No teste, basicamente, estamos subindo uma versão pura do server usando o **request(app.server)**, e realizando um post no `/transactions`, passando aquele objeto como corpo da requisição. Depois disso, esperamos um 201 como status da resposta. Porém, para garantir que o servidor estará pronto para receber requisições (já terá subido corretamente), usamos o **app.ready** dentro do `beforeAll`, que nada mais é do que uma função que vai ser executada antes de TODOS os testes, não antes de cada teste.

Por fim, também usamos a função **app.close**, no método `afterAll`, obviamente para fechar essa instância pura da aplicação depois de todos os testes serem executados. 

Podemos agora agregar os testes em categorias diferentes, pois essas categorias são mais facilmente identificadas em caso de erro nos testes. Dando essa reformulada, obtemos:

```js
    describe('Transaction routes', () => {
        beforeAll(async () => {
            await app.ready();
        })
        
        afterAll(async () => {
            await app.close();
        })
        
        it('should be able to create a new transaction', async () => {
        
            await request(app.server)
                .post('/transactions')
                .send({
                    title: 'New transaction',
                    amount: 5000,
                    type: 'credit'
                })
            .expect(201);
        })
    })
```

Agrupamos o teste e os before and after all usando o **describe**, e trocamos o `teste`, pelo `it`, que faz exatamente a mesma coisa, mas a escrita fica mais padronizada e de acordo com a forma com que essa funcionalidade é descrita nos Requisitos Funcionais. 

**REGRA**: Os testes devem se excluir de qualquer contexto, portanto, um teste JAMAIS deve depender de outro teste. 

Agora vamos fazer os testes para listagem das transações:

```js
    it('should be able to list all transactions', async () => {
        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                title: 'New transaction',
                amount: 5000,
                type: 'credit'
            })

        const cookies = createTransactionResponse.get('Set-Cookie');

        const listTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies)
            .expect(200)

        expect(listTransactionsResponse.body.transactions).toEqual([
            expect.objectContaining({
                title: 'New transaction',
                amount: 5000
            })
        ])
    })
```

Aqui precisamos fazer algumas considerações:

- A minha rota de listagem de transações depende do cookie do usuário, que só é criado quando ele cadastra uma transação, portanto, dentro do teste de listagem, é necessário realizar uma operação de cadastro de transação para só depois listar elas, já que os testes devem ser independentes de contextos externos (não poderia tentar reaproveitar o teste de cadastro, por exemplo);

- Aqui, também estamos usando os métodos `get` e `set` para pegar e atribuir dados do cabeçalho, nesse caso, os nossos cookies;

- A nossa verificação (expect) está esperando que dentro do corpo da resposta do GET, mais especificamente, dentro da chave `transactions` desse corpo, tenha um array, e nesse array, esperamos um objeto **contendo** os valores de title e amount que definimos na requisição de criação de transação. Estamos nos limitando a verificar esses campos pois os outros campos como id, created_at, session_id, etc, são gerados automaticamente e aleatóriamente no momento da inserção no banco de dados, portanto não temos controle sobre seus valores, então testamos apenas o que conhecemos. 

## Configurando Banco de Dados para Testes:
Até agora, todos os nossos testes estão fazendo acesso ao mesmo banco de dados de antes, que seria o banco de desenvolvimento e isso não é legal, primeior pq fica salvando dado desnecessário, segundo porque a criação de uma instancia agora pode interferir em algum teste posteriormente. Idealmente, os testes rodam em um ambiente isolado de tudo e absolutamente zerado, sem dado nem interferências externas. 

Para isso, vamos precisar alterar as configurações do nosso banco de dados e, como os dados dessas configurações vêm das variáveis de ambiente, vamos criar um arquivo .env.test, que vai conter as variáveis do nosso ambiente de teste. Aqui não precisamos informar o NODE_ENV, pois o próprio vitest já atribui o valor **test** a ela automaticamente. 

```
    DATABASE_URL="./db/test.db"
```

Agora precisamos que nosso arquivo de configuração verifique essa ambiente antes de carregar as variáveis dele, então ao invés de importar o config direto do dotenv, como fazíamos antes

```js
    import 'dotenv/config';
```

Vamos verificar o ambiente antes:

```js
    import { config } from 'dotenv';

    if (process.env.NODE_ENV === 'test') {
        config({ path: '.env.test' });
    } else {
        config();
    }
```

Dessa forma, se executarmos o app pelo vitest, ele vai automaticamente setar o valor de NODE_ENV para 'test', que vai forçar nosso arquivo env a ler os dados do arquivo `.env.test`, que possui uma url de database diferente do nosso banco de desenvolvimento. Executando o `npm test` novamente, vamos ver a criação de um novo banco **test.db**. 

É importante notar que esse banco de dados estará VAZIO, sem as tabelas, já que essas são criadas a partir das migrations. Para resolver isso, vamos pedir, no nosso arquivo de testes, para que sejam rodadas as migrations antes **DE CADA TESTE**, pois isso garantirá que o banco vai estar limpo e zerado toda sempre que o teste for rodado. Então antes de cada teste daquele grupo de testes, faremos um rollback e um latest, desconstruindo e reconstruindo os bancos sempre.

```js
    import { beforeEach, ... } from 'vitest';
    import { execSync } from 'node:child_process';

    beforeEach(() => {
        execSync('npm run knex migrate:rollback --all');
        execSync('npm run knex migrate:latest')
    })
```

Talvez tenha que mudar o script do knex para:

```json
    {
        "knex": "node --loader tsx ./node_modules/knex",
    }
```

Essa operação contribui ainda mais para a demora dos testes, reforçando a ideia de que testes e2e são demorados e portanto devem ser poucos e eficientes. 

## Buscando Transação por ID
Obviamente para buscar uma transação por id, precisamos do ID dela, mas na criação não retornamos o ID dela, então vamos fazer uma criação, listar todas as transação, pegar o ID, e então buscar por esse ID: 

```js
    it('should be able to get specific transaction', async () => {
        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                title: 'New transaction',
                amount: 5000,
                type: 'credit'
            })

        const cookies = createTransactionResponse.get('Set-Cookie');

        const listTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies)
            .expect(200)

        const transactionID = listTransactionsResponse.body.transactions[0].id;

        const specificTransactionResponse = await request(app.server)
            .get(`/transactions/${transactionID}`)
            .set('Cookie', cookies)
            .expect(200)

        expect(specificTransactionResponse.body.transaction).toEqual(
            expect.objectContaining({
                title: 'New transaction',
                amount: 5000
            })
        )
    })
```