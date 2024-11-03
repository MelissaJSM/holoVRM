import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId, nickname } = req.body; // body에서 userId와 nickname 받기

    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });

    try {
        // 사용자가 이미 존재하는지 확인
        const [rows]: [any[], any] = await connection.execute('SELECT id FROM users WHERE id = ?', [userId]);

        if (rows.length > 0) {
            // 이미 존재하면 nickname을 업데이트
            await connection.execute('UPDATE users SET nickname = ? WHERE id = ?', [nickname, userId]);
            await connection.end();
            return res.status(200).json({ success: true, message: '닉네임이 업데이트되었습니다.' });
        } else {
            // 존재하지 않으면 새로 삽입
            await connection.execute('INSERT INTO users (id, nickname) VALUES (?, ?)', [userId, nickname]);
            await connection.end();
            return res.status(200).json({ success: true, message: '새로운 닉네임이 저장되었습니다.' });
        }
    } catch (error) {
        await connection.end();
        console.error('Error saving nickname:', error);
        return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
}
