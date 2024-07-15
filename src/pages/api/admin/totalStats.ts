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
        console.log(`Fetching total stats with unit: ${unit}`);
        const userLogins = await query(
            `SELECT DATE_FORMAT(timestamp, ?) as date, COUNT(*) as count
             FROM user_login_attempts
             WHERE user_id != 'admin'
             GROUP BY date
             ORDER BY date`,
            [groupByFormat]
        );

        const guestLogins = await query(
            `SELECT DATE_FORMAT(timestamp, ?) as date, COUNT(*) as count
             FROM guest_login_attempts
             GROUP BY date
             ORDER BY date`,
            [groupByFormat]
        );

        // 회원 접속 로그 값을 /2로 나누기
        const adjustedUserLogins = (userLogins as { date: string; count: number }[]).map(item => ({
            ...item,
            count: Math.floor(item.count / 2),
        }));

        const totalStats: { date: string; count: number }[] = [];

        adjustedUserLogins.forEach(userLogin => {
            const existing = (guestLogins as { date: string; count: number }[]).find(guest => guest.date === userLogin.date);
            if (existing) {
                totalStats.push({ date: userLogin.date, count: userLogin.count + existing.count });
            } else {
                totalStats.push(userLogin);
            }
        });

        (guestLogins as { date: string; count: number }[]).forEach(guest => {
            if (!(adjustedUserLogins as { date: string; count: number }[]).find(user => user.date === guest.date)) {
                totalStats.push(guest);
            }
        });

        totalStats.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        console.log('Fetched total stats:', totalStats);
        res.status(200).json(totalStats);
    } catch (error) {
        console.error('Error fetching total stats:', error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export default authenticate(handler);
