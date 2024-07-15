import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

export type QueryResult = RowDataPacket[] | ResultSetHeader;

export async function query(sql: string, values: (string | number)[] = []): Promise<QueryResult> {
    const [results] = await pool.execute<QueryResult>(sql, values);
    return results;
}
