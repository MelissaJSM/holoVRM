import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { email, turnstileToken } = req.body;

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
            const [rows]: [any[], any] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);

            await connection.end();

            if (rows.length > 0) {
                return res.status(200).json({ success: true, userId: rows[0].id });
            } else {
                return res.status(404).json({ success: false, message: '해당 이메일로 등록된 ID가 없습니다.' });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
