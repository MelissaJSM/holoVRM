import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { type, userId } = req.body;

        console.log(`Received login attempt: type=${type}, userId=${userId}`);

        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });

        try {
            if (type === 'user' && userId) {
                await connection.execute('INSERT INTO user_login_attempts (user_id, timestamp) VALUES (?, NOW())', [userId]);
                console.log(`Recorded login attempt for user: ${userId}`);
            } else {
                await connection.execute('INSERT INTO guest_login_attempts (timestamp) VALUES (NOW())');
                console.log('Recorded guest login attempt');
            }
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error recording login attempt:', error);
            res.status(500).json({ success: false, message: (error as Error).message });
        } finally {
            await connection.end();
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
