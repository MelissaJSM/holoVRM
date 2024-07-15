import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const refreshTokenHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token is required' });
    }

    try {
        // 리프레시 토큰 검증
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as jwt.Secret);
        const userId = (decoded as any).id;

        // 새로운 액세스 토큰 발급
        const newAccessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET as jwt.Secret, { expiresIn: '15m' });

        res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

export default refreshTokenHandler;
