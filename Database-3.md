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
        }
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