// src/pages/api/auth/authenticate/verify.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';  // Prismaのインスタンスをインポート

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { authenticationResponse } = req.body;

    // 認証に必要なユーザーID（登録された時に保存したもの）をデータベースから取得
    const user = await prisma.user.findUnique({
      where: { userId: authenticationResponse.user.id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // WebAuthnの認証応答を検証
    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: user.challenge,
      expectedOrigin: 'http://localhost:3000', // 適切なオリジンに変更
      expectedRPID: 'example.com', // 適切なRP IDに変更
    });

    if (!verification.verified) {
      return res.status(400).json({ message: 'Authentication failed' });
    }

    // 認証が成功した場合の処理
    // 必要に応じて、成功した認証に基づいてトークンを発行するなどの処理を行います。
    // 例えば、JWTトークンの発行など
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error during authentication:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
