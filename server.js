const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');

// Web Crypto API polyfill for Node.js
const { webcrypto } = require('crypto');
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// メモリ上のユーザーデータ
const users = {};

// RP情報
const rpName = 'FIDO2 Demo';
const rpID = 'localhost';
const origin = `http://localhost:${port}`;

// セキュリティ設定
const expectedOrigins = [origin];
const expectedRPIDs = [rpID];

// 登録オプション生成
app.post('/generate-registration-options', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { username, residentKey } = req.body;
    if (!username) {
      console.log('Username is missing');
      return res.status(400).json({ error: 'username required' });
    }
    if (!users[username]) users[username] = { id: new TextEncoder().encode(username), credentials: [] };
    const user = users[username];
    
    const authenticatorSelection = residentKey
      ? { userVerification: 'preferred', residentKey: 'required', requireResidentKey: true }
      : { userVerification: 'preferred' };
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: user.id,
      userName: username,
      attestationType: 'none',
      authenticatorSelection,
      excludeCredentials: user.credentials.map(cred => ({ id: cred.id, type: 'public-key' })),
      supportedAlgorithmIDs: [-8, -7, -257, -258, -259, -37],
    });
    user.currentChallenge = options.challenge;
    console.log('Generated registration options:', options);
    res.json(options);
  } catch (error) {
    console.error('Error generating registration options:', error);
    res.status(500).json({ error: error.message });
  }
});

// 登録レスポンス検証
app.post('/verify-registration', async (req, res) => {
  console.log('Registration verification request received:', req.body);
  const { username, attResp } = req.body;
  const user = users[username];
  if (!user) return res.status(400).json({ error: 'user not found' });
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: attResp,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
    console.log('Registration verification result:', verification);
  } catch (e) {
    console.error('Registration verification error:', e.message);
    return res.status(400).json({ error: e.message });
  }
  if (verification.verified) {
    const credential = {
      id: verification.registrationInfo.credential.id,
      publicKey: verification.registrationInfo.credential.publicKey,
      counter: verification.registrationInfo.credential.counter,
      createdAt: new Date().toISOString(),
    };
    console.log('Saving credential:', credential);
    console.log('Registration info:', verification.registrationInfo);
    user.credentials.push(credential);
  }
  res.json({ verified: verification.verified });
});

// 認証オプション生成（ユーザー名指定）
app.post('/generate-authentication-options', async (req, res) => {
  try {
    console.log('Authentication request received:', req.body);
    const { username, forConditionalUI = false } = req.body;
    const user = users[username];
    if (!user || user.credentials.length === 0) {
      console.log('User not registered or no credentials');
      return res.status(404).json({ error: 'user not found' });
    }
    
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
      allowCredentials: user.credentials.map(cred => ({ 
        id: cred.id, 
        type: 'public-key' 
      })),
    });
    
    if (forConditionalUI) {
      // 条件付きUI用はグローバルチャレンジとして保存
      global.currentChallenge = options.challenge;
      console.log('Stored global challenge for conditional UI:', global.currentChallenge);
    } else {
      // 通常の認証はユーザー固有チャレンジとして保存
      user.currentChallenge = options.challenge;
      console.log('Stored challenge for user:', user.currentChallenge);
    }
    
    console.log('Generated authentication options:', options);
    console.log('Challenge type:', typeof options.challenge);
    res.json(options);
  } catch (error) {
    console.error('Error generating authentication options:', error);
    res.status(500).json({ error: error.message });
  }
});

// 認証オプション生成（ユーザー名なし - 発見可能な認証情報）
app.post('/generate-authentication-options-discoverable', async (req, res) => {
  try {
    console.log('Discoverable authentication request received');
    
    // 全ユーザーの認証情報を収集
    const allCredentials = [];
    const userMap = new Map(); // 認証情報IDとユーザー名のマッピング
    
    for (const [username, user] of Object.entries(users)) {
      for (const cred of user.credentials) {
        allCredentials.push({
          id: cred.id,
          type: 'public-key'
        });
        userMap.set(cred.id, username);
      }
    }
    
    if (allCredentials.length === 0) {
      console.log('No credentials found');
      return res.status(400).json({ error: 'no credentials found' });
    }
    
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
      allowCredentials: allCredentials,
    });
    
    // グローバルチャレンジとして保存（ユーザー名なしの場合）
    global.currentChallenge = options.challenge;
    
    // ユーザーマッピング情報も含めて返す
    const response = {
      ...options,
      userMap: Object.fromEntries(userMap)
    };
    
    console.log('Generated discoverable authentication options:', response);
    res.json(response);
  } catch (error) {
    console.error('Error generating discoverable authentication options:', error);
    res.status(500).json({ error: error.message });
  }
});

// 認証レスポンス検証
app.post('/verify-authentication', async (req, res) => {
  try {
    console.log('Authentication verification request received:', req.body);
    const { username, authResp, credentialId } = req.body;
    
    let user;
    let credentialIndex = 0;
    
    if (username) {
      // ユーザー名指定の場合
      user = users[username];
      if (!user) {
        console.log('User not found:', username);
        return res.status(400).json({ error: 'user not found' });
      }
      if (!user.credentials || user.credentials.length === 0) {
        console.log('No credentials found for user:', username);
        return res.status(400).json({ error: 'no credentials found' });
      }
    } else if (credentialId) {
      // 認証情報IDからユーザーを特定
      for (const [userName, userData] of Object.entries(users)) {
        const index = userData.credentials.findIndex(cred => cred.id === credentialId);
        if (index !== -1) {
          user = userData;
          credentialIndex = index;
          break;
        }
      }
      
      if (!user) {
        console.log('Credential not found:', credentialId);
        return res.status(400).json({ error: 'credential not found' });
      }
    } else {
      return res.status(400).json({ error: 'username or credentialId required' });
    }
    
    // チャレンジの取得（ユーザー名指定またはグローバル）
    let expectedChallenge;
    if (username) {
      expectedChallenge = user.currentChallenge;
    } else {
      expectedChallenge = global.currentChallenge;
    }
    
    console.log('Current challenge for user:', expectedChallenge);
    console.log('User credentials:', user.credentials);
    console.log('Selected credential:', user.credentials[credentialIndex]);
    
    const verification = await verifyAuthenticationResponse({
      response: authResp,
      expectedChallenge: expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: user.credentials[credentialIndex].id,
        publicKey: user.credentials[credentialIndex].publicKey,
        counter: user.credentials[credentialIndex].counter,
      },
    });
    console.log('Authentication verification result:', verification);
    
    // 認証成功時にカウンターを更新
    if (verification.verified) {
      user.credentials[credentialIndex].counter = verification.authenticationInfo.newCounter;
    }
    
    res.json({ verified: verification.verified });
  } catch (error) {
    console.error('Authentication verification error:', error.message);
    return res.status(400).json({ error: error.message });
  }
});

// 認証器一覧取得
app.get('/credentials/:username', (req, res) => {
  const { username } = req.params;
  const user = users[username];
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }
  const credentials = user.credentials.map((cred, index) => ({
    id: cred.id,
    index,
    counter: cred.counter,
    createdAt: cred.createdAt || new Date().toISOString()
  }));
  res.json({ credentials });
});

// 認証器削除
app.delete('/credentials/:username/:index', (req, res) => {
  const { username, index } = req.params;
  const user = users[username];
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }
  const credIndex = parseInt(index);
  if (credIndex < 0 || credIndex >= user.credentials.length) {
    return res.status(400).json({ error: 'invalid credential index' });
  }
  const deletedCred = user.credentials.splice(credIndex, 1)[0];
  console.log('Deleted credential:', deletedCred);
  res.json({ success: true, deletedCredential: deletedCred });
});

app.listen(port, () => {
  console.log(`FIDO2 demo server listening at http://localhost:${port}`);
}); 