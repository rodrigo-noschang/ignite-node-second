import fastify from "fastify";
import { env } from "./env";

import { knex } from "./database";

const app = fastify();

app.get('/hello', async () => {
    // const newTransaction = await knex('transactions').insert({
    //     id: crypto.randomUUID(),
    //     title: 'Nova Transacao',
    //     amount: 1000
    // }).returning('*');

    // return newTransaction;

    const transactions = await knex('transactions')
        .where('amount', 1000)
        .select('*');

    return transactions;
})

app.listen({
    port: env.PORT,
}).then(() => {
    console.log(`Server running on PORT ${env.PORT}`)
})