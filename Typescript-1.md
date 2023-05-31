# Adicionando typescript no projeto Node

Por padrão, o node não reconhece o typescript, portanto é necessário instalá-lo:

```shell
    $ npm i -D typescript
```

e criar seu arquivo de configuração:

```shell
    $ npx tsc --init
```

O **npx** é um comando que vem junto com o pacote npm, e serve para executar arquivos binários. No caso do comando acima, estamos executando o arquivo `tsc`, que está dentro da pasta `node_modules/.bin`. 

Quando rodamos o comando acima, geraremos o arquivo `tsconfig.json` e nele, podemos modificar a propriedade **target**, que basicamnte diz para qual versão do JS o TS será convertido: 

```json
    {
        "target": "es2020" // ao invés de "es2016". 
    }
```

Para poder "compilar" o nosso arquivo typescript para javascript, podemos rodar o seguinte comando, supondo, é claro, que temos um arquivo index.ts dentro da pasta src:

```shell
    $ npx tsc src/index.ts
```

Assim, estaremos gerando um arquivo index.js, que pode ser executado pelo Node:

```shell
    $ node src/index.js
```