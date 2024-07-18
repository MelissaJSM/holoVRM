import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';
import fetch from 'node-fetch';

const db = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

const getIPv4FromIPv6 = (ip: string): string => {
    const ipv4Match = ip.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/);
    if (ipv4Match) {
        return ipv4Match[1];
    }
    return ip;
};

interface IpApiResponse {
    country: string;
}

const getCountryFromIP = async (ip: string): Promise<string> => {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json() as IpApiResponse;
    return data.country || 'Unknown';
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        let ip = req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || '';

        if (ip.includes(',')) {
            ip = ip.split(',')[0];
        }

        const originalIp = ip;
        ip = getIPv4FromIPv6(ip);
        const country = await getCountryFromIP(ip);

        try {
            const [result] = await db.query(
                'INSERT INTO access_logs (ip_address, original_ip, country) VALUES (?, ?, ?)',
                [ip, originalIp, country]
            );
            res.status(200).json({ success: true });
        } catch (error) {
            const errorMessage = (error as Error).message;
            res.status(500).json({ success: false, message: errorMessage });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
};

export default handler;
