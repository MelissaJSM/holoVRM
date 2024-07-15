import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const { type, userId } = req.body;

    console.log('recordLoginAttempt called with:', { type, userId });

    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });

    try {
        if (type === 'user' && userId) {
            await connection.execute(
                'INSERT INTO login_attempts (user_id, type, timestamp) VALUES (?, ?, ?)',
                [userId, 'user', new Date()]
            );
            console.log('User login attempt recorded');
        } else if (type === 'session' && userId) {
            console.log('Attempting to insert session:', userId);
            const [result] = await connection.execute(
                'INSERT INTO guest_login_attempts (session_id, timestamp) VALUES (?, ?)',
                [userId, new Date()]
            );
            console.log('Session login attempt result:', result);
        }
        res.status(200).json({ success: true });
    } catch (error: unknown) {
        const err = error as Error;
        console.error('Error recording login attempt:', err.message);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await connection.end();
    }
};

export default handler;
