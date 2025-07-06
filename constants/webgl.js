// WebGL バージョン定数
export var yA = (i => (i[i.WEBGL_LEGACY = 0] = "WEBGL_LEGACY",
    i[i.WEBGL = 1] = "WEBGL",
    i[i.WEBGL2 = 2] = "WEBGL2",
    i))(yA || {});

export var Ko = (i => (i[i.UNKNOWN = 0] = "UNKNOWN",
    i[i.WEBGL = 1] = "WEBGL",
    i[i.CANVAS = 2] = "CANVAS",
    i))(Ko || {});

// フレームバッファ定数
export var Fn = (i => (i[i.COLOR = 16384] = "COLOR",
    i[i.DEPTH = 256] = "DEPTH",
    i[i.STENCIL = 1024] = "STENCIL",
    i))(Fn || {});

// ブレンドモード定数
export var x = (i => (i[i.NORMAL = 0] = "NORMAL",
    i[i.ADD = 1] = "ADD",
    i[i.MULTIPLY = 2] = "MULTIPLY",
    i[i.SCREEN = 3] = "SCREEN",
    i[i.OVERLAY = 4] = "OVERLAY",
    i[i.DARKEN = 5] = "DARKEN",
    i[i.LIGHTEN = 6] = "LIGHTEN",
    i[i.COLOR_DODGE = 7] = "COLOR_DODGE",
    i[i.COLOR_BURN = 8] = "COLOR_BURN",
    i[i.HARD_LIGHT = 9] = "HARD_LIGHT",
    i[i.SOFT_LIGHT = 10] = "SOFT_LIGHT",
    i[i.DIFFERENCE = 11] = "DIFFERENCE",
    i[i.EXCLUSION = 12] = "EXCLUSION",
    i[i.HUE = 13] = "HUE",
    i[i.SATURATION = 14] = "SATURATION",
    i[i.COLOR = 15] = "COLOR",
    i[i.LUMINOSITY = 16] = "LUMINOSITY",
    i[i.NORMAL_NPM = 17] = "NORMAL_NPM",
    i[i.ADD_NPM = 18] = "ADD_NPM",
    i[i.SCREEN_NPM = 19] = "SCREEN_NPM",
    i[i.NONE = 20] = "NONE",
    i[i.SRC_OVER = 0] = "SRC_OVER",
    i[i.SRC_IN = 21] = "SRC_IN",
    i[i.SRC_OUT = 22] = "SRC_OUT",
    i[i.SRC_ATOP = 23] = "SRC_ATOP",
    i[i.DST_OVER = 24] = "DST_OVER",
    i[i.DST_IN = 25] = "DST_IN",
    i[i.DST_OUT = 26] = "DST_OUT",
    i[i.DST_ATOP = 27] = "DST_ATOP",
    i[i.ERASE = 26] = "ERASE",
    i[i.SUBTRACT = 28] = "SUBTRACT",
    i[i.XOR = 29] = "XOR",
    i))(x || {});

// 描画プリミティブ定数
export var ot = (i => (i[i.POINTS = 0] = "POINTS",
    i[i.LINES = 1] = "LINES",
    i[i.LINE_LOOP = 2] = "LINE_LOOP",
    i[i.LINE_STRIP = 3] = "LINE_STRIP",
    i[i.TRIANGLES = 4] = "TRIANGLES",
    i[i.TRIANGLE_STRIP = 5] = "TRIANGLE_STRIP",
    i[i.TRIANGLE_FAN = 6] = "TRIANGLE_FAN",
    i))(ot || {});

// テクスチャフォーマット定数
export var R = (i => (i[i.RGBA = 6408] = "RGBA",
    i[i.RGB = 6407] = "RGB",
    i[i.RG = 33319] = "RG",
    i[i.RED = 6403] = "RED",
    i[i.RGBA_INTEGER = 36249] = "RGBA_INTEGER",
    i[i.RGB_INTEGER = 36248] = "RGB_INTEGER",
    i[i.RG_INTEGER = 33320] = "RG_INTEGER",
    i[i.RED_INTEGER = 36244] = "RED_INTEGER",
    i[i.ALPHA = 6406] = "ALPHA",
    i[i.LUMINANCE = 6409] = "LUMINANCE",
    i[i.LUMINANCE_ALPHA = 6410] = "LUMINANCE_ALPHA",
    i[i.DEPTH_COMPONENT = 6402] = "DEPTH_COMPONENT",
    i[i.DEPTH_STENCIL = 34041] = "DEPTH_STENCIL",
    i))(R || {});

// テクスチャターゲット定数
export var UA = (i => (i[i.TEXTURE_2D = 3553] = "TEXTURE_2D",
    i[i.TEXTURE_CUBE_MAP = 34067] = "TEXTURE_CUBE_MAP",
    i[i.TEXTURE_2D_ARRAY = 35866] = "TEXTURE_2D_ARRAY",
    i[i.TEXTURE_CUBE_MAP_POSITIVE_X = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X",
    i[i.TEXTURE_CUBE_MAP_NEGATIVE_X = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X",
    i[i.TEXTURE_CUBE_MAP_POSITIVE_Y = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y",
    i[i.TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y",
    i[i.TEXTURE_CUBE_MAP_POSITIVE_Z = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z",
    i[i.TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z",
    i))(UA || {});

// データ型定数
export var J = (i => (i[i.UNSIGNED_BYTE = 5121] = "UNSIGNED_BYTE",
    i[i.UNSIGNED_SHORT = 5123] = "UNSIGNED_SHORT",
    i[i.UNSIGNED_SHORT_5_6_5 = 33635] = "UNSIGNED_SHORT_5_6_5",
    i[i.UNSIGNED_SHORT_4_4_4_4 = 32819] = "UNSIGNED_SHORT_4_4_4_4",
    i[i.UNSIGNED_SHORT_5_5_5_1 = 32820] = "UNSIGNED_SHORT_5_5_5_1",
    i[i.UNSIGNED_INT = 5125] = "UNSIGNED_INT",
    i[i.UNSIGNED_INT_10F_11F_11F_REV = 35899] = "UNSIGNED_INT_10F_11F_11F_REV",
    i[i.UNSIGNED_INT_2_10_10_10_REV = 33640] = "UNSIGNED_INT_2_10_10_10_REV",
    i[i.UNSIGNED_INT_24_8 = 34042] = "UNSIGNED_INT_24_8",
    i[i.UNSIGNED_INT_5_9_9_9_REV = 35902] = "UNSIGNED_INT_5_9_9_9_REV",
    i[i.BYTE = 5120] = "BYTE",
    i[i.SHORT = 5122] = "SHORT",
    i[i.INT = 5124] = "INT",
    i[i.FLOAT = 5126] = "FLOAT",
    i[i.FLOAT_32_UNSIGNED_INT_24_8_REV = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV",
    i[i.HALF_FLOAT = 36193] = "HALF_FLOAT",
    i))(J || {});

// 精度定数
export var P = (i => (i[i.FLOAT = 0] = "FLOAT",
    i[i.INT = 1] = "INT",
    i[i.UINT = 2] = "UINT",
    i))(P || {});

// フィルタリング定数
export var $e = (i => (i[i.NEAREST = 0] = "NEAREST",
    i[i.LINEAR = 1] = "LINEAR",
    i))($e || {});

// ラップモード定数
export var mt = (i => (i[i.CLAMP = 33071] = "CLAMP",
    i[i.REPEAT = 10497] = "REPEAT",
    i[i.MIRRORED_REPEAT = 33648] = "MIRRORED_REPEAT",
    i))(mt || {});

// ミップマップ定数
export var Dt = (i => (i[i.OFF = 0] = "OFF",
    i[i.POW2 = 1] = "POW2",
    i[i.ON = 2] = "ON",
    i[i.ON_MANUAL = 3] = "ON_MANUAL",
    i))(Dt || {});

// アルファモード定数
export var Ke = (i => (i[i.NPM = 0] = "NPM",
    i[i.UNPACK = 1] = "UNPACK",
    i[i.PMA = 2] = "PMA",
    i[i.NO_PREMULTIPLIED_ALPHA = 0] = "NO_PREMULTIPLIED_ALPHA",
    i[i.PREMULTIPLY_ON_UPLOAD = 1] = "PREMULTIPLY_ON_UPLOAD",
    i[i.PREMULTIPLIED_ALPHA = 2] = "PREMULTIPLIED_ALPHA",
    i))(Ke || {});

// クリアモード定数
export var Qt = (i => (i[i.NO = 0] = "NO",
    i[i.YES = 1] = "YES",
    i[i.AUTO = 2] = "AUTO",
    i[i.BLEND = 0] = "BLEND",
    i[i.CLEAR = 1] = "CLEAR",
    i[i.BLIT = 2] = "BLIT",
    i))(Qt || {});

// 更新モード定数
export var qo = (i => (i[i.AUTO = 0] = "AUTO",
    i[i.MANUAL = 1] = "MANUAL",
    i))(qo || {});

// 精度レベル定数
export var et = (i => (i.LOW = "lowp",
    i.MEDIUM = "mediump",
    i.HIGH = "highp",
    i))(et || {});

// マスク定数
export var ve = (i => (i[i.NONE = 0] = "NONE",
    i[i.SCISSOR = 1] = "SCISSOR",
    i[i.STENCIL = 2] = "STENCIL",
    i[i.SPRITE = 3] = "SPRITE",
    i[i.COLOR = 4] = "COLOR",
    i))(ve || {});

// MSAA定数
export var we = (i => (i[i.NONE = 0] = "NONE",
    i[i.LOW = 2] = "LOW",
    i[i.MEDIUM = 4] = "MEDIUM",
    i[i.HIGH = 8] = "HIGH",
    i))(we || {});

// バッファ型定数
export var wt = (i => (i[i.ELEMENT_ARRAY_BUFFER = 34963] = "ELEMENT_ARRAY_BUFFER",
    i[i.ARRAY_BUFFER = 34962] = "ARRAY_BUFFER",
    i[i.UNIFORM_BUFFER = 35345] = "UNIFORM_BUFFER",
    i))(wt || {});

// デフォルト設定
export const N = {
    ADAPTER: null,
    RESOLUTION: 1,
    CREATE_IMAGE_BITMAP: false,
    ROUND_PIXELS: false,
    RETINA_PREFIX: /@([0-9\.]+)x/,
    FAIL_IF_MAJOR_PERFORMANCE_CAVEAT: false,
    PREFER_ENV: yA.WEBGL2,
    STRICT_TEXTURE_CACHE: false
};
