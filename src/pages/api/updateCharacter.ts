import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { userId, lastCharacter } = req.body;

        // MySQL 연결 설정
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });

        // last_character 업데이트
        try {
            await connection.execute('UPDATE users SET last_character = ? WHERE id = ?', [lastCharacter, userId]);
            await connection.end();
            return res.status(200).json({ success: true });
        } catch (error) {
            await connection.end();
            return res.status(500).json({ success: false, message: 'Failed to update character' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
