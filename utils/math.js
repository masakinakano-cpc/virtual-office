// UUID生成機能
let As;
const DI = new Uint8Array(16);

function vI() {
    if (!As && (As = typeof crypto < "u" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto), !As))
        throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    return As(DI)
}

const Ne = [];
for (let i = 0; i < 256; ++i)
    Ne.push((i + 256).toString(16).slice(1));

function xI(i, e = 0) {
    return Ne[i[e + 0]] + Ne[i[e + 1]] + Ne[i[e + 2]] + Ne[i[e + 3]] + "-" + Ne[i[e + 4]] + Ne[i[e + 5]] + "-" + Ne[i[e + 6]] + Ne[i[e + 7]] + "-" + Ne[i[e + 8]] + Ne[i[e + 9]] + "-" + Ne[i[e + 10]] + Ne[i[e + 11]] + Ne[i[e + 12]] + Ne[i[e + 13]] + Ne[i[e + 14]] + Ne[i[e + 15]]
}

const bI = typeof crypto < "u" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
const Ea = {
    randomUUID: bI
};

export function Pg(i, e, t) {
    if (Ea.randomUUID && !i)
        return Ea.randomUUID();
    i = i || {};
    const A = i.random || (i.rng || vI)();
    return A[6] = A[6] & 15 | 64,
        A[8] = A[8] & 63 | 128,
        xI(A)
}

// 数学的計算関数
export const SI = ({ x: i, y: e }) => Math.sqrt(i * i + e * e);
export const RI = (i, e) => ({
    x: i.x - e.x,
    y: i.y - e.y
});
export const Og = (i, e) => SI(RI(i, e));

export const MI = ({ x: i, y: e }) => {
    if (!i && !e)
        return;
    let t = Math.atan2(i, -e);
    for (; t < -Math.PI;)
        t += Math.PI * 2;
    for (; t > Math.PI;)
        t -= Math.PI * 2;
    return t
};

// 数学定数
export const Xs = Math.PI * 2;
export const eB = 180 / Math.PI;
export const tB = Math.PI / 180;

// ユーティリティ関数
export function Pi(i) {
    return i += i === 0 ? 1 : 0,
        --i,
        i |= i >>> 1,
        i |= i >>> 2,
        i |= i >>> 4,
        i |= i >>> 8,
        i |= i >>> 16,
        i + 1
}

export function zn(i) {
    return !(i & i - 1) && !!i
}

export function Xn(i) {
    let e = (i > 65535 ? 1 : 0) << 4;
    i >>>= e;
    let t = (i > 255 ? 1 : 0) << 3;
    return i >>>= t,
        e |= t,
        t = (i > 15 ? 1 : 0) << 2,
        i >>>= t,
        e |= t,
        t = (i > 3 ? 1 : 0) << 1,
        i >>>= t,
        e |= t,
        e | i >> 1
}

export function Ft(i) {
    return i === 0 ? 0 : i < 0 ? -1 : 1
}

let PC = 0;
export function Vt() {
    return ++PC
}

// 配列操作
export function CA(i, e, t) {
    const A = i.length;
    let s;
    if (e >= A || t === 0)
        return;
    t = e + t > A ? A - e : t;
    const r = A - t;
    for (s = e; s < r; ++s)
        i[s] = i[s + t];
    i.length = r
}

// 数値処理
export function vt(i, e = 1) {
    var A;
    const t = (A = N.RETINA_PREFIX) == null ? void 0 : A.exec(i);
    return t ? parseFloat(t[1]) : e
}
