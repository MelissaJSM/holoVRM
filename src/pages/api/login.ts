import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { userId, password, otp, isIntroduction } = req.body;

        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });

        const [rows]: [any[], any] = await connection.execute('SELECT password, last_character, otp_secret FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            await connection.end();
            return res.status(400).json({ success: false, message: 'ID가 존재하지 않습니다.' });
        }

        const hashedPassword = rows[0].password;
        const lastCharacter = rows[0].last_character;
        const otpSecret = rows[0].otp_secret;
        const isPasswordValid = await bcrypt.compare(password, hashedPassword);

        if (!isPasswordValid) {
            await connection.end();
            return res.status(400).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
        }

        const isAdmin = userId === 'admin';

        if (isAdmin && !isIntroduction) {
            if (!otpSecret) {
                await connection.end();
                return res.status(200).json({ success: true, otpSetupRequired: true });
            }
            if (!otp || !authenticator.check(otp, otpSecret)) {
                await connection.end();
                return res.status(400).json({ success: false, message: 'OTP가 일치하지 않습니다.' });
            }
        }

        const token = jwt.sign({ id: userId, role: isAdmin ? 'admin' : 'user' }, process.env.JWT_SECRET as string, {
            expiresIn: '1h',
        });

        const otpSetupRequired = isAdmin && !otpSecret;

        const serverUrl = process.env.SERVER_URL;
        await fetch(`${serverUrl}/api/recordLoginAttempt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: 'user', userId }),
        });

        await connection.end();

        console.log('로그인 성공:', userId, '마지막 캐릭터:', lastCharacter);

        return res.status(200).json({ success: true, token, lastCharacter, otpSetupRequired });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
