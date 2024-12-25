// src/pages/api/auth/register/verify.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    console.log('api/auth/register/verify.ts');
    console.log('req.body:', req.body);
    const { attestationResponse } = req.body;

    // ユーザーの challenge を取得
    const user = await prisma.user.findUnique({
      where: { username: attestationResponse.response.clientDataJSON }, // ここでユーザーを特定
    });

    if (!user || user.challenge !== attestationResponse.response.clientDataJSON) {
      return res.status(400).json({ message: 'Invalid challenge' });
    }

    try {
      // 登録情報の検証
      const verification = await verifyRegistrationResponse({
        response: attestationResponse,
        expectedChallenge: user.challenge,
        expectedOrigin: 'http://localhost:3000', // 適切なオリジンに変更
        expectedRPID: 'example.com',
      });

      if (verification.verified) {
        // 登録成功
        await prisma.user.update({
          where: { username: user.username },
          data: { passkey: verification.registrationInfo }, // 登録情報を保存
        });
        return res.status(200).json({ success: true });
      } else {
        return res.status(400).json({ message: 'Registration failed' });
      }
    } catch (error) {
      console.error('Error during registration:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
