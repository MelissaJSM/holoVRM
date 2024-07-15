import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { authenticate } from '@/lib/auth';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const results = await query(`SELECT id, created_at FROM users`);
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export default authenticate(handler);
