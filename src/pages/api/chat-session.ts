import { withIronSession } from "next-iron-session";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
    message?: string;
    success?: boolean;
    chatLogs?: { role: string; message: string; timestamp: string }[];
};

// 세션 타입 정의
interface SessionApiRequest extends NextApiRequest {
    session: {
        get: (key: string) => any;
        set: (key: string, value: any) => void;
        save: () => Promise<void>;
    };
}

async function handler(req: SessionApiRequest, res: NextApiResponse<Data>) {
    if (req.method === "POST") {
        // 세션에 대화 기록 저장
        const { role, message, character_degree } = req.body;

        // character_degree에 따라 로그를 저장
        const chatLogsKey = `chatLogs_${character_degree}`;
        const chatLogs = req.session.get(chatLogsKey) || [];
        chatLogs.push({ role, message, timestamp: new Date().toISOString() });
        req.session.set(chatLogsKey, chatLogs);
        await req.session.save();

        res.status(200).json({ success: true });
    } else if (req.method === "GET") {
        // 세션에서 대화 기록 불러오기
        const { character_degree } = req.query;
        const chatLogsKey = `chatLogs_${character_degree}`;
        const chatLogs = req.session.get(chatLogsKey) || [];
        res.status(200).json({ success: true, chatLogs });
    } else if (req.method === "DELETE") {
        // 세션에서 대화 기록 삭제
        const { character_degree } = req.query;
        const chatLogsKey = `chatLogs_${character_degree}`;
        req.session.set(chatLogsKey, []);
        await req.session.save();
        res.status(200).json({ success: true });
    } else {
        res.setHeader("Allow", ["POST", "GET", "DELETE"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default withIronSession(handler, {
    password: process.env.SESSION_PASSWORD as string,
    cookieName: "my-app-session",
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
    },
});
