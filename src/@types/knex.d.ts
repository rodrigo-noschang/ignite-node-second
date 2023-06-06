import { Knex } from 'knex'; // Apenas para reaproveitar os tipos existentes no Knex

declare module 'knex/types/tables' {
    export interface Tables {
        transactions: {
            id: string,
            title: string,
            amount: number,
            created_at: string
            session_id?: string
        }
    }
}
