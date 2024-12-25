import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { useState } from 'react';

export default function Auth() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState('');
  const [mode, setMode] = useState<'register' | 'authenticate'>('register');

  const handleRegister = async () => {
    // サーバーから登録オプションを取得
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })}
    )
    const options = await response.json();

    // WebAuthnの登録オプションで登録を開始
    if (options !== true) {

      const attestationResponse = await startRegistration({ optionsJSON: options });

      // 登録情報をバックエンドに送信
      const registerResponse = await fetch('/api/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attestationResponse }),
      });

      const result = await registerResponse.json();

      if (result.success) {
        setIsRegistered(true);
      } else {
        alert('Registration failed');
      }
    }
  };

  const handleAuthenticate = async () => {
    // サーバーから認証オプションを取得
    const response = await fetch('/api/auth/authenticate', { method: 'POST' });
    const options = await response.json();

    // WebAuthnの認証オプションで認証を開始
    const authenticationResponse = await startAuthentication({ optionsJSON: options });

    // 認証情報をバックエンドに送信
    const authResponse = await fetch('/api/auth/authenticate/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authenticationResponse }),
    });

    const result = await authResponse.json();

    if (result.success) {
      setIsAuthenticated(true);
    } else {
      alert('Authentication failed');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'register' ? 'authenticate' : 'register');
    setIsRegistered(false);
    setIsAuthenticated(false);
  };

  return (
    <div>
      <h1>{mode === 'register' ? 'Register with WebAuthn' : 'Authenticate with WebAuthn'}</h1>
      <input
        type="text"
        placeholder="Enter userId"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />

      {mode === 'register' && (
        <>
          <button onClick={handleRegister}>Register</button>
          {isRegistered && <p>Registration successful!</p>}
        </>
      )}

      {mode === 'authenticate' && (
        <>
          <button onClick={handleAuthenticate}>Authenticate</button>
          {isAuthenticated && <p>Authentication successful!</p>}
        </>
      )}

      <button onClick={toggleMode}>
        Switch to {mode === 'register' ? 'Authentication' : 'Registration'}
      </button>
    </div>
  );
}
