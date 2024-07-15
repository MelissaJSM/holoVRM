import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const { userId, sessionId, character, message } = req.body;

    console.log('Received data:', { userId, sessionId, character, message }); // 요청 데이터 로그 출력

    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });

        if (sessionId) {
            // 세션 ID가 sessions 테이블에 존재하는지 확인
            const [rows] = await connection.execute(
                'SELECT session_id FROM sessions WHERE session_id = ?',
                [sessionId]
            );

            // rows가 배열인지 확인
            if (Array.isArray(rows) && rows.length === 0) {
                // 세션 ID가 존재하지 않으면 삽입
                await connection.execute(
                    'INSERT INTO sessions (session_id, timestamp) VALUES (?, ?)',
                    [sessionId, new Date()]
                );
            }
        }

        if (userId) {
            await connection.execute(
                'INSERT INTO character_logs (user_id, `character`, message) VALUES (?, ?, ?)',
                [userId, character, message]
            );
        } else if (sessionId) {
            await connection.execute(
                'INSERT INTO character_logs (session_id, `character`, message) VALUES (?, ?, ?)',
                [sessionId, character, message]
            );
        }

        await connection.end();

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error logging character message:', error); // 오류 로그 출력
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

const authenticate = (handler: Function) => async (req: NextApiRequest, res: NextApiResponse) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return handler(req, res); // 인증 헤더가 없는 경우도 허용
    }

    const token = authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        (req as any).user = decoded;
        return handler(req, res);
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export default authenticate(handler);
