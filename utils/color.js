// カラー処理システム

// 数学的ヘルパー関数
const Te = (i, e, t) => {
    e === void 0 && (e = 0);
    t === void 0 && (t = Math.pow(10, e));
    return Math.round(t * i) / t + 0;
};

const tt = (i, e, t) => {
    e === void 0 && (e = 0);
    t === void 0 && (t = 1);
    return i > t ? t : i > e ? i : e;
};

const cl = (i) => {
    i = isFinite(i) ? i % 360 : 0;
    return i > 0 ? i : i + 360;
};

const Rt = (i) => typeof i == "string" ? i.length > 0 : typeof i == "number";

// カラー変換関数
const th = (i) => ({
    r: tt(i.r, 0, 255),
    g: tt(i.g, 0, 255),
    b: tt(i.b, 0, 255),
    a: tt(i.a)
});

const Zr = (i) => ({
    r: Te(i.r),
    g: Te(i.g),
    b: Te(i.b),
    a: Te(i.a, 3)
});

const hs = (i) => {
    const e = i.toString(16);
    return e.length < 2 ? "0" + e : e;
};

// RGB to HSV
const Il = (i) => {
    const e = i.r;
    const t = i.g;
    const A = i.b;
    const s = i.a;
    const r = Math.max(e, t, A);
    const n = r - Math.min(e, t, A);
    const o = n ? r === e ? (t - A) / n : r === t ? 2 + (A - e) / n : 4 + (e - t) / n : 0;
    return {
        h: 60 * (o < 0 ? o + 6 : o),
        s: r ? n / r * 100 : 0,
        v: r / 255 * 100,
        a: s
    };
};

// HSV to RGB
const ul = (i) => {
    const e = i.h;
    const t = i.s;
    const A = i.v;
    const s = i.a;
    const hue = e / 360 * 6;
    const saturation = t / 100;
    const value = A / 100;
    const c = Math.floor(hue);
    const f = value * (1 - saturation);
    const p = value * (1 - (hue - c) * saturation);
    const q = value * (1 - (1 - hue + c) * saturation);
    const mod = c % 6;
    return {
        r: 255 * [value, p, f, f, q, value][mod],
        g: 255 * [q, value, value, p, f, f][mod],
        b: 255 * [f, f, q, value, value, p][mod],
        a: s
    };
};

// HSL正規化
const Ah = (i) => ({
    h: cl(i.h),
    s: tt(i.s, 0, 100),
    l: tt(i.l, 0, 100),
    a: tt(i.a)
});

const ih = (i) => ({
    h: Te(i.h),
    s: Te(i.s),
    l: Te(i.l),
    a: Te(i.a, 3)
});

// HSL to RGB
const sh = (i) => {
    const t = i.s;
    const A = i.l;
    return ul({
        h: i.h,
        s: (t *= ((A < 50 ? A : 100 - A) / 100)) > 0 ? 2 * t / (A + t) * 100 : 0,
        v: A + t,
        a: i.a
    });
};

// RGB to HSL
const Fi = (i) => {
    const e = Il(i);
    const t = e.s;
    const A = e.v;
    const s = (200 - t) * A / 100;
    return {
        h: e.h,
        s: s > 0 && s < 200 ? t * A / 100 / (s <= 100 ? s : 200 - s) * 100 : 0,
        l: s / 2,
        a: e.a
    };
};

// 正規表現パターン
const wC = /^#([0-9a-f]{3,8})$/i;
const _C = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s*,\s*([+-]?\d*\.?\d+)%\s*,\s*([+-]?\d*\.?\d+)%\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i;
const DC = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s+([+-]?\d*\.?\d+)%\s+([+-]?\d*\.?\d+)%\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i;
const vC = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i;
const xC = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i;

// 角度変換
const mC = {
    grad: .9,
    turn: 360,
    rad: 360 / (2 * Math.PI)
};

// カラーパーサー
const Vn = {
    string: [
        [function (i) {
            const e = wC.exec(i);
            if (e) {
                const color = e[1];
                if (color.length <= 4) {
                    return {
                        r: parseInt(color[0] + color[0], 16),
                        g: parseInt(color[1] + color[1], 16),
                        b: parseInt(color[2] + color[2], 16),
                        a: color.length === 4 ? Te(parseInt(color[3] + color[3], 16) / 255, 2) : 1
                    };
                } else if (color.length === 6 || color.length === 8) {
                    return {
                        r: parseInt(color.substr(0, 2), 16),
                        g: parseInt(color.substr(2, 2), 16),
                        b: parseInt(color.substr(4, 2), 16),
                        a: color.length === 8 ? Te(parseInt(color.substr(6, 2), 16) / 255, 2) : 1
                    };
                }
            }
            return null;
        }, "hex"],
        [function (i) {
            const e = vC.exec(i) || xC.exec(i);
            if (e) {
                if (e[2] !== e[4] || e[4] !== e[6]) return null;
                return th({
                    r: Number(e[1]) / (e[2] ? 100 / 255 : 1),
                    g: Number(e[3]) / (e[4] ? 100 / 255 : 1),
                    b: Number(e[5]) / (e[6] ? 100 / 255 : 1),
                    a: e[7] === void 0 ? 1 : Number(e[7]) / (e[8] ? 100 : 1)
                });
            }
            return null;
        }, "rgb"],
        [function (i) {
            const e = _C.exec(i) || DC.exec(i);
            if (!e) return null;
            const t = e[1];
            const A = e[2];
            const s = Ah({
                h: Number(t) * (mC[A] || 1),
                s: Number(e[3]),
                l: Number(e[4]),
                a: e[5] === void 0 ? 1 : Number(e[5]) / (e[6] ? 100 : 1)
            });
            return sh(s);
        }, "hsl"]
    ],
    object: [
        [function (i) {
            const e = i.r;
            const t = i.g;
            const A = i.b;
            const s = i.a;
            const r = s === void 0 ? 1 : s;
            if (Rt(e) && Rt(t) && Rt(A)) {
                return th({
                    r: Number(e),
                    g: Number(t),
                    b: Number(A),
                    a: Number(r)
                });
            }
            return null;
        }, "rgb"],
        [function (i) {
            const e = i.h;
            const t = i.s;
            const A = i.l;
            const s = i.a;
            const r = s === void 0 ? 1 : s;
            if (!Rt(e) || !Rt(t) || !Rt(A)) return null;
            const n = Ah({
                h: Number(e),
                s: Number(t),
                l: Number(A),
                a: Number(r)
            });
            return sh(n);
        }, "hsl"],
        [function (i) {
            const e = i.h;
            const t = i.s;
            const A = i.v;
            const s = i.a;
            const r = s === void 0 ? 1 : s;
            if (!Rt(e) || !Rt(t) || !Rt(A)) return null;
            const n = {
                h: cl(Number(e)),
                s: tt(Number(t), 0, 100),
                v: tt(Number(A), 0, 100),
                a: tt(Number(r))
            };
            return ul(n);
        }, "hsv"]
    ]
};

// カラーパース関数
const rh = (i, e) => {
    for (let t = 0; t < e.length; t++) {
        const A = e[t][0](i);
        if (A) return [A, e[t][1]];
    }
    return [null, void 0];
};

const bC = (i) => {
    if (typeof i == "string") {
        return rh(i.trim(), Vn.string);
    } else if (typeof i == "object" && i !== null) {
        return rh(i, Vn.object);
    }
    return [null, void 0];
};

// カラー操作関数
const $r = (i, e) => {
    const t = Fi(i);
    return {
        h: t.h,
        s: tt(t.s + 100 * e, 0, 100),
        l: t.l,
        a: t.a
    };
};

const en = (i) => (299 * i.r + 587 * i.g + 114 * i.b) / 1e3 / 255;

const nh = (i, e) => {
    const t = Fi(i);
    return {
        h: t.h,
        s: t.s,
        l: tt(t.l + 100 * e, 0, 100),
        a: t.a
    };
};

// メインカラークラス
export class Wn {
    constructor(e) {
        this.parsed = bC(e)[0];
        this.rgba = this.parsed || { r: 0, g: 0, b: 0, a: 1 };
    }

    isValid() {
        return this.parsed !== null;
    }

    brightness() {
        return Te(en(this.rgba), 2);
    }

    isDark() {
        return en(this.rgba) < .5;
    }

    isLight() {
        return en(this.rgba) >= .5;
    }

    toHex() {
        const e = Zr(this.rgba);
        const t = e.r;
        const A = e.g;
        const s = e.b;
        const r = e.a;
        const n = r < 1 ? hs(Te(255 * r)) : "";
        return "#" + hs(t) + hs(A) + hs(s) + n;
    }

    toRgb() {
        return Zr(this.rgba);
    }

    toRgbString() {
        const e = Zr(this.rgba);
        const t = e.r;
        const A = e.g;
        const s = e.b;
        const r = e.a;
        return r < 1 ? `rgba(${t}, ${A}, ${s}, ${r})` : `rgb(${t}, ${A}, ${s})`;
    }

    toHsl() {
        return ih(Fi(this.rgba));
    }

    toHslString() {
        const e = ih(Fi(this.rgba));
        const t = e.h;
        const A = e.s;
        const s = e.l;
        const r = e.a;
        return r < 1 ? `hsla(${t}, ${A}%, ${s}%, ${r})` : `hsl(${t}, ${A}%, ${s}%)`;
    }

    toHsv() {
        const e = Il(this.rgba);
        return {
            h: Te(e.h),
            s: Te(e.s),
            v: Te(e.v),
            a: Te(e.a, 3)
        };
    }

    invert() {
        const e = this.rgba;
        return Ct({
            r: 255 - e.r,
            g: 255 - e.g,
            b: 255 - e.b,
            a: e.a
        });
    }

    saturate(e = .1) {
        return Ct($r(this.rgba, e));
    }

    desaturate(e = .1) {
        return Ct($r(this.rgba, -e));
    }

    grayscale() {
        return Ct($r(this.rgba, -1));
    }

    lighten(e = .1) {
        return Ct(nh(this.rgba, e));
    }

    darken(e = .1) {
        return Ct(nh(this.rgba, -e));
    }

    rotate(e = 15) {
        return this.hue(this.hue() + e);
    }

    alpha(e) {
        if (typeof e == "number") {
            const t = this.rgba;
            return Ct({
                r: t.r,
                g: t.g,
                b: t.b,
                a: e
            });
        }
        return Te(this.rgba.a, 3);
    }

    hue(e) {
        const t = Fi(this.rgba);
        if (typeof e == "number") {
            return Ct({
                h: e,
                s: t.s,
                l: t.l,
                a: t.a
            });
        }
        return Te(t.h);
    }

    isEqual(e) {
        return this.toHex() === Ct(e).toHex();
    }
}

export const Ct = (i) => i instanceof Wn ? i : new Wn(i);

// カラーネーム拡張
const oh = [];
const SC = (i) => {
    i.forEach(function (e) {
        if (oh.indexOf(e) < 0) {
            e(Wn, Vn);
            oh.push(e);
        }
    });
};

// 名前付きカラー
function RC(i, e) {
    const t = {
        white: "#ffffff", bisque: "#ffe4c4", blue: "#0000ff", cadetblue: "#5f9ea0",
        chartreuse: "#7fff00", chocolate: "#d2691e", coral: "#ff7f50", antiquewhite: "#faebd7",
        aqua: "#00ffff", azure: "#f0ffff", whitesmoke: "#f5f5f5", papayawhip: "#ffefd5",
        plum: "#dda0dd", blanchedalmond: "#ffebcd", black: "#000000", gold: "#ffd700",
        goldenrod: "#daa520", gainsboro: "#dcdcdc", cornsilk: "#fff8dc", cornflowerblue: "#6495ed",
        burlywood: "#deb887", aquamarine: "#7fffd4", beige: "#f5f5dc", crimson: "#dc143c",
        cyan: "#00ffff", darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b",
        darkkhaki: "#bdb76b", darkgray: "#a9a9a9", darkgreen: "#006400", darkgrey: "#a9a9a9",
        peachpuff: "#ffdab9", darkmagenta: "#8b008b", darkred: "#8b0000", darkorchid: "#9932cc",
        darkorange: "#ff8c00", darkslateblue: "#483d8b", gray: "#808080", darkslategray: "#2f4f4f",
        darkslategrey: "#2f4f4f", deeppink: "#ff1493", deepskyblue: "#00bfff", wheat: "#f5deb3",
        firebrick: "#b22222", floralwhite: "#fffaf0", ghostwhite: "#f8f8ff", darkviolet: "#9400d3",
        magenta: "#ff00ff", green: "#008000", dodgerblue: "#1e90ff", grey: "#808080",
        honeydew: "#f0fff0", hotpink: "#ff69b4", blueviolet: "#8a2be2", forestgreen: "#228b22",
        lawngreen: "#7cfc00", indianred: "#cd5c5c", indigo: "#4b0082", fuchsia: "#ff00ff",
        brown: "#a52a2a", maroon: "#800000", mediumblue: "#0000cd", lightcoral: "#f08080",
        darkturquoise: "#00ced1", lightcyan: "#e0ffff", ivory: "#fffff0", lightyellow: "#ffffe0",
        lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", linen: "#faf0e6", mediumaquamarine: "#66cdaa",
        lemonchiffon: "#fffacd", lime: "#00ff00", khaki: "#f0e68c", mediumseagreen: "#3cb371",
        limegreen: "#32cd32", mediumspringgreen: "#00fa9a", lightskyblue: "#87cefa", lightblue: "#add8e6",
        midnightblue: "#191970", lightpink: "#ffb6c1", mistyrose: "#ffe4e1", moccasin: "#ffe4b5",
        mintcream: "#f5fffa", lightslategray: "#778899", lightslategrey: "#778899", navajowhite: "#ffdead",
        navy: "#000080", mediumvioletred: "#c71585", powderblue: "#b0e0e6", palegoldenrod: "#eee8aa",
        oldlace: "#fdf5e6", paleturquoise: "#afeeee", mediumturquoise: "#48d1cc", mediumorchid: "#ba55d3",
        rebeccapurple: "#663399", lightsteelblue: "#b0c4de", mediumslateblue: "#7b68ee", thistle: "#d8bfd8",
        tan: "#d2b48c", orchid: "#da70d6", mediumpurple: "#9370db", purple: "#800080",
        pink: "#ffc0cb", skyblue: "#87ceeb", springgreen: "#00ff7f", palegreen: "#98fb98",
        red: "#ff0000", yellow: "#ffff00", slateblue: "#6a5acd", lavenderblush: "#fff0f5",
        peru: "#cd853f", palevioletred: "#db7093", violet: "#ee82ee", teal: "#008080",
        slategray: "#708090", slategrey: "#708090", aliceblue: "#f0f8ff", darkseagreen: "#8fbc8f",
        darkolivegreen: "#556b2f", greenyellow: "#adff2f", seagreen: "#2e8b57", seashell: "#fff5ee",
        tomato: "#ff6347", silver: "#c0c0c0", sienna: "#a0522d", lavender: "#e6e6fa",
        lightgreen: "#90ee90", orange: "#ffa500", orangered: "#ff4500", steelblue: "#4682b4",
        royalblue: "#4169e1", turquoise: "#40e0d0", yellowgreen: "#9acd32", salmon: "#fa8072",
        saddlebrown: "#8b4513", sandybrown: "#f4a460", rosybrown: "#bc8f8f", darksalmon: "#e9967a",
        lightgoldenrodyellow: "#fafad2", snow: "#fffafa", lightgrey: "#d3d3d3", lightgray: "#d3d3d3",
        dimgray: "#696969", dimgrey: "#696969", olivedrab: "#6b8e23", olive: "#808000"
    };

    const A = {};
    for (const s in t) A[t[s]] = s;

    const r = {};
    i.prototype.toName = function (n) {
        if (!(this.rgba.a || this.rgba.r || this.rgba.g || this.rgba.b)) return "transparent";

        const h = A[this.toHex()];
        if (h) return h;

        if (n != null && n.closest) {
            const g = this.toRgb();
            let l = Infinity;
            let c = "black";

            if (!r.length) {
                for (const I in t) r[I] = new i(t[I]).toRgb();
            }

            for (const u in t) {
                const d = Math.pow(g.r - r[u].r, 2) + Math.pow(g.g - r[u].g, 2) + Math.pow(g.b - r[u].b, 2);
                if (d < l) {
                    l = d;
                    c = u;
                }
            }
            return c;
        }
    };

    e.string.push([function (n) {
        const o = n.toLowerCase();
        const a = o === "transparent" ? "#0000" : t[o];
        return a ? new i(a).toRgb() : null;
    }, "name"]);
}

SC([RC]);

// 高性能カラークラス
export class SA {
    constructor(e = 16777215) {
        this._value = null;
        this._components = new Float32Array(4);
        this._components.fill(1);
        this._int = 16777215;
        this.value = e;
    }

    get red() { return this._components[0]; }
    get green() { return this._components[1]; }
    get blue() { return this._components[2]; }
    get alpha() { return this._components[3]; }

    setValue(e) {
        this.value = e;
        return this;
    }

    set value(e) {
        if (e instanceof SA) {
            this._value = this.cloneSource(e._value);
            this._int = e._int;
            this._components.set(e._components);
        } else {
            if (e === null) throw new Error("Cannot set Color#value to null");
            if (this._value === null || !this.isSourceEqual(this._value, e)) {
                this.normalize(e);
                this._value = this.cloneSource(e);
            }
        }
    }

    get value() { return this._value; }

    cloneSource(e) {
        if (typeof e == "string" || typeof e == "number" || e instanceof Number || e === null) return e;
        if (Array.isArray(e) || ArrayBuffer.isView(e)) return e.slice(0);
        if (typeof e == "object" && e !== null) return { ...e };
        return e;
    }

    isSourceEqual(e, t) {
        const A = typeof e;
        if (A !== typeof t) return false;
        if (A === "number" || A === "string" || e instanceof Number) return e === t;
        if (Array.isArray(e) && Array.isArray(t) || ArrayBuffer.isView(e) && ArrayBuffer.isView(t)) {
            if (e.length !== t.length) return false;
            return e.every((s, r) => s === t[r]);
        }
        if (e !== null && t !== null) {
            const s = Object.keys(e);
            const r = Object.keys(t);
            if (s.length !== r.length) return false;
            return s.every(n => e[n] === t[n]);
        }
        return e === t;
    }

    toRgba() {
        const [e, t, A, s] = this._components;
        return { r: e, g: t, b: A, a: s };
    }

    toRgb() {
        const [e, t, A] = this._components;
        return { r: e, g: t, b: A };
    }

    toRgbaString() {
        const [e, t, A] = this.toUint8RgbArray();
        return `rgba(${e},${t},${A},${this.alpha})`;
    }

    toUint8RgbArray(e) {
        const [t, A, s] = this._components;
        e = e ?? [];
        e[0] = Math.round(t * 255);
        e[1] = Math.round(A * 255);
        e[2] = Math.round(s * 255);
        return e;
    }

    toRgbArray(e) {
        e = e ?? [];
        const [t, A, s] = this._components;
        e[0] = t;
        e[1] = A;
        e[2] = s;
        return e;
    }

    toNumber() {
        return this._int;
    }

    toLittleEndianNumber() {
        const e = this._int;
        return (e >> 16) + (e & 65280) + ((e & 255) << 16);
    }

    multiply(e) {
        const [t, A, s, r] = SA.temp.setValue(e)._components;
        this._components[0] *= t;
        this._components[1] *= A;
        this._components[2] *= s;
        this._components[3] *= r;
        this.refreshInt();
        this._value = null;
        return this;
    }

    premultiply(e, t = true) {
        if (t) {
            this._components[0] *= e;
            this._components[1] *= e;
            this._components[2] *= e;
        }
        this._components[3] = e;
        this.refreshInt();
        this._value = null;
        return this;
    }

    toPremultiplied(e, t = true) {
        if (e === 1) return (255 << 24) + this._int;
        if (e === 0) return t ? 0 : this._int;

        let A = this._int >> 16 & 255;
        let s = this._int >> 8 & 255;
        let r = this._int & 255;

        if (t) {
            A = A * e + .5 | 0;
            s = s * e + .5 | 0;
            r = r * e + .5 | 0;
        }

        return (e * 255 << 24) + (A << 16) + (s << 8) + r;
    }

    toHex() {
        const e = this._int.toString(16);
        return `#${"000000".substring(0, 6 - e.length) + e}`;
    }

    toHexa() {
        const e = Math.round(this._components[3] * 255).toString(16);
        return this.toHex() + "00".substring(0, 2 - e.length) + e;
    }

    setAlpha(e) {
        this._components[3] = this._clamp(e);
        return this;
    }

    round(e) {
        const [t, A, s] = this._components;
        this._components[0] = Math.round(t * e) / e;
        this._components[1] = Math.round(A * e) / e;
        this._components[2] = Math.round(s * e) / e;
        this.refreshInt();
        this._value = null;
        return this;
    }

    toArray(e) {
        e = e ?? [];
        const [t, A, s, r] = this._components;
        e[0] = t;
        e[1] = A;
        e[2] = s;
        e[3] = r;
        return e;
    }

    normalize(e) {
        let t, A, s, r;

        if ((typeof e == "number" || e instanceof Number) && e >= 0 && e <= 16777215) {
            const n = e;
            t = (n >> 16 & 255) / 255;
            A = (n >> 8 & 255) / 255;
            s = (n & 255) / 255;
            r = 1;
        } else if ((Array.isArray(e) || e instanceof Float32Array) && e.length >= 3 && e.length <= 4) {
            e = this._clamp(e);
            [t, A, s, r = 1] = e;
        } else if ((e instanceof Uint8Array || e instanceof Uint8ClampedArray) && e.length >= 3 && e.length <= 4) {
            e = this._clamp(e, 0, 255);
            [t, A, s, r = 255] = e;
            t /= 255;
            A /= 255;
            s /= 255;
            r /= 255;
        } else if (typeof e == "string" || typeof e == "object") {
            if (typeof e == "string") {
                const o = SA.HEX_PATTERN.exec(e);
                if (o) e = `#${o[2]}`;
            }
            const n = Ct(e);
            if (n.isValid()) {
                ({ r: t, g: A, b: s, a: r } = n.rgba);
                t /= 255;
                A /= 255;
                s /= 255;
            }
        }

        if (t !== void 0) {
            this._components[0] = t;
            this._components[1] = A;
            this._components[2] = s;
            this._components[3] = r;
            this.refreshInt();
        } else {
            throw new Error(`Unable to convert color ${e}`);
        }
    }

    refreshInt() {
        this._clamp(this._components);
        const [e, t, A] = this._components;
        this._int = (e * 255 << 16) + (t * 255 << 8) + (A * 255 | 0);
    }

    _clamp(e, t = 0, A = 1) {
        if (typeof e == "number") {
            return Math.min(Math.max(e, t), A);
        } else {
            e.forEach((s, r) => {
                e[r] = Math.min(Math.max(s, t), A);
            });
            return e;
        }
    }
}

SA.shared = new SA();
SA.temp = new SA();
SA.HEX_PATTERN = /^(#|0x)?(([a-f0-9]{3}){1,2}([a-f0-9]{2})?)$/i;

export const W = SA;
export default W;
