import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const saltRounds = 10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { userId, password, turnstileToken } = req.body;

        // Turnstile 토큰 검증
        const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `secret=${process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY}&response=${turnstileToken}`,
        });
        const turnstileData = await turnstileResponse.json();

        if (!turnstileData.success) {
            return res.status(400).json({ success: false, message: 'Turnstile 검증 실패' });
        }

        // MySQL 연결 설정
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });

        // 사용자 ID 중복 확인
        const [rows]: [any[], any] = await connection.execute('SELECT id FROM users WHERE id = ?', [userId]);
        if (rows.length > 0) {
            await connection.end();
            return res.status(400).json({ success: false, message: '이미 존재하는 ID입니다.' });
        }

        // 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 사용자 정보 저장
        await connection.execute('INSERT INTO users (id, password) VALUES (?, ?)', [userId, hashedPassword]);

        // 연결 종료
        await connection.end();

        return res.status(200).json({ success: true });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
