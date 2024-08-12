import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

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

            if (rows.length > 0) {
                const token = crypto.randomBytes(20).toString('hex');
                const resetLink = `https://www.holovrm.com/reset-password?token=${token}`;

                await connection.execute('UPDATE users SET resetPasswordToken = ? WHERE email = ?', [token, email]);
                await connection.end();

                // Gmail을 사용한 Nodemailer 설정
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.GMAIL_USER,  // 발신자 이메일 주소
                        pass: process.env.GMAIL_PASS,  // 발신자 이메일 비밀번호 또는 앱 비밀번호
                    },
                });

                const mailOptions = {
                    to: email,
                    from: process.env.GMAIL_USER,  // 발신자 이메일 주소
                    subject: '비밀번호 재설정',
                    text: `비밀번호를 재설정하려면 다음 링크를 클릭하세요: ${resetLink}`,
                };

                transporter.sendMail(mailOptions, (error: any, response: any) => {
                    if (error) {
                        return res.status(500).json({ success: false, message: '이메일 전송 중 오류가 발생했습니다.' });
                    } else {
                        return res.status(200).json({ success: true, message: '비밀번호 재설정 이메일이 발송되었습니다.' });
                    }
                });
            } else {
                await connection.end();
                return res.status(404).json({ success: false, message: '해당 이메일로 등록된 계정이 없습니다.' });
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
