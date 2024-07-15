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
            `SELECT DATE_FORMAT(timestamp, ?) as date, COUNT(*) as count
             FROM user_login_attempts
             WHERE user_id != 'admin'
             GROUP BY date
             ORDER BY date`,
            [groupByFormat]
        );

        // 회원 접속 로그 값을 /2로 나누고 소수점을 버림 처리
        const adjustedResults = (results as { date: string; count: number }[]).map(item => ({
            ...item,
            count: Math.floor(item.count / 2),
        }));

        res.status(200).json(adjustedResults);
    } catch (error) {
        console.error('Error fetching user login stats:', error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export default authenticate(handler);
