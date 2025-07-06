// パスとURL処理ユーティリティ

// データURIパターン
export const Bl = /^\s*data:(?:([\w-]+)\/([\w+.-]+))?(?:;charset=([\w-]+))?(?:;(base64))?,(.*)/i;

// データURI解析
export function HC(i) {
    const e = Bl.exec(i);
    if (e) {
        return {
            mediaType: e[1] ? e[1].toLowerCase() : void 0,
            subType: e[2] ? e[2].toLowerCase() : void 0,
            charset: e[3] ? e[3].toLowerCase() : void 0,
            encoding: e[4] ? e[4].toLowerCase() : void 0,
            data: e[5]
        };
    }
}

// CORS判定
export function pl(i, e = globalThis.location) {
    if (i.startsWith("data:")) return "";
    e = e || globalThis.location;
    const t = new URL(i, document.baseURI);
    return t.hostname !== e.hostname || t.port !== e.port || t.protocol !== e.protocol ? "anonymous" : "";
}

// 解像度取得
export function vt(i, e = 1) {
    var A;
    const t = (A = N.RETINA_PREFIX) == null ? void 0 : A.exec(i);
    return t ? parseFloat(t[1]) : e;
}

// URLユーティリティオブジェクト
export const BC = (() => {
    const i = [];

    function e(t, A) {
        const s = A.split("/");
        let r = 0;
        for (let n = 0; n < s.length; n++) {
            const o = s[n];
            if (o === ".") continue;
            if (o === "..") {
                if (r > 0) r--;
            } else {
                if (r < i.length) i[r] = o;
                else i.push(o);
                r++;
            }
        }
        i.length = r;
        return i.join("/");
    }

    return {
        join: e,
        normalize: e,
        isAbsolute: t => t.startsWith("/") || t.includes("://"),
        resolve: (t, A) => {
            if (A.includes("://")) return A;
            if (A.startsWith("/")) return A;
            return e(t, A);
        },
        dirname: t => {
            const A = t.lastIndexOf("/");
            return A === -1 ? "." : t.substring(0, A);
        },
        basename: t => {
            const A = t.lastIndexOf("/");
            return A === -1 ? t : t.substring(A + 1);
        },
        extname: t => {
            const A = t.lastIndexOf(".");
            const s = t.lastIndexOf("/");
            return A > s ? t.substring(A) : "";
        }
    };
})();

// パス正規化関数
export function normalizePath(path) {
    if (!path) return "";

    // 複数のスラッシュを単一に
    path = path.replace(/\/+/g, "/");

    // 末尾のスラッシュを削除（ルート以外）
    if (path.length > 1 && path.endsWith("/")) {
        path = path.slice(0, -1);
    }

    return path;
}

// URLパラメータ処理
export function parseQueryString(query) {
    const params = {};
    if (!query) return params;

    // 先頭の?を削除
    if (query.startsWith("?")) {
        query = query.slice(1);
    }

    const pairs = query.split("&");
    for (const pair of pairs) {
        const [key, value] = pair.split("=");
        if (key) {
            params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : "";
        }
    }

    return params;
}

export function buildQueryString(params) {
    const pairs = [];
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
            pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }
    }
    return pairs.length > 0 ? "?" + pairs.join("&") : "";
}

// URLビルダー
export class URLBuilder {
    constructor(base = "") {
        this.protocol = "";
        this.hostname = "";
        this.port = "";
        this.pathname = "";
        this.search = "";
        this.hash = "";

        if (base) {
            this.parse(base);
        }
    }

    parse(url) {
        try {
            const parsed = new URL(url, globalThis.location?.href);
            this.protocol = parsed.protocol;
            this.hostname = parsed.hostname;
            this.port = parsed.port;
            this.pathname = parsed.pathname;
            this.search = parsed.search;
            this.hash = parsed.hash;
        } catch (e) {
            // フォールバック処理
            const match = url.match(/^(https?:\/\/)?([^\/\?#]+)?([^\?#]*)?(\?[^#]*)?(#.*)?$/);
            if (match) {
                this.protocol = match[1] || "";
                this.hostname = match[2] || "";
                this.pathname = match[3] || "";
                this.search = match[4] || "";
                this.hash = match[5] || "";
            }
        }
        return this;
    }

    setPath(path) {
        this.pathname = normalizePath(path);
        return this;
    }

    appendPath(path) {
        if (!path) return this;

        let currentPath = this.pathname || "/";
        if (!currentPath.endsWith("/")) {
            currentPath += "/";
        }

        this.pathname = normalizePath(currentPath + path);
        return this;
    }

    setQuery(params) {
        this.search = buildQueryString(params);
        return this;
    }

    addQuery(key, value) {
        const current = parseQueryString(this.search);
        current[key] = value;
        this.search = buildQueryString(current);
        return this;
    }

    setHash(hash) {
        this.hash = hash ? (hash.startsWith("#") ? hash : "#" + hash) : "";
        return this;
    }

    toString() {
        let url = "";

        if (this.protocol && this.hostname) {
            url += this.protocol + "//" + this.hostname;
            if (this.port) {
                url += ":" + this.port;
            }
        }

        url += this.pathname || "/";
        url += this.search || "";
        url += this.hash || "";

        return url;
    }
}

// ファイル拡張子ユーティリティ
export const FileUtils = {
    getExtension(filename) {
        const lastDot = filename.lastIndexOf(".");
        return lastDot === -1 ? "" : filename.substring(lastDot + 1).toLowerCase();
    },

    getBasename(filename) {
        const lastDot = filename.lastIndexOf(".");
        const lastSlash = filename.lastIndexOf("/");
        const start = lastSlash === -1 ? 0 : lastSlash + 1;
        const end = lastDot === -1 ? filename.length : lastDot;
        return filename.substring(start, end);
    },

    isImage(filename) {
        const ext = this.getExtension(filename);
        return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext);
    },

    isVideo(filename) {
        const ext = this.getExtension(filename);
        return ["mp4", "webm", "ogg", "avi", "mov", "wmv"].includes(ext);
    },

    isAudio(filename) {
        const ext = this.getExtension(filename);
        return ["mp3", "wav", "ogg", "aac", "flac", "m4a"].includes(ext);
    },

    getContentType(filename) {
        const ext = this.getExtension(filename);
        const types = {
            // Images
            jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
            gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
            bmp: "image/bmp", ico: "image/x-icon",

            // Videos
            mp4: "video/mp4", webm: "video/webm", ogg: "video/ogg",
            avi: "video/x-msvideo", mov: "video/quicktime",

            // Audio
            mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
            aac: "audio/aac", flac: "audio/flac",

            // Documents
            pdf: "application/pdf", doc: "application/msword",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            xls: "application/vnd.ms-excel",
            xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

            // Web
            html: "text/html", css: "text/css", js: "application/javascript",
            json: "application/json", xml: "application/xml",

            // Archives
            zip: "application/zip", rar: "application/x-rar-compressed",
            tar: "application/x-tar", gz: "application/gzip"
        };

        return types[ext] || "application/octet-stream";
    }
};

// パスマッチング
export class PathMatcher {
    constructor(pattern) {
        this.pattern = pattern;
        this.regex = this.compile(pattern);
    }

    compile(pattern) {
        // ワイルドカードパターンを正規表現に変換
        let regex = pattern
            .replace(/[.+^${}()|[\]\\]/g, "\\$&") // 特殊文字をエスケープ
            .replace(/\*/g, ".*") // * を .* に変換
            .replace(/\?/g, "."); // ? を . に変換

        return new RegExp(`^${regex}$`);
    }

    test(path) {
        return this.regex.test(path);
    }

    static match(pattern, path) {
        return new PathMatcher(pattern).test(path);
    }
}

// リソースローダー用のパス解決
export class ResourcePath {
    static resolve(base, relative) {
        if (!relative) return base;
        if (relative.includes("://")) return relative;
        if (relative.startsWith("/")) return relative;
        if (relative.startsWith("data:")) return relative;

        const basePath = base.replace(/\/[^\/]*$/, "/");
        return BC.normalize(basePath + relative);
    }

    static isAbsolute(path) {
        return path.includes("://") || path.startsWith("/") || path.startsWith("data:");
    }

    static makeAbsolute(path, base = globalThis.location?.href) {
        if (this.isAbsolute(path)) return path;
        if (!base) return path;

        try {
            return new URL(path, base).href;
        } catch {
            return path;
        }
    }
}

export const Ue = BC;
export default Ue;
