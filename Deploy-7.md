# Deploy
Deploy é o ato de colocar o projeto no ar, enviá-lo para produção. Ou seja, tirar ele do contexto local e permitir que qualquer um, com o link, possa acessá-lo.

Para esse projeto, vamos fazer o deploy usando um sistema gerenciado (dentre tantas outras opções), que vai automatizar boa parte das configurações e processos. 

Como em tantos outros momentos dessa aplicação, o typescript é um problema. Nenhuma das plataformas que fazem o deploy de Node, conseguie interpretar o typescript, portanto precisamos converter ele todo em javascript. Para fazer isso de uma forma rápida e fácil, vamos usar o **tsup**

```sh
    $ npm i -D tsup
```

E agora vamos criar um script, no arquivo `package.json` que vai gerar o build dessa aplicação em uma pasta `build`:

```json
    {
        "build": "tsup src --out-dir build"
    }
```

A partir desse build, devemos conseguir rodar nosso servidor sem o auxílio do tsx, já que o build converte todo o TS em um JS:

```sh
    $ node buid/server.js
```

Agora, é importante adicionar essa pasta build ao gitignore para que ele não fique no repositório. 

## Render
Para fazer o deploy de fato, vamos utilizar a plataforma Render, nele vamos começar criando um banco de dados PostgreSQL e, como já dissemos antes, todas as queiries do knex devem funcionar da mesma forma, independente do banco de dados.

Também precisamos fazer algumas alterações na aplicação, para que possamos identificar os diferentes tipos de banco, e conseguir fazer a conexão com eles propriamente, para isso vamos adicionar uma nova variável de ambiente, que vai se chamar **DATBASE_CLIENT**, e vai poder receber `pg`, para o ambiente de produção ou `sqlite`, para o ambiente de desenvolvimento. 

Para isso, portanto, precisamos instalar o driver do Postgres, e deixar o driver do sqlite como dependência de desenvolvimento:

```sh
    $ npm i pg
```

Um outro detalhe para ser cuidado no deploy é que o Render utiliza uma versão bastante antiga do Node, 14.alguma coisa, por isso, vamos explicitar no `package.json` qual a versão do node que queremos (qualquer versão LTS acima da 18):

```json
    "engines": {
     "node": ">=18"
    }
```

Mais um probleminha é a forma como recebemos o PORT da nosso app, que é enviado pelo Render como string, não como número. Para isso, vamos usar a função **corce** do zod:

```ts
    const envSchema = z.object({
        NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
        DATABASE_URL: z.string(),
        DATABASE_CLIENT: z.enum(['sqlite', 'pg']),
        PORT: z.coerce.number().default(3333)
    })
```

O coerce vai pegar o valor recebido, independente de qual seja que vai transformá-lo num numero. Se essa conversão não gerar um valor utilizável, será usado o 3333 mesmo. 

Agora podemos fazer o commit dessas alterações e subir para o github, de onde o Render vai pegar o app.