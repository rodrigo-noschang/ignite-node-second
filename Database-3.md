# Banco de Dados:
Para nossa aplicação, vamos utilizar um banco de dados **SQLite**, que é um banco relacional (SQL), fácil de rodar sem instalar nada, uma vez que os dados armazenados por ele são salvos em arquivos físicos dentro do projeto. Além disso, sua sintaxe para queries é bastante semelhante à outros grandes bancos relacionais.

## Estratégias de conexão:

- **Drivers Nativos**: Bibliotecas nativas, de baixo nível, que nos permite uma comunicação com o banco de uma maneira não asbtrata, como o **MySQL2**. Nela, escrevemos nossa query da maneira mais crua e específica o possível. Seria um SQL basicão bastante cru;

- **Query Builders**: Nos permitem realizar as queries na linguagem que está sendo utilizada no projeto, porém os termos da query ainda tem alguma relação com a linguagem original do Banco de dados. Um exemplo de query builder é o **Knex**;

- **ORM**: Ainda mais abstrato do que o Query Builder, 100% adaptado à linguagem do código, e sem necessidade alguma de usar a linguagem nativa do Banco, como é o caso do **Prisma**. 

Uma grande vantagem do query builder e do ORM, é que a sintaxe das queries é exatmente a mesma para todos os bancos permitidos por eles. Então se codarmos uma aplicação usando o Knex para fazer acesso a um banco PostgreSQL, e depois precisarmos usar um banco MySQL, basta mudarmos a conexão e as queries permanecem exatamente as mesmas. 

# Knex.js:

## Instalação e Configuração:

Primeiro vamos instalar o Knex e o tipo do banco de dados que utilizaremos, no nosso caso, o sqlite3:

```shell
    $ npm install knex sqlite3
```

## Criando a conexão:
Vamos realizar os detalhes da conexão em um arquivo `src/database.ts`:

```js
    import { knex as setupKnex } from 'knex';

    export const knex = setupKnex({
        client: 'sqlite',
        connection: {
            filename: './tmp/app.db'
        },
        useNullAsDefault: true
    })
```

Nessa instância no knex, basta informar o client, ou seja, o tipo de banco de dados que estamos usando e, na connection, o filename, que será o arquivo onde nossos dados serão salvos, conforme comentado acima.

## Testando a conexão:
Como por enquanto não temos nada criado no nosso banco de dados, vamos fazer uma query em uma table que já vem criada por padrão em todos os bancos sqlite, o **sqlite_schema**. Nele, obtemos informações sobre todas as tabelas existentes no nosso banco que, por enquanto, não possuimos nenhuma.

```js
    app.get('/hello', async () => {
        const tables = await knex('sqlite_schema').select('*');

        return tables;
    })
```

Depois disso, nosso banco deve ter sido criado na pasta `./tmp`. 

## Tabelas e Migrations:
A Migration nada mais é do que um histórico das alterações do banco de dados, é uma forma de deixar em um único lugar os comandos que criam, deletem ou alteram as tableas/colunas de um banco de dados. Dessa forma, fica possível que 2 desenvolvedores, em lugares diferentes, tenham acesso à ultima versão do banco de dados, sem que haja conflitos. 

Quando realizamos uma migration, automaticamente é crida uma nova tabela **migrations**, com um histórico de quais alterações foram feitas e quando, possibilitando ao nosso banco de dados o conhecimento de quais alterações já foram realizadas, e quais ainda precisam ser feitas no nosso banco local para que ele fique na ultima versão disponível. 

## Criando Migration no Knex:
Para rodar uma migration e salvar nosso primeiro "estado" do banco de dados, basta dar o seguinte comando:

```shell
    $ npx knex migrate:make create-documents
```

Em teoria, isso deveria criar uma versão desse banco de dados, rotulada `create-documents`, e salvar o estado do banco de dados que definimos. Porém, da maneira que nossa aplicação está, isso vai gerar um erro, pois ainda não configuramos para o knex e sua migration o local dos arquivos do banco de dados, portanto ele não sabe onde procurar esses arquivos. Para resolver isso, o padrão do knex é criar um arquivo `knexfile.ts` na raiz do projeto. 

Nesse knexfile, vamos apenas importar APENAS **as configurações** do db que já foram feitos no arquivo `database.ts`. Como precisamos somente das configurações, vamos separar a conexão do database das suas configurações:

```js
    import { knex as setupKnex } from 'knex';

    export const config = {
        client: 'sqlite',
        connection: {
            filename: './tmp/app.db',
        },
        useNullAsDefault: true
    }

    export const knex = setupKnex(config);
```

No nosso `knexfile.ts` agora, podemos: 

```js
    import { config } from "./src/database";

    export default config;
```

Agora nossa estrutura está pronta, porém, rodando a migration novamente, teremos outro erro: o problema aqui é que o knex é feito pra ser rodado em javascript, não em typescript, portanto vamos criar o seguinte script no `package.json` para tentar burlar esse erro:

```json
    "scripts": {
        "knex": "node --loader tsx ./node_modules/.bin/knex"
    }
```

Ou, no caso do **Windows**:
```json
    "scripts": {
        "knex": "node --loader tsx ./node_modules/knex/bin/cli.js"
    }
```

Esse script usa a flag **--loader** do Node. Essa flag nos permite rodar um projeto Node, porém usando uma outra biblioteca para ler os arquivos. No nosso caso, como estamos usando o typescript e rodando ele com o tsx, vamos usar essa engine para ler os arquivos. E quais arquivos queremos ler? Justamente o binário do knex que vai executar nossa migration. 

Dessa forma, já podemos executar os comandos do knex, mas dessa vez com nosso próprio script, usando o **npm run** ao invés do **npx**:

```shell
    $ npm run knex -- -h
```

Aqui estamos executando o -help do knex, para ver todos os comandos disponíveis e estar se o script está funcionando certinho. Esse formato de flag está um pouco diferente porque o parâmetro *-h* precisa ser passado para o **knex**, se fizéssemos: *npm run knex -h*, o parâmetro -h seria passado para o npm de maneira geral, não para o knex. 

Com tudo configurado, podemos rodar a migration certinho agora:

```shell
    $ npm run knex migrate:make crate-documents
```

E isso vai gerar nosso arquivo de migrations na `./src`. Para mudar o destino dessa pasta, podemos fazer o seguinte no arquivo `database.ts`. Atenção para a inclusão da tipagem da variável config, do tipo **Knex.Config**, para incluir o intellisense (também mudamos a pasta `tmp` para `db`):

```js
    import { knex as setupKnex, Knex } from 'knex';

    export const config: Knex.Config = {
        client: 'sqlite',
        connection: {
            filename: './db/app.db',
        },
        useNullAsDefault: true,
        migrations: {
            extension: 'ts',
            directory: './db/migrations'
        }
    }

    export const knex = setupKnex(config);
```

Agora, se Deus quiser, vai criar no lugar certo e essa parte ficou no passado.

## Por dentro da Migration (Criando Tabela):

Todo arquivo de Migration vai ter 2 funções, sempre: **up** e **down**. O up inclui sempre as novas alterações do banco, e o down é basicamente o retorno à versão anterior do banco. Nesse arquivo vamos implementar o funcionamento da nossa primeira migration, que vai ser de criar uma tabela chamada **transactions**, com as colunas:

- Coluna `id`, que vai ser um *uuid*; 
- Coluna `title`, que vai ser um texto obrigatório (não pode ser nulo)

```js
    import { Knex } from "knex";

    export async function up(knex: Knex): Promise<void> {
        await knex.schema.createTable('transactions' , (table) => {
            table.uuid('id').primary();
            table.text('title').notNullable()
        })
    }


    export async function down(knex: Knex): Promise<void> {
        await knex.schema.dropTable('transactions');
    }
```

Agora, vamos rodar o seguinte comando que vai, de fato, executar a migration e realizar essas alterações no nosso banco:

```sh
    $ npm run knex -- migrate:latest
```

Podemos verificar isso ao ver de novo a nossa tabela `sqlite_schema`, que contém informações sobre todas as nossas tabelas (Fazemos isso, **por enquanto** dando um GET na rota /hello). Essa requisição vai nos trazer todos os dados em relação a essa nossa tabela e todas as outras criadas pelo Knex para que ele consiga fazer o controle das migrations.

**IMPORTANTE**: Uma vez que uma migration é enviada para produção, ou para o restante do time, essa migration **NÃO PODE** mais ser alterada, é imporatnte que o histórico do banco de dados seja exatamnete o mesmo para todo o time. Se for necessário mudar algo em uma migrate compartilhada entre o time, por menor que seja a mudança, ela deve ser feita em uma nova migration. 

Se precisarmos alterar alguma coluna em uma migration **Que ainda NÃO foi compartilhada com ninguém**, então primeiro fazemos um rollback (para desfazer as alterações dessa migration), alteramos ela, e então rodamos um latest de novo. Por exemplo, se formos adicionar uma nova coluna nesse nosso banco, reutilizando a mesma migration, faríamos o seguinte:

```sh
    $ npm run knex migrate:rollback
```

Alteramos o que precisa ser alterado, no caso, adicionamos uma coluna **amount** (que é um decimal de tamanho 10 dígitos, com 2 casas decimais e obrigatório), e uma coluna **crated_at**, com valor padrão da hora atual, utilizando a função **now** do próprio knex:

```js
    export async function up(knex: Knex): Promise<void> {
        await knex.schema.createTable('transactions' , (table) => {
            table.uuid('id').primary();
            table.text('title').notNullable()
            table.decimal('amount', 10, 2).notNullable()
            table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
        })
    }
```

E agora `executamos` a migration novamente, para que essas novas colunas sejam criadas:

```sh
    $ npm run knex migrate:latest
```

## Alterando Tabela em outra Migration:

Se, por um acaso, precisarmos criar uma outra coluna, por exemplo, **session_id**, na mesma tabela `transactions`, em uma outra Migration (porque a migration acima já foi compartilhada com o time), não usaremos mais o método **knex.schema.createTable**, agora usarmos o **alterTable**:

Primeiro, obviamente, vamos criar uma nova migration onde possamos inserir essa modificação:

```sh
    $ npm run knex migrate:make add-session-id-to-transactions
```

No novo arquivo de migrations gerado, no método up (as modificações a serem feitas na tabela):

```js
    export async function up(knex: Knex): Promise<void> {
        await knex.schema.alterTable('transactions', (table) => {
            table.uuid('session_id').after('id').index()
        })
    }
```

Estamos alterando a tabela `transaction`, incluindo uma coluna **session_id**, do tipo uuid, que deve ser posicionado após a coluna id, e estamos indicando para o knex que use essa coluna como um índice. É uma forma de dizer que essa coluna será bastante utilizada em queries futuras, ou seja, será inserida nas cláusulas WHERE.

No método down, precisamos que essa alteração seja DESFEITA na nossa table, ou seja, precisamos **remover** essa coluna session_id:

```js
    export async function down(knex: Knex): Promise<void> {
        await knex.schema.alterTable('transactoins', (table) => {
            table.dropColumn('session_id');
        })
    }
``` 

E, para aplicar as alterações, rodamos o latest de novo: 

```sh
    $ npm run knex migrate:latest
```