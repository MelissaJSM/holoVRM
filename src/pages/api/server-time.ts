import { NextApiRequest, NextApiResponse } from 'next';
import moment from 'moment-timezone';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const serverTime = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
    res.status(200).json({ serverTime });
}
