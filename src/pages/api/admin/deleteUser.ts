import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { authenticate } from '@/lib/auth';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id } = req.body;

    try {
        await query(`DELETE FROM users WHERE id = ?`, [id]);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export default authenticate(handler);
