import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const saltRounds = 10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { token, password } = req.body;

        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });

        try {
            const [rows]: [any[], any] = await connection.execute('SELECT id FROM users WHERE resetPasswordToken = ?', [token]);

            if (rows.length > 0) {
                const hashedPassword = await bcrypt.hash(password, saltRounds);

                await connection.execute('UPDATE users SET password = ?, resetPasswordToken = NULL WHERE resetPasswordToken = ?', [hashedPassword, token]);
                await connection.end();

                return res.status(200).json({ success: true, message: '비밀번호가 성공적으로 재설정되었습니다.' });
            } else {
                await connection.end();
                return res.status(400).json({ success: false, message: '유효하지 않은 토큰입니다.' });
            }
        } catch (error) {
            await connection.end();
            return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
