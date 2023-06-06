# Organizando a aplicação:

Antes de começar o projeto em si, é interessante sempre deixarmos bem claro alguns pontos da aplicação, entre eles: **Requisitos Funcionais** (RF), **Regras de Negócio** (RN) e **Requisitos Não Funcionais** (RNF). A ideia aqui é deixar bem claro tudo que é possível e permitido (por consequencia, tudo que não é permitido também) na nossa aplicação. 

Lembrando que a ideia geral dessa aplicação é prover o back-end para um programa de controle de finanças. 

## Requisitos Funcionais (RF):
Vamos listar, por enquanto, tudo que é possível para o nosso usuário final:

- [x] O usuário deve poder criar uma nova transação;
- [x] O usuário deve poder obter um resumo da sua conta (Saldo final das operações);
- [x] O usuário deve poder listar todas as transações já feitas;
- [x] O usuário deve poder visualizar uma transação única.

## Regras de Negócio (RN):

- [x] A trasnação pode ser do tipo crédito que somará ao valor tota, ou débito, que descontará do valor total;
- [ ] Deve ser possível identificarmos os usuários entre as requisições (Não será implementado login/autenticação);
- [ ] O usuário só pode visualizar transações feitas por ele. 

## Requisitos Não Funcionais:
Aqui podemos entrar na parte específica das técnicas/tecnologias utilizadas para satisfazer as regras de negócio. Geralmente são implementadas no decorrer da aplicação.