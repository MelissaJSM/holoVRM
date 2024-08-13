import { NextApiRequest, NextApiResponse } from 'next';
import { removeIPAccessRule } from '@/lib/cloudflare';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { ip_address } = req.body;

        if (!ip_address) {
            return res.status(400).json({ error: 'IP address is required' });
        }

        try {
            const normalizedIP = normalizeIPv6Address(ip_address); // IP 주소 형식 보정
            //console.log('Unbanning IP address:', normalizedIP);

            // Cloudflare에서 IP 차단 규칙 제거
            await removeIPAccessRule(normalizedIP);

            // 데이터베이스에서 IP 제거
            const result: any = await query('DELETE FROM banned_ips WHERE ip_address = ?', [normalizedIP]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'IP address not found in database' });
            }

            res.status(200).json({ message: 'IP address unbanned successfully' });
        } catch (error: any) {
            console.error('Error unbanning IP address:', error);
            res.status(500).json({ error: 'Failed to unban IP address', details: error.message || JSON.stringify(error) });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

function normalizeIPv6Address(ip: string): string {
    return ip.split(':').map(part => part.padStart(4, '0')).join(':');
}
