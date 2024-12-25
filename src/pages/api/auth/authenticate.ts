// src/pages/api/auth/authenticate.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { username } = req.body;

    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // 認証オプションを生成
    const options = await generateAuthenticationOptions({
      rpID: 'localhost',
      userID: user.username,
      excludeCredentials: user.passkey ? [{ id: user.passkey.id }] : [],
      timeout: 60000,
    });

    // 認証オプションをクライアントに返す
    return res.json(options);
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
