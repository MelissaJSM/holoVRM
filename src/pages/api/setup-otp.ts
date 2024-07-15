import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { userId } = req.body;

        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });

        let otpSecret = authenticator.generateSecret();

        try {
            await connection.execute('UPDATE users SET otp_secret = ? WHERE id = ?', [otpSecret, userId]);

            const otpAuthUrl = `otpauth://totp/Admin?secret=${otpSecret}&issuer=HoloVRM`;
            const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

            res.status(200).json({ success: true, secret: otpSecret, qrCodeUrl });
        } catch (error) {
            console.error('Error generating OTP secret:', error);
            res.status(500).json({ success: false, message: 'Error generating OTP secret' });
        } finally {
            await connection.end();
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
