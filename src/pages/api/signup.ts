import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const saltRounds = 10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { userId, password, email, turnstileToken } = req.body;

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

        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });

        try {
            // 사용자 ID 중복 확인
            const [idRows]: [any[], any] = await connection.execute('SELECT id FROM users WHERE id = ?', [userId]);
            if (idRows.length > 0) {
                await connection.end();
                return res.status(400).json({ success: false, message: '이미 존재하는 ID입니다.' });
            }

            // 이메일 중복 확인 (이메일이 입력된 경우)
            if (email) {
                const [emailRows]: [any[], any] = await connection.execute('SELECT email FROM users WHERE email = ?', [email]);
                if (emailRows.length > 0) {
                    await connection.end();
                    return res.status(400).json({ success: false, message: '이미 사용 중인 이메일입니다.' });
                }
            }

            // 비밀번호 해시화
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // 사용자 정보 저장
            await connection.execute(
                'INSERT INTO users (id, password, email) VALUES (?, ?, ?)',
                [userId, hashedPassword, email || null]  // 이메일이 없으면 null로 처리
            );

            // 연결 종료
            await connection.end();

            return res.status(200).json({ success: true });
        } catch (error) {
            await connection.end();
            return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
