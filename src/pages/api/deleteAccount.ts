import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { userId, password } = req.body;

        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });

        try {
            // 사용자 ID와 패스워드 확인
            const [userRows]: [any[], any] = await connection.execute('SELECT password FROM users WHERE id = ?', [userId]);
            if (userRows.length === 0) {
                await connection.end();
                return res.status(400).json({ success: false, message: 'ID가 존재하지 않습니다.' });
            }

            const hashedPassword = userRows[0].password;
            const isPasswordValid = await bcrypt.compare(password, hashedPassword);
            if (!isPasswordValid) {
                await connection.end();
                return res.status(400).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
            }

            // 계정과 관련된 채팅 로그 삭제
            await connection.execute('DELETE FROM chat_logs WHERE user_id = ?', [userId]);

            // 사용자 계정 삭제
            await connection.execute('DELETE FROM users WHERE id = ?', [userId]);

            await connection.end();
            return res.status(200).json({ success: true });
        } catch (error) {
            await connection.end();
            console.error('Error deleting account:', error);
            return res.status(500).json({ success: false, message: '계정 삭제 중 오류가 발생했습니다.' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
