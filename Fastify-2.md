# Criando aplicação com Fastify:

Primeiro precisamos instalar o Festify na nossa aplicação:

```shell
    $ npm i fastify
```

E também, como vamos usar typescript em uma aplicação Node, precisamos instalar sua tipagem específica:

```shell
    $ npm i -D @types/node
```

E agora podemos fazer nosso Hello World basicão, criando uma aplicação com o fastifiy, uma rota get no /hello e pedir para o servidor rodar na porta 3333:

```js
    import fastify from "fastify";

    const app = fastify();

    app.get('/hello', () => {
        return 'Hello World';
    })

    app.listen({
        port: 3333,

    }).then(() => {
        console.log('Server running on PORT 3333')
    })
```

Feito isso, podemos rodar o comando que "transpila" o código ts para js: 

```shell
    $ npx tsc src/server.ts
```

E então executar o arquivo JS que foi gerado por ele:

```shell
    $ node src/server.js
```

## Automatizando a conversão + execução de arquivos:
Para facilitar a vida na hora da conversão do arquivo TS -> JS, e a sua execução, vamos usar uma ferramenta chamda **TSX**, que faz a conversão, executa o códgio e não fica criando pastas a mais sujando nossa estrutura de arquivos:

```shell
    $ npm install tsx -D
```

Rodando o server com ele:

```shell
    $ npx tsx src/server.ts
```

Dessa forma, o servidor vai rodar de forma normal, sem a criação de novos arquivos, porém, essa ferramente só pode ser usada em Desenvolvimento, em produção, o ideal é que o arquivo seja transformado em JS e então executado, normalmente.

Para facilitar também, podemos criar um script com esse comando (por algum motivo não precisa do npx aqui):

```json
    "dev": "tsx watch src/server.ts"
```

Agora, rodando npm run dev, ele vai numa pegada só. E também adicionamos a flag **watch** para que todas as alterações no código causem um reset automatico no servidor.