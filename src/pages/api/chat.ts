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
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });

  if (req.method === 'POST') {
    // 대화 기록 저장
    const { userId, role, message } = req.body;
    try {
      await connection.execute(
          'INSERT INTO chat_logs (user_id, role, message) VALUES (?, ?, ?)',
          [userId, role, message]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving chat log:', error);
      res.status(500).json({ success: false, message: 'Failed to save chat log' });
    }
  } else if (req.method === 'GET') {
    // 대화 기록 불러오기
    const { userId } = req.query;
    try {
      const [rows]: [any[], any] = await connection.execute(
          'SELECT role, message, timestamp FROM chat_logs WHERE user_id = ? ORDER BY timestamp ASC',
          [userId]
      );
      res.status(200).json({ success: true, chatLogs: rows });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch chat logs' });
    }
  }
  else if (req.method === 'DELETE') {
    // 대화 기록 삭제
    const { userId } = req.query;
    try {
      await connection.execute(
          'DELETE FROM chat_logs WHERE user_id = ?',
          [userId]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting chat logs:', error);
      res.status(500).json({ success: false, message: 'Failed to delete chat logs' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 연결 종료
  await connection.end();
}
