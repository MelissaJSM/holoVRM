// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from "next";
import mysql from 'mysql2/promise';

type Data = {
  message?: string;
  success?: boolean;
  chatLogs?: { role: string; message: string; timestamp: string }[];
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE
    });

    if (req.method === 'POST') {
      // 대화 기록 저장
      const { userId, role, message, character_degree } = req.body;
      console.log("post 로 들어온 character_degree 값 : " + character_degree);
      await connection.execute(
          'INSERT INTO chat_logs (user_id, role, message, character_degree) VALUES (?, ?, ?, ?)',
          [userId, role, message, character_degree]
      );
      res.status(200).json({ success: true });
    } else if (req.method === 'GET') {
      // 대화 기록 불러오기
      const { userId, character_degree } = req.query;
      console.log("get 로 들어온 character_degree 값 : " + character_degree);
      const [rows]: [any[], any] = await connection.execute(
          'SELECT role, message, timestamp FROM chat_logs WHERE user_id = ? AND character_degree = ? ORDER BY timestamp ASC',
          [userId, character_degree]
      );
      res.status(200).json({ success: true, chatLogs: rows });
    } else if (req.method === 'DELETE') {
      // 대화 기록 삭제
      const { userId, character_degree } = req.query;
      console.log("get 로 들어온 character_degree 삭제 값 : " + character_degree);
      await connection.execute(
          'DELETE FROM chat_logs WHERE user_id = ? AND character_degree = ?',
          [userId, character_degree]
      );
      res.status(200).json({ success: true });
    } else {
      res.setHeader('Allow', ['POST', 'GET', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error handling chat request:', error);
    res.status(500).json({ success: false, message: 'Failed to handle chat request' });
  } finally {
    if (connection) await connection.end(); // 연결 종료
  }
}
