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
            groupByFormat = '%x-%v'; // ISO week number format
            break;
        case 'day':
        default:
            groupByFormat = '%Y-%m-%d';
            break;
    }

    try {
        //console.log(`Fetching session stats with unit: ${unit}`);
        const results = await query(
            `SELECT DATE_FORMAT(timestamp, ?) as date, COUNT(*) as count
             FROM guest_login_attempts
             GROUP BY date
             ORDER BY date`,
            [groupByFormat]
        );
        //console.log(`Fetched session stats:`, results);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching session stats:', error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export default authenticate(handler);
