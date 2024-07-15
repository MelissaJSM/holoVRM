import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

type Data = {
    exists: boolean;
};

interface UserRow extends RowDataPacket {
    otp_secret: string;
}

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
    if (req.method !== 'POST') {
        return res.status(405).end(); // Method Not Allowed
    }

    const { userId } = req.body;

    try {
        const results = await query('SELECT otp_secret FROM users WHERE id = ?', [userId]) as UserRow[];

        if (results.length > 0 && results[0].otp_secret) {
            return res.status(200).json({ exists: true });
        }

        return res.status(200).json({ exists: false });
    } catch (error) {
        console.error('Database query error', error);
        return res.status(500).json({ exists: false });
    }
};

export default handler;
