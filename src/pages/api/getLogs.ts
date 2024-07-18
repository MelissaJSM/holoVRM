import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

const db = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'GET') {
        const { start, end, country, ip } = req.query;
        let query = 'SELECT ip_address, original_ip, country, timestamp FROM access_logs WHERE 1=1';
        const params = [];

        if (start) {
            query += ' AND timestamp >= ?';
            params.push(start);
        }

        if (end) {
            // 종료 날짜의 하루를 추가하여 종료 날짜를 포함하도록 변경
            const endDate = new Date(end as string);
            endDate.setDate(endDate.getDate() + 1);
            query += ' AND timestamp < ?';
            params.push(endDate.toISOString().split('T')[0]);
        }

        if (country) {
            query += ' AND country = ?';
            params.push(country);
        }

        if (ip) {
            query += ' AND ip_address LIKE ?';
            params.push(`%${ip}%`);
        }

        query += ' ORDER BY timestamp DESC';

        try {
            const [rows] = await db.query(query, params);
            res.status(200).json(rows);
        } catch (error) {
            const errorMessage = (error as Error).message;
            res.status(500).json({ success: false, message: errorMessage });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
};

export default handler;
