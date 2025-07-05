# FIDO2 (WebAuthn) デモサイト / Demo Site

## 概要 / Overview

このリポジトリは、Node.js（Express）と @simplewebauthn/server を用いたFIDO2（WebAuthn）パスキー対応のデモサイトです。

This repository is a demo site for FIDO2 (WebAuthn) passkey authentication, built with Node.js (Express) and @simplewebauthn/server.

---

## 主な機能 / Features
- パスキー（Passkey）による登録・認証
- 複数認証器の管理（追加・削除・一覧表示）
- 条件付きUI（ユーザー名入力欄でパスキー候補をレコメンド）
- ユーザー名なし認証（Discoverable Credential対応）
- ダークモード切替
- レスポンシブデザイン

---

## セットアップ / Setup

### 1. 必要要件 / Requirements
- Node.js 18以降
- npm

### 2. インストール / Install
```sh
npm install
```

### 3. サーバー起動 / Start Server
```sh
node server.js
```

### 4. アクセス / Access
ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

---

## 使い方 / Usage
1. ユーザー名を入力して「登録」ボタンでパスキーを登録
2. 「認証」ボタンでパスキー認証（ユーザー名なしでもOK）
3. 登録済み認証器の一覧・削除・追加も可能

---

## ディレクトリ構成 / Directory Structure
```
├── public/           # フロントエンド（HTML, JS, CSS）
├── server.js         # サーバー本体
├── package.json      # 依存パッケージ
└── README.md         # このファイル
```

---

## ライセンス / License
MIT 