import { NextApiRequest, NextApiResponse } from 'next';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {


  if (req.method === 'POST') {
    // ユーザー名を受け取る（登録用）
    const { userId } = req.body;
    console.log('req.body:', req.body);

    // ユーザーがすでに登録されているか確認
    let user = await prisma.user.findUnique({ where: { userId } });

    // ユーザーが存在しない場合は新しく作成
    if (!user) {
      user = await prisma.user.create({
        data: {
          userId,
          username: `User ${userId}`, // ユーザー名は適宜設定
          challenge: '', // challengeを初期化
        },
      });
      console.log('New user created:', user);
    }

    if (!user.challenge) {
      // WebAuthn登録オプションを生成
      const options = await generateRegistrationOptions({
        rpName: 'Example Corp',
        rpID: 'localhost',
        userID: stringToUint8Array(userId),  // ここでUint8Arrayを渡す
        userName: user.username,
        timeout: 60000,
        attestationType: 'none',
        authenticatorSelection: {
          userVerification: 'required',
        },
      });

      console.log('Generated options:', options);
      // challengeをデータベースに保存
      await prisma.user.update({ data: {
          challenge: options.challenge,
        },
        where: { userId },
      });
      // options を返す
      return res.status(200).json(options);
    }
    return res.status(200).json(true);

  }} catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}

// ユーザーIDをUint8Arrayに変換する関数
const stringToUint8Array = (str: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(str);
};