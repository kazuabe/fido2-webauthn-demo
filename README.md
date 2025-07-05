# FIDO2 WebAuthn デモ

パスワードレス認証の国際標準規格「FIDO2 WebAuthn」のデモサイトです。

## 🌐 デモサイト

**GitHub Pages**: https://kazuabe.github.io/fido2-webauthn-demo/

## ✨ 機能

- 🔐 **FIDO2 WebAuthn認証**
  - パスワードレス認証
  - 生体認証対応
  - セキュリティキー対応

- 🔑 **パスキー機能**
  - 条件付きUI（パスキーレコメンド）
  - ユーザー名なし認証
  - 複数認証器管理

- 🎨 **モダンUI**
  - レスポンシブデザイン
  - ダークモード対応
  - アニメーション効果

- 📱 **UX向上**
  - 進捗表示
  - 詳細エラーメッセージ
  - ローディング表示

## 🚀 ローカル実行

### 前提条件
- Node.js 18以上
- モダンブラウザ（Chrome、Firefox、Safari、Edge）

### インストール
```bash
# 依存関係をインストール
npm install

# サーバーを起動
npm start
```

### アクセス
ブラウザで `http://localhost:3000` にアクセス

## 📋 使用方法

### 1. アカウント登録
1. ユーザー名と表示名を入力
2. 「登録」ボタンをクリック
3. 認証器（指紋、顔認証、セキュリティキー）を選択
4. 認証を完了

### 2. 認証
1. ユーザー名を入力（オプション）
2. 「認証」ボタンをクリック
3. 登録済みの認証器で認証

### 3. パスキー機能
- **条件付きUI**: ユーザー名入力欄にフォーカスすると登録済みパスキーが表示
- **ユーザー名なし認証**: ユーザー名を空欄にして認証すると、登録済みアカウントから選択可能

## 🛠️ 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **WebAuthn**: @simplewebauthn/browser
- **UI**: Bootstrap 5, Font Awesome
- **バックエンド**: Node.js, Express
- **WebAuthn**: @simplewebauthn/server

## 🔧 開発

### プロジェクト構造
```
fido2-webauthn-demo/
├── public/           # 静的ファイル
│   ├── index.html   # メインHTML
│   └── script.js    # フロントエンドJS
├── server.js         # Expressサーバー
├── package.json      # 依存関係
└── README.md        # ドキュメント
```

### 主要な機能

#### サーバー側（server.js）
- WebAuthn登録・認証API
- チャレンジ管理
- 認証情報保存
- エラーハンドリング

#### クライアント側（script.js）
- WebAuthn API呼び出し
- UI操作
- エラー表示
- テーマ切り替え

## 🔒 セキュリティ

### 実装済み
- ✅ HTTPS必須（本番環境）
- ✅ チャレンジ検証
- ✅ 認証情報検証
- ✅ エラーハンドリング

### 注意事項
- このデモは学習・検証用途です
- 本番運用には追加のセキュリティ対策が必要です
- 認証情報はメモリに保存（再起動で消去）

## 📚 参考資料

- [FIDO2 公式仕様](https://fidoalliance.org/specs/fido-v2.0-ps-20190130/fido-client-to-authenticator-protocol-v2.0-ps-20190130.html)
- [WebAuthn W3C 勧告](https://www.w3.org/TR/webauthn/)
- [@simplewebauthn ドキュメント](https://simplewebauthn.dev/)

## 🤝 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 🙏 謝辞

- [@simplewebauthn](https://github.com/MasterKale/SimpleWebAuthn) チーム
- FIDO Alliance
- WebAuthn コミュニティ

---

**⚠️ 注意**: このデモは学習・検証用途です。本番環境での使用には適切なセキュリティ対策を実装してください。 