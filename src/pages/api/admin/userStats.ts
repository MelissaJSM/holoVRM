import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { authenticate } from '@/lib/auth';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const { unit } = req.query;
    let groupByFormat = '';

    switch (unit) {
        case 'year':
            groupByFormat = '%Y';
            break;
        case 'month':
            groupByFormat = '%Y-%m';
            break;
        case 'week':
            groupByFormat = '%x-%v'; // ISO week number format for MySQL
            break;
        case 'day':
        default:
            groupByFormat = '%Y-%m-%d';
            break;
    }

    try {
        const results = await query(
            `SELECT DATE_FORMAT(created_at, ?) as date, COUNT(*) as count
             FROM users
             GROUP BY date
             ORDER BY date`,
            [groupByFormat]
        );

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export default authenticate(handler);
