import { NextApiRequest, NextApiResponse } from 'next';
import { addIPAccessRule } from '@/lib/cloudflare';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { ip_address } = req.body;

        if (!ip_address) {
            return res.status(400).json({ error: 'IP address is required' });
        }

        try {
            const normalizedIP = normalizeIPv6Address(ip_address); // IP 주소 형식 보정
            //console.log('Banning IP address:', normalizedIP);

            // Cloudflare에 IP 차단 규칙 추가
            await addIPAccessRule(normalizedIP, 'block', 'Banned via API');

            // 데이터베이스에 IP 저장
            await query('INSERT INTO banned_ips (ip_address) VALUES (?)', [normalizedIP]);

            res.status(200).json({ message: 'IP address banned successfully' });
        } catch (error: any) {
            console.error('Error banning IP address:', error);
            res.status(500).json({ error: 'Failed to ban IP address', details: error.message || JSON.stringify(error) });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

function normalizeIPv6Address(ip: string): string {
    return ip.split(':').map(part => part.padStart(4, '0')).join(':');
}
