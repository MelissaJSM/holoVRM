import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { userId, password } = req.body;

        // MySQL 연결 설정
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });

        // 사용자 ID 확인
        const [rows]: [any[], any] = await connection.execute('SELECT password, last_character FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'ID가 존재하지 않습니다.' });
        }

        const hashedPassword = rows[0].password;
        const lastCharacter = rows[0].last_character;
        const isPasswordValid = await bcrypt.compare(password, hashedPassword);

        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
        }

        // 연결 종료
        await connection.end();

        console.log('로그인 성공:', userId, '마지막 캐릭터:', lastCharacter); // 로그 추가

        return res.status(200).json({ success: true, lastCharacter });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
