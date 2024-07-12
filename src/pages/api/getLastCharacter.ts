import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = req.query;

    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });

    try {
        const [rows]: [any[], any] = await connection.execute('SELECT last_character FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            await connection.end();
            return res.status(400).json({ success: false, message: 'ID가 존재하지 않습니다.' });
        }

        const lastCharacter = rows[0].last_character;
        await connection.end();
        return res.status(200).json({ success: true, lastCharacter });
    } catch (error) {
        await connection.end();
        console.error('Error fetching last character:', error);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
}
