import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const result = await query('SELECT * FROM banned_ips');
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch banned IPs' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
