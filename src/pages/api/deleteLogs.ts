import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

const db = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'DELETE') {
        try {
            await db.query('DELETE FROM access_logs');
            res.status(200).json({ success: true, message: 'All logs deleted successfully' });
        } catch (error) {
            const errorMessage = (error as Error).message;
            res.status(500).json({ success: false, message: errorMessage });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
};

export default handler;
