# バーチャルオフィス - 音声通話対応

音声通話機能を備えたバーチャルオフィスアプリケーションです。ユーザーは2Dオフィス空間内を移動し、距離に基づく空間音声でリアルタイムコミュニケーションを取ることができます。

## 機能

- 🎤 **リアルタイム音声通話**: WebRTCを使用したP2P音声通信
- 🗺️ **2Dオフィス空間**: デスク、会議室、ラウンジなどのエリア
- 🔊 **空間音声**: 距離に基づく音量調整
- 👥 **ユーザー管理**: リアルタイムでの参加者表示
- 📱 **レスポンシブデザイン**: モバイル対応
- 🔧 **音声設定**: マイク感度、音量、通話範囲の調整
- 🎯 **デモモード**: Firebase接続なしでも動作

## ファイル構成

```
virtual-office/
├── index.html              # メインHTMLファイル
├── css/
│   └── styles.css          # スタイルシート
├── js/
│   ├── app.js              # メインアプリケーション
│   ├── audioManager.js     # 音声管理
│   ├── userManager.js      # ユーザー管理
│   ├── uiManager.js        # UI管理
│   └── realtimeManager.js  # リアルタイム通信管理
├── config/
│   └── firebase.js         # Firebase設定
└── README.md               # このファイル
```

## セットアップ

### 1. 依存関係

- モダンブラウザ（Chrome、Firefox、Safari、Edge）
- マイクアクセス許可
- Firebaseプロジェクト（オプション）

### 2. ローカル開発

1. リポジトリをクローン
```bash
git clone <repository-url>
cd virtual-office
```

2. ローカルサーバーを起動
```bash
# Python 3の場合
python -m http.server 8000

# Node.jsの場合
npx http-server

# PHPの場合
php -S localhost:8000
```

3. ブラウザでアクセス
```
http://localhost:8000
```

### 3. Firebase設定（オプション）

リアルタイム音声通話を使用する場合：

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. Realtime Databaseを有効化
3. `config/firebase.js`の設定を更新

```javascript
export const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

## 使用方法

### 基本操作

1. **参加**: 名前を入力して「オフィスに参加」をクリック
2. **移動**: オフィス空間内をクリックして移動
3. **ズーム**: マウスホイールまたはズームボタン
4. **パン**: ドラッグでオフィス空間を移動

### 音声機能

- **マイクON/OFF**: トップバーのマイクボタン
- **ステータス変更**: 在席、離席、ミーティング中、集中中
- **音声設定**: 音量ボタンで設定パネルを開く

### 音声設定

- **マイク感度**: 音声検出の感度調整
- **マスターボリューム**: 全体的な音量調整
- **通話範囲**: 音声が届く距離の設定

## 技術仕様

### フロントエンド
- **HTML5**: セマンティックマークアップ
- **CSS3**: Flexbox、Grid、アニメーション
- **JavaScript ES6+**: モジュール、クラス、非同期処理

### 音声処理
- **Web Audio API**: 音声分析、レベル監視
- **WebRTC**: P2P音声通信
- **MediaDevices API**: マイクアクセス

### リアルタイム通信
- **Firebase Realtime Database**: ユーザー状態同期
- **WebRTC Signaling**: Firebase経由のシグナリング

### アーキテクチャ
- **モジュラー設計**: 機能別に分離されたクラス
- **イベント駆動**: コールバックベースの通信
- **状態管理**: 各マネージャーが独立した状態を管理

## 開発

### コード構造

```javascript
// メインアプリケーション
class VirtualOfficeApp {
    constructor() {
        this.audioManager = new AudioManager();
        this.userManager = new UserManager();
        this.uiManager = new UIManager();
        this.realtimeManager = new RealtimeManager();
    }
}
```

### 拡張ポイント

- **新しい音声エフェクト**: `AudioManager`クラスを拡張
- **追加のUI要素**: `UIManager`クラスにメソッド追加
- **カスタム通信**: `RealtimeManager`クラスを拡張

## トラブルシューティング

### よくある問題

1. **マイクが動作しない**
   - ブラウザのマイク許可を確認
   - HTTPS環境で実行（ローカル開発を除く）

2. **音声通話が接続されない**
   - Firebase設定を確認
   - ネットワーク接続を確認

3. **パフォーマンスが悪い**
   - 音声設定を調整
   - ブラウザを最新版に更新

### デバッグ

ブラウザの開発者ツールで以下を確認：

```javascript
// 音声レベル
console.log('Audio Level:', audioManager.getAudioLevel());

// ユーザー状態
console.log('Users:', userManager.getAllUsers());

// 接続状態
console.log('Firebase Enabled:', realtimeManager.isFirebaseEnabled());
```

## ライセンス

MIT License

## 貢献

1. フォークを作成
2. フィーチャーブランチを作成
3. 変更をコミット
4. プルリクエストを作成

## 更新履歴

- **v1.0.0**: 初期リリース
  - 基本的な音声通話機能
  - 2Dオフィス空間
  - リアルタイムユーザー同期 