import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const { userId, sessionId, character, message } = req.body;

    console.log('Received data:', { userId, sessionId, character, message }); // 요청 데이터 로그 출력

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        if (sessionId) {
            // 세션 ID가 sessions 테이블에 존재하는지 확인
            const [rows] = await connection.execute(
                'SELECT session_id FROM sessions WHERE session_id = ?',
                [sessionId]
            );

            if (Array.isArray(rows) && rows.length === 0) {
                // 세션 ID가 존재하지 않으면 삽입
                await connection.execute(
                    'INSERT INTO sessions (session_id, timestamp) VALUES (?, ?)',
                    [sessionId, new Date()]
                );
            }
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error logging character message:', error); // 오류 로그 출력
        res.status(500).json({ success: false, message: (error as Error).message });
    } finally {
        if (connection) await connection.end(); // 연결 종료
    }
};

const authenticate = (handler: Function) => async (req: NextApiRequest, res: NextApiResponse) => {
    const { authorization } = req.headers;

    console.log('Authorization header:', authorization); // 로그 추가
    console.log('JWT_SECRET:', process.env.JWT_SECRET); // 환경 변수 로그 추가

    if (authorization) {
        const token = authorization.split(' ')[1];
        console.log('Extracted token:', token); // 추출된 토큰 로그 추가

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
            console.log('Decoded token:', decoded); // 디코딩된 토큰 로그 추가
            (req as any).user = decoded;
        } catch (error) {
            console.error('JWT verification error 하지만 그래도 진행하도록 합니다. :', error); // JWT 오류 로그 추가
            // 토큰 검증 실패 시 오류 로그를 출력하고 요청을 계속 처리
        }
    }

    return handler(req, res);
};

export default authenticate(handler);
