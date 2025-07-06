// メインファイル - 分割されたモジュールを統合

// ユーティリティモジュール
import * as MathUtils from './utils/math.js';
import * as ColorUtils from './utils/color.js';
import * as PathUtils from './utils/path.js';

// 定数モジュール
import * as WebGLConstants from './constants/webgl.js';

// 幾何学モジュール
import * as CollisionUtils from './geometry/collision.js';
import * as TriangulationUtils from './geometry/triangulation.js';

// イベントモジュール
import * as EventUtils from './events/EventEmitter.js';

// 統合されたエクスポート
export {
    // 数学ユーティリティ
    MathUtils,

    // カラーユーティリティ
    ColorUtils,

    // パスユーティリティ
    PathUtils,

    // WebGL定数
    WebGLConstants,

    // 幾何学・衝突判定
    CollisionUtils,
    TriangulationUtils,

    // イベント処理
    EventUtils
};

// 主要クラスの直接エクスポート
export {
    // 数学関数
    Pg as generateUUID,
    SI as vectorLength,
    RI as vectorSubtract,
    Og as distance,
    MI as angle,
    Pi as nextPowerOfTwo,
    zn as isPowerOfTwo,
    Xn as log2,
    Ft as sign,
    Vt as uid,
    CA as removeItems
} from './utils/math.js';

export {
    // カラークラス
    Wn as Color,
    SA as FastColor,
    W as ColorClass,
    Ct as color
} from './utils/color.js';

export {
    // パス関数
    BC as path,
    Ue as pathUtils,
    HC as parseDataURI,
    pl as determineCrossOrigin,
    vt as getResolutionOfUrl,
    URLBuilder,
    FileUtils,
    PathMatcher,
    ResourcePath
} from './utils/path.js';

export {
    // WebGL定数
    x as BLEND_MODES,
    ot as DRAW_MODES,
    R as FORMATS,
    J as TYPES,
    $e as SCALE_MODES,
    mt as WRAP_MODES,
    Dt as MIPMAP_MODES,
    Ke as ALPHA_MODES,
    we as MSAA_QUALITY,
    wt as BUFFER_TYPE,
    N as settings
} from './constants/webgl.js';

export {
    // 幾何学クラス
    Point,
    Rectangle,
    Circle,
    Ellipse,
    Polygon,
    RoundedRectangle,
    ge as SHAPES
} from './geometry/collision.js';

export {
    // 三角形分割
    earcut
} from './geometry/triangulation.js';

export {
    // イベント処理
    EventEmitter,
    mA as EventEmitterLegacy,
    ht as Runner,
    ho as EventPool,
    EventType,
    addEventMixin,
    globalEventBus,
    EventDebugger
} from './events/EventEmitter.js';

// デフォルトエクスポート（メインライブラリオブジェクト）
const PixiCore = {
    // ユーティリティ
    utils: {
        ...MathUtils,
        ...ColorUtils,
        ...PathUtils
    },

    // 定数
    constants: {
        ...WebGLConstants
    },

    // 幾何学
    geometry: {
        ...CollisionUtils,
        ...TriangulationUtils
    },

    // イベント
    events: {
        ...EventUtils
    },

    // バージョン情報
    VERSION: '7.3.0',

    // 初期化関数
    init(options = {}) {
        // グローバル設定の初期化
        if (options.resolution) {
            WebGLConstants.N.RESOLUTION = options.resolution;
        }
        if (options.roundPixels !== undefined) {
            WebGLConstants.N.ROUND_PIXELS = options.roundPixels;
        }
        if (options.preferEnv !== undefined) {
            WebGLConstants.N.PREFER_ENV = options.preferEnv;
        }

        console.log(`PixiCore v${this.VERSION} initialized`);
        return this;
    },

    // ユーティリティ関数
    createUUID: MathUtils.Pg,
    createColor: ColorUtils.Ct,
    createEventEmitter: EventUtils.createEventEmitter,

    // 便利なヘルパー
    helpers: {
        // 距離計算
        distance: MathUtils.Og,

        // 角度計算
        angle: MathUtils.MI,

        // 衝突判定
        intersects: CollisionUtils.Qa,

        // 三角形分割
        triangulate: TriangulationUtils.earcut,

        // カラー操作
        parseColor: ColorUtils.Ct,

        // パス操作
        resolvePath: PathUtils.ResourcePath.resolve,

        // イベント作成
        createEmitter: EventUtils.createEventEmitter
    }
};

export default PixiCore;

// 後方互換性のためのグローバル変数設定（オプション）
if (typeof window !== 'undefined' && !window.PIXI_CORE) {
    window.PIXI_CORE = PixiCore;
}

// Node.js環境での対応
if (typeof global !== 'undefined' && !global.PIXI_CORE) {
    global.PIXI_CORE = PixiCore;
}
