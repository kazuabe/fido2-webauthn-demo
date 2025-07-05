// ダークモード切り替え
function toggleTheme() {
  const body = document.body;
  const themeToggle = document.querySelector('.theme-toggle');
  
  if (body.getAttribute('data-theme') === 'dark') {
    body.removeAttribute('data-theme');
    themeToggle.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  } else {
    body.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  }
}

// テーマの初期化
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.setAttribute('data-theme', 'dark');
    document.querySelector('.theme-toggle').textContent = '☀️';
  }
}

// 進捗表示の管理
let currentStep = 0;
const totalSteps = 3;

function updateProgress(step, message = '') {
  currentStep = step;
  const progressBar = document.querySelector('.progress-bar');
  const steps = document.querySelectorAll('.step');
  const loadingText = document.querySelector('#loading p');
  
  const progress = (step / totalSteps) * 100;
  progressBar.style.width = `${progress}%`;
  
  steps.forEach((stepEl, index) => {
    stepEl.classList.remove('active', 'completed');
    if (index < step) {
      stepEl.classList.add('completed');
    } else if (index === step) {
      stepEl.classList.add('active');
    }
  });
  
  if (message) {
    loadingText.textContent = message;
  }
}

// エラーメッセージの詳細化
function getDetailedErrorMessage(error) {
  if (error.name === 'NotAllowedError') {
    return '認証がキャンセルされました。再度お試しください。';
  } else if (error.name === 'InvalidStateError') {
    return '認証器が既に登録されています。別の認証器をお試しください。';
  } else if (error.name === 'NotSupportedError') {
    return 'お使いのブラウザまたはデバイスがWebAuthnに対応していません。';
  } else if (error.name === 'SecurityError') {
    return 'セキュリティエラーが発生しました。HTTPS環境でお試しください。';
  } else if (error.name === 'NetworkError') {
    return 'ネットワークエラーが発生しました。接続を確認してください。';
  } else {
    return error.message || '予期しないエラーが発生しました。';
  }
}

// ボタンの無効化/有効化
function setButtonsEnabled(enabled) {
  const buttons = document.querySelectorAll('button:not(.theme-toggle)');
  buttons.forEach(button => {
    button.disabled = !enabled;
  });
}

async function post(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

function bufferDecode(value) {
  if (!value) {
    console.error('bufferDecode: value is undefined or null');
    return new Uint8Array(0);
  }
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}

function bufferEncode(value) {
  return btoa(String.fromCharCode(...new Uint8Array(value)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function showLoading() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('result').style.display = 'none';
  document.getElementById('error').style.display = 'none';
  setButtonsEnabled(false);
  updateProgress(0, 'サーバーに接続中...');
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
  setButtonsEnabled(true);
  currentStep = 0;
}

function showMessage(elementId, message, className) {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.className = `status ${className}`;
  element.style.display = 'block';
}

function clearMessages() {
  document.getElementById('result').style.display = 'none';
  document.getElementById('error').style.display = 'none';
}

// 認証器一覧を表示
async function loadCredentials(username) {
  try {
    const response = await fetch(`/credentials/${username}`);
    const data = await response.json();
    if (data.credentials && data.credentials.length > 0) {
      displayCredentials(data.credentials, username);
      document.getElementById('credentials-section').style.display = 'block';
    } else {
      document.getElementById('credentials-section').style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading credentials:', error);
  }
}

// 認証器一覧をUIに表示
function displayCredentials(credentials, username) {
  const container = document.getElementById('credentials-list');
  container.innerHTML = '';
  
  credentials.forEach((cred, index) => {
    const credElement = document.createElement('div');
    credElement.className = 'credential-item';
    
    const credInfo = document.createElement('div');
    credInfo.innerHTML = `
      <strong>認証器 ${index + 1}</strong><br>
      <small>ID: ${cred.id.substring(0, 20)}...</small><br>
      <small>カウンター: ${cred.counter}</small><br>
      <small>登録日: ${new Date(cred.createdAt).toLocaleDateString()}</small>
    `;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '削除';
    deleteBtn.className = 'btn-login';
    deleteBtn.style.cssText = `
      padding: 8px 15px;
      font-size: 14px;
      margin-left: 10px;
    `;
    deleteBtn.onclick = () => deleteCredential(username, index);
    
    credElement.appendChild(credInfo);
    credElement.appendChild(deleteBtn);
    container.appendChild(credElement);
  });
}

// 認証器削除
async function deleteCredential(username, index) {
  if (!confirm('この認証器を削除しますか？')) {
    return;
  }
  
  try {
    const response = await fetch(`/credentials/${username}/${index}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    
    if (data.success) {
      showMessage('result', '✅ 認証器を削除しました', 'success');
      await loadCredentials(username);
    } else {
      showMessage('error', '❌ 認証器の削除に失敗しました', 'error');
    }
  } catch (error) {
    console.error('Error deleting credential:', error);
    showMessage('error', '❌ 認証器の削除中にエラーが発生しました', 'error');
  }
}

// 認証器追加ボタンの処理
document.getElementById('add-credential').onclick = async () => {
  const username = document.getElementById('username').value;
  if (!username) {
    showMessage('error', 'ユーザー名を入力してください', 'error');
    return;
  }
  
  // 登録処理を実行
  await performRegistration();
  
  // 登録完了後に認証器一覧を更新
  setTimeout(() => {
    loadCredentials(username);
  }, 1000);
};

// 登録処理（統合版）
async function performRegistration() {
  const username = document.getElementById('username').value;
  if (!username) {
    showMessage('error', 'ユーザー名を入力してください', 'error');
    return;
  }
  
  clearMessages();
  showLoading();
  
  try {
    updateProgress(1, '登録オプションを取得中...');
    
    // サーバから登録オプション取得（パスキー対応を自動的に有効化）
    const options = await post('/generate-registration-options', { 
      username, 
      residentKey: true  // 常にパスキー対応を有効化
    });
    console.log('Registration options:', options);
    
    if (!options.challenge) {
      showMessage('error', 'サーバーからのレスポンスが不正です', 'error');
      hideLoading();
      return;
    }
    
    updateProgress(2, '認証器で登録中...');
    
    options.challenge = bufferDecode(options.challenge);
    options.user.id = bufferDecode(options.user.id);
    if (options.excludeCredentials) {
      options.excludeCredentials = options.excludeCredentials.map(cred => ({ 
        ...cred, 
        id: bufferDecode(cred.id) 
      }));
    }
    
    // WebAuthn登録（パスキー対応）
    console.log('Creating credential with options:', options);
    const attResp = await navigator.credentials.create({ publicKey: options });
    console.log('Credential created:', attResp);
    
    updateProgress(3, '登録を検証中...');
    
    // サーバへ登録レスポンス送信
    const res = await post('/verify-registration', {
      username,
      attResp: {
        id: attResp.id,
        rawId: bufferEncode(attResp.rawId),
        response: {
          clientDataJSON: bufferEncode(attResp.response.clientDataJSON),
          attestationObject: bufferEncode(attResp.response.attestationObject),
        },
        type: attResp.type,
        clientExtensionResults: attResp.getClientExtensionResults(),
      },
    });
    console.log('Registration verification result:', res);
    
    if (res.verified) {
      showMessage('result', '✅ パスキー登録が完了しました！', 'success');
    } else {
      showMessage('error', '❌ 登録に失敗しました', 'error');
    }
  } catch (e) {
    console.error('Registration error:', e);
    const detailedError = getDetailedErrorMessage(e);
    showMessage('error', `❌ 登録エラー: ${detailedError}`, 'error');
  } finally {
    hideLoading();
  }
}

// 条件付きUIで選択された認証情報を使って認証を実行
async function performAuthenticationWithCredential(credential, username) {
  clearMessages();
  showLoading();
  
  try {
    updateProgress(1, '認証情報を検証中...');
    
    // サーバへ認証レスポンス送信（条件付きUI用はグローバルチャレンジを使用）
    const res = await post('/verify-authentication', {
      authResp: {
        id: credential.id,
        rawId: bufferEncode(credential.rawId),
        response: {
          clientDataJSON: bufferEncode(credential.response.clientDataJSON),
          authenticatorData: bufferEncode(credential.response.authenticatorData),
          signature: bufferEncode(credential.response.signature),
          userHandle: credential.response.userHandle ? bufferEncode(credential.response.userHandle) : null,
        },
        type: credential.type,
        clientExtensionResults: credential.getClientExtensionResults(),
      },
      credentialId: credential.id, // 認証情報IDでユーザーを特定
    });
    console.log('Conditional UI authentication result:', res);
    
    if (res.verified) {
      showMessage('result', '✅ パスキー認証が成功しました！', 'success');
    } else {
      showMessage('error', '❌ 認証に失敗しました', 'error');
    }
  } catch (e) {
    console.error('Conditional UI authentication error:', e);
    const detailedError = getDetailedErrorMessage(e);
    showMessage('error', `❌ 認証エラー: ${detailedError}`, 'error');
  } finally {
    hideLoading();
  }
}

// 認証処理（改善版）
async function performAuthentication() {
  const username = document.getElementById('username').value;
  
  clearMessages();
  showLoading();
  
  try {
    updateProgress(1, '認証オプションを取得中...');
    
    let options;
    let userMap = null;
    
    if (username) {
      // ユーザー名指定の場合
      console.log('Using username-based authentication for:', username);
      options = await post('/generate-authentication-options', { username });
    } else {
      // ユーザー名なし - 発見可能な認証情報を使用
      console.log('Using discoverable credentials authentication');
      const response = await post('/generate-authentication-options-discoverable');
      options = response;
      userMap = response.userMap;
    }
    
    console.log('Authentication options received:', options);
    
    if (!options.challenge) {
      if (options.error === 'user not found') {
        showMessage('error', '❌ このユーザー名は登録されていません', 'error');
      } else if (options.error === 'no credentials found') {
        showMessage('error', '❌ 登録済みの認証情報が見つかりません', 'error');
      } else {
        showMessage('error', '❌ サーバーからのレスポンスが不正です', 'error');
      }
      hideLoading();
      return;
    }
    
    updateProgress(2, '認証器で認証中...');
    
    options.challenge = bufferDecode(options.challenge);
    if (options.allowCredentials) {
      options.allowCredentials = options.allowCredentials.map(cred => ({ 
        ...cred, 
        id: bufferDecode(cred.id) 
      }));
    }
    
    // WebAuthn認証
    console.log('Calling navigator.credentials.get with options:', options);
    const authResp = await navigator.credentials.get({ publicKey: options });
    console.log('Authentication response received:', authResp);
    
    updateProgress(3, '認証を検証中...');
    
    // サーバへ認証レスポンス送信
    const requestData = {
      authResp: {
        id: authResp.id,
        rawId: bufferEncode(authResp.rawId),
        response: {
          clientDataJSON: bufferEncode(authResp.response.clientDataJSON),
          authenticatorData: bufferEncode(authResp.response.authenticatorData),
          signature: bufferEncode(authResp.response.signature),
          userHandle: authResp.response.userHandle ? bufferEncode(authResp.response.userHandle) : null,
        },
        type: authResp.type,
        clientExtensionResults: authResp.getClientExtensionResults(),
      },
    };
    
    // ユーザー名または認証情報IDを追加
    if (username) {
      requestData.username = username;
    } else {
      requestData.credentialId = authResp.id;
    }
    
    const res = await post('/verify-authentication', requestData);
    console.log('Authentication verification result:', res);
    
    if (res.verified) {
      const successMessage = username 
        ? '✅ 認証が成功しました！' 
        : '✅ パスキー認証が成功しました！';
      showMessage('result', successMessage, 'success');
    } else {
      showMessage('error', '❌ 認証に失敗しました', 'error');
    }
  } catch (e) {
    console.error('Authentication error:', e);
    const detailedError = getDetailedErrorMessage(e);
    showMessage('error', `❌ 認証エラー: ${detailedError}`, 'error');
  } finally {
    hideLoading();
  }
}

// イベントリスナーの設定
document.getElementById('register').onclick = performRegistration;
document.getElementById('login').onclick = performAuthentication;

// 条件付きUI機能
let conditionalUIAbortController = null;

// ユーザー名入力時に認証器一覧を表示
document.getElementById('username').oninput = async () => {
  const username = document.getElementById('username').value;
  if (username) {
    await loadCredentials(username);
  } else {
    document.getElementById('credentials-section').style.display = 'none';
  }
};

// ユーザー名入力欄にフォーカスしたときに条件付きUIを開始
document.getElementById('username').onfocus = async () => {
  const username = document.getElementById('username').value;
  if (!username) {
    console.log('No username entered, skipping conditional UI');
    return;
  }
  
  console.log('Starting conditional UI for username:', username);
  
  try {
    // 既存の条件付きUIをキャンセル
    if (conditionalUIAbortController) {
      conditionalUIAbortController.abort();
    }
    
    conditionalUIAbortController = new AbortController();
    
    // サーバから認証オプション取得（条件付きUI用）
    const options = await post('/generate-authentication-options', { 
      username, 
      forConditionalUI: true 
    });
    
    if (!options.challenge) {
      console.log('No challenge received from server');
      return;
    }
    
    // 条件付きUI用のオプションを設定
    const conditionalOptions = {
      ...options,
      challenge: bufferDecode(options.challenge),
      allowCredentials: options.allowCredentials?.map(cred => ({ 
        ...cred, 
        id: bufferDecode(cred.id) 
      })) || [],
      mediation: 'conditional',
      userVerification: 'preferred'
    };
    
    console.log('Starting conditional UI with options:', conditionalOptions);
    
    // 条件付きUIを開始
    const credential = await navigator.credentials.get({ 
      publicKey: conditionalOptions,
      signal: conditionalUIAbortController.signal
    });
    
    if (credential) {
      console.log('Conditional UI credential selected:', credential);
      
      // 自動的に認証処理を実行
      await performAuthenticationWithCredential(credential, username);
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Conditional UI was aborted');
    } else {
      console.error('Conditional UI error:', error);
    }
  }
};

// ユーザー名入力欄からフォーカスが外れたときに条件付きUIをキャンセル
document.getElementById('username').onblur = () => {
  if (conditionalUIAbortController) {
    conditionalUIAbortController.abort();
    conditionalUIAbortController = null;
  }
};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
}); 