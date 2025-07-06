# PixiJS Core Library - モジュール分割版

元の巨大なコードファイルを機能別に分割し、保守性と再利用性を向上させたPixiJSコアライブラリです。

## 📁 ディレクトリ構造

```
.
├── main.js                    # メインエントリーポイント
├── utils/                     # ユーティリティ関数
│   ├── math.js               # 数学計算・UUID生成
│   ├── color.js              # カラー処理・変換
│   └── path.js               # パス・URL処理
├── constants/                 # 定数定義
│   └── webgl.js              # WebGL関連定数
├── geometry/                  # 幾何学処理
│   ├── collision.js          # 衝突判定・図形クラス
│   └── triangulation.js      # 三角形分割（Earcut）
├── events/                    # イベント処理
│   └── EventEmitter.js       # イベントエミッター実装
└── README.md                 # このファイル
```

## 🚀 使用方法

### 基本的な使用

```javascript
// すべての機能をインポート
import PixiCore from './main.js';

// 初期化
PixiCore.init({
    resolution: 2,
    roundPixels: true
});

// ヘルパー関数を使用
const distance = PixiCore.helpers.distance({x: 0, y: 0}, {x: 3, y: 4}); // 5
const color = PixiCore.helpers.parseColor('#ff0000');
const uuid = PixiCore.createUUID();
```

### 個別モジュールのインポート

```javascript
// 特定の機能のみインポート
import { generateUUID, distance, angle } from './main.js';
import { Color, FastColor } from './main.js';
import { EventEmitter } from './main.js';

// 数学計算
const dist = distance({x: 0, y: 0}, {x: 3, y: 4});
const angleRad = angle({x: 1, y: 1});

// カラー操作
const color = new Color('#ff0000');
const darkerColor = color.darken(0.2);

// イベント処理
const emitter = new EventEmitter();
emitter.on('test', (data) => console.log(data));
emitter.emit('test', 'Hello World');
```

### モジュール別インポート

```javascript
// 数学ユーティリティのみ
import * as MathUtils from './utils/math.js';
const uuid = MathUtils.Pg();

// カラーユーティリティのみ
import { Color, FastColor } from './utils/color.js';
const red = new Color('#ff0000');

// 幾何学処理のみ
import { Point, Rectangle, Circle } from './geometry/collision.js';
const point = new Point(10, 20);
const rect = new Rectangle(0, 0, 100, 100);
```

## 📚 モジュール詳細

### 🧮 Math Utils (`utils/math.js`)

数学計算、UUID生成、幾何学的計算を提供します。

**主要な関数:**
- `Pg()` - UUID生成
- `SI({x, y})` - ベクトルの長さ計算
- `RI(point1, point2)` - ベクトル減算
- `Og(point1, point2)` - 2点間の距離
- `MI({x, y})` - 角度計算
- `Pi(n)` - 次の2の累乗数
- `zn(n)` - 2の累乗数判定

```javascript
import { generateUUID, distance, angle } from './main.js';

const id = generateUUID();
const dist = distance({x: 0, y: 0}, {x: 3, y: 4}); // 5
const rad = angle({x: 1, y: 1}); // π/4
```

### 🎨 Color Utils (`utils/color.js`)

カラー処理、変換、操作機能を提供します。

**主要なクラス:**
- `Color` - 高機能カラークラス
- `FastColor` - 高性能カラークラス

**主要なメソッド:**
- `toHex()` - 16進数形式に変換
- `toRgb()` - RGB形式に変換
- `lighten(amount)` - 明度を上げる
- `darken(amount)` - 明度を下げる
- `saturate(amount)` - 彩度を上げる

```javascript
import { Color } from './main.js';

const color = new Color('#ff0000');
const lighter = color.lighten(0.2);
const hex = color.toHex(); // "#ff0000"
const rgb = color.toRgb(); // {r: 255, g: 0, b: 0, a: 1}
```

### 🛣️ Path Utils (`utils/path.js`)

パス操作、URL処理、ファイル操作を提供します。

**主要なクラス:**
- `URLBuilder` - URL構築
- `PathMatcher` - パスマッチング
- `ResourcePath` - リソースパス解決

**主要な関数:**
- `parseDataURI(uri)` - データURI解析
- `determineCrossOrigin(url)` - CORS判定
- `getResolutionOfUrl(url)` - URL解像度取得

```javascript
import { URLBuilder, FileUtils } from './main.js';

const url = new URLBuilder('https://example.com')
    .appendPath('api/v1')
    .addQuery('page', 1)
    .toString(); // "https://example.com/api/v1?page=1"

const isImage = FileUtils.isImage('photo.jpg'); // true
```

### ⚙️ WebGL Constants (`constants/webgl.js`)

WebGL関連の定数を提供します。

**主要な定数:**
- `BLEND_MODES` - ブレンドモード
- `DRAW_MODES` - 描画モード
- `FORMATS` - テクスチャフォーマット
- `TYPES` - データ型
- `SCALE_MODES` - スケールモード

```javascript
import { BLEND_MODES, FORMATS } from './main.js';

console.log(BLEND_MODES.NORMAL); // 0
console.log(FORMATS.RGBA); // 6408
```

### 📐 Geometry (`geometry/collision.js`)

幾何学的図形と衝突判定を提供します。

**主要なクラス:**
- `Point` - 点
- `Rectangle` - 矩形
- `Circle` - 円
- `Ellipse` - 楕円
- `Polygon` - 多角形
- `RoundedRectangle` - 角丸矩形

```javascript
import { Point, Rectangle, Circle } from './main.js';

const point = new Point(10, 20);
const rect = new Rectangle(0, 0, 100, 100);
const circle = new Circle(50, 50, 25);

const contains = rect.contains(point.x, point.y); // true
```

### 🔺 Triangulation (`geometry/triangulation.js`)

三角形分割（Earcut）アルゴリズムを提供します。

```javascript
import { earcut } from './main.js';

const vertices = [0,0, 100,0, 100,100, 0,100]; // 矩形
const triangles = earcut(vertices); // [0,1,2, 0,2,3]
```

### 🎭 Events (`events/EventEmitter.js`)

イベント処理システムを提供します。

**主要なクラス:**
- `EventEmitter` - 標準的なイベントエミッター
- `Runner` - 高性能イベント発信器
- `EventPool` - イベントプール

```javascript
import { EventEmitter } from './main.js';

const emitter = new EventEmitter();

emitter.on('data', (value) => {
    console.log('Received:', value);
});

emitter.emit('data', 'Hello World'); // "Received: Hello World"
```

## 🔧 開発者向け情報

### モジュール追加

新しいモジュールを追加する場合：

1. 適切なディレクトリに新しいファイルを作成
2. `main.js`にインポートとエクスポートを追加
3. READMEを更新

### 依存関係

各モジュールは可能な限り独立して設計されていますが、一部のモジュール間には依存関係があります：

- `geometry/collision.js` → `utils/math.js`
- `utils/color.js` → 独立
- `utils/path.js` → 独立
- `events/EventEmitter.js` → 独立

### TypeScript対応

TypeScript定義ファイルを追加することで、型安全性を向上させることができます。

```typescript
// types/index.d.ts
export interface Point {
    x: number;
    y: number;
}

export interface Color {
    toHex(): string;
    toRgb(): {r: number, g: number, b: number, a: number};
    lighten(amount: number): Color;
    darken(amount: number): Color;
}
```

## 📈 パフォーマンス

### 最適化のポイント

1. **Tree Shaking**: 必要な関数のみインポートして、バンドルサイズを削減
2. **FastColor**: 高性能が必要な場面では`FastColor`クラスを使用
3. **Runner**: 大量のイベント処理には`Runner`クラスを使用
4. **メモリ管理**: イベントリスナーの適切な削除

### ベンチマーク

```javascript
// カラー処理のパフォーマンステスト
import { Color, FastColor } from './main.js';

console.time('Color');
for (let i = 0; i < 10000; i++) {
    const color = new Color('#ff0000');
    color.lighten(0.1);
}
console.timeEnd('Color');

console.time('FastColor');
for (let i = 0; i < 10000; i++) {
    const color = new FastColor(0xff0000);
    color.multiply(new FastColor(0xffffff));
}
console.timeEnd('FastColor');
```

## 🐛 トラブルシューティング

### よくある問題

1. **モジュールが見つからない**
   - パスが正しいか確認
   - ファイル拡張子（.js）が含まれているか確認

2. **循環依存エラー**
   - モジュール間の依存関係を確認
   - 必要に応じてインターフェースを分離

3. **パフォーマンス問題**
   - 不要なインポートを削除
   - 適切なクラス（FastColorなど）を使用

## 📄 ライセンス

このコードはPixiJSプロジェクトの一部として、MITライセンスの下で提供されています。

## 🤝 貢献

バグ報告や機能提案は、GitHubのIssueまでお願いします。プルリクエストも歓迎します。

---

**注意**: この分割版は元のPixiJSコードを基に作成されており、実際のPixiJSライブラリとは異なる場合があります。本番環境での使用前に十分なテストを行ってください。
