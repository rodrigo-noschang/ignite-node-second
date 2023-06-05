# Variáveis de Ambiente
As variáveis de ambiente são informações que podem mudar dependendo da ambiente onde a aplicação está rodando. Por "ambiente", entenda-se o momento da aplicação, ou seja, o momento/ambiente de desenvolvimento, produção, teste, staging, etc. Para cada etapa dessa, o valor dessa variável (que em muitos casos são valores de configurações) pode mudar. 

Essas variáveis são todas colocadas em um arquivo `.env` na raíz do projeto, que DEVE estar no gitignore, e geralmente inserimos os valores no seguinte padrão:

```
    DATABASE_URL="./db/app.db"
```

Para conseguirmos ler esses valores, precisamos instalar o pacte **dotenv**:

```sh
    $ npm i dotenv
```

Uma vez instalado, precisamos importar essa lib na parte mais "ao topo" da nossa aplicação, no caso no `src/database.ts`:

```js
    import 'dotenv/config';
```

Dessa forma, podemos acessar o valor das variáveis de ambiente usando o **process.env.nome_da_variavel**.

Conforme comentado acima, o arquivo .env não deve ficar no repositório então, para conseguirmos informar o aos outros desenvolvedores da equipe quais variáveis eles precisam configurar, enviamos um arquivo `.env.example` com apenas as chaves que precisam ser configuradas, sem valor algum. Especialmente se esse valor for um dado sensível como url de banco, chaves de API, etc. 

## Tratando variáveis com Zod:
Além de verificar se a variável de ambiente existe, muitas vezes também vai ser necessário validar o seu formato, seu tipo e possivelmente algumas outras coisas também. Para tornar esse processo menos doloros e mais eficiente, vamos usar o **Zod**, que é uma lib usada para validação de dados de forma geral:

```shell
    $ npm i zod
```

E vamos criar esse processo de validação no arquivo `src/env/index.ts`:

```js
    import 'dotenv/config';
    import { z } from 'zod';

    const envSchema = z.object({
        DATABASE_URL: z.string(),
        PORT: z.number().default(3333) // Por ter um valor Default, não é obrigatória
    })

    export const env = envSchema.parse(process.env);
```

O que acontece aqui é bastante intuitivo, criamos um schema que define todas as regras que algum possível objeto vai ter que seguir, no caso, ele **precisará** ter uma DATABASE_URL no formato de string, e ele **pode** ter um PORT, que é um número e, caso ele não seja informado, seu valor será de 3333. 

Com esse schema em mãos, jogamos nosso process.env no método parse dele, que vai verificar se essas chaves estão presentes lá e de acordo com o nosso schema. Sabemos que as variáveis de ambiente estarão lá por conta do import do 'dotenv/config'. Caso alguma dessas chaves não satisfaça as regras definidas, um erro é gerado e a aplicação não segue adiante.

Agora, no nosso `src/database.ts`, pegaremos as variáveis do **env**, não do mais process.env como antes:

```js
    import { knex as setupKnex, Knex } from 'knex';
    import { env } from './env';

    export const config: Knex.Config = {
        client: 'sqlite',
        connection: {
            filename: env.DATABASE_URL,
        }

    export const knex = setupKnex(config);
```

## NODE_ENV
O NODE_ENV é uma variável importantíssima que indica o ambiente onde nossa aplicação está sendo rodada. Geralmente ela é fornecido automaticamente, mas pode ser que não seja. É de nossa responsabilidade informar qual é esse valor: development, test ou production (valores mais comuns):

```js
    const envSchema = z.object({
        NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
        DATABASE_URL: z.string(),
        PORT: z.number().default(3333)
    })
```

## Erro personalizado com o Zod:
A mensagem de erro do Zod não é muito fácil de ler, então podemos criar nosso próprio erro a partir dele mesmo. Vamos separar essa verificação em duas etapas, primeiro faremos um `safeParse` do schema, ao invés do `parse`, pois dessa forma conseguimos capturar erros e sucessos sem que um erro seja gerado automaticamente pelo Zod. Depois podemos gerar nosso próprio erro, com nossa mensagem personalizada, e só depois disso exportar a variável env:

```js
    const _env = envSchema.safeParse(process.env);

    if (_env.success === false) {
        console.error('Invalid environment variable(s) -> ', _env.error.format());

        throw new Error('Invalid environment variable(s)');
    }

    export const env = _env.data;
```