import { knex as setupKnex, Knex } from 'knex';
import { env } from './env';

const databaseConnectionURL = env.DATABASE_CLIENT === 'pg' ?
    env.DATABASE_URL :
    {
        filename: env.DATABASE_URL
    }

export const config: Knex.Config = {
    client: env.DATABASE_CLIENT,
    connection: databaseConnectionURL,
    useNullAsDefault: true, 
    migrations: {
        extension: 'ts',
        directory: './db/migrations'
    }
}

export const knex = setupKnex(config);