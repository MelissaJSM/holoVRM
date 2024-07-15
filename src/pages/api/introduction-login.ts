import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { userId, password } = req.body;

        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });

        const [rows]: [any[], any] = await connection.execute('SELECT password FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            await connection.end();
            return res.status(400).json({ success: false, message: 'ID가 존재하지 않습니다.' });
        }

        const hashedPassword = rows[0].password;
        const isPasswordValid = await bcrypt.compare(password, hashedPassword);

        if (!isPasswordValid) {
            await connection.end();
            return res.status(400).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
        }

        const token = jwt.sign({ id: userId, role: userId === 'admin' ? 'admin' : 'user' }, process.env.JWT_SECRET as string, {
            expiresIn: '1h',
        });

        await connection.end();

        return res.status(200).json({ success: true, token });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
