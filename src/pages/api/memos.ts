import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { ResultSetHeader } from 'mysql2';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'GET') {
        try {
            const results = await query(
                'SELECT id, user, timestamp, content FROM memos ORDER BY timestamp DESC'
            );
            res.status(200).json(results);
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    } else if (req.method === 'POST') {
        const { content } = req.body;
        const user = '멜리사J'; // 하드코딩된 사용자 이름

        // 한국 시간으로 변환
        const timestamp = new Date(new Date().getTime() + 9 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ');

        try {
            const result = await query(
                'INSERT INTO memos (user, timestamp, content) VALUES (?, ?, ?)',
                [user, timestamp, content]
            ) as ResultSetHeader;
            res.status(201).json({ success: true, id: result.insertId, user, timestamp, content });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    } else if (req.method === 'DELETE') {
        const { id } = req.body;

        try {
            await query('DELETE FROM memos WHERE id = ?', [id]);
            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    } else {
        res.status(405).json({ success: false, message: 'Method not allowed' });
    }
};

export default authenticate(handler);
