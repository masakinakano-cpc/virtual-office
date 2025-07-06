import { SI, RI, Og } from '../utils/math.js';

// 衝突判定関数
export function TI(i, e) {
    return i.x < e.x + e.width && e.x < i.x + i.width && i.y < e.y + e.height && e.y < i.y + i.height;
}

export function Yg(i, e) {
    return {
        x: i.x - e,
        y: i.y - e,
        width: i.width + e * 2,
        height: i.height + e * 2
    }
}

export function NI(i, e) {
    return i.x >= e.x && i.y >= e.y && i.x <= e.x + e.width && i.y <= e.y + e.height
}

export function FI(i, e) {
    return Og(i, e) < i.radius + e.radius
}

export function Jo(i, e) {
    return NI(i, Yg(e, i.radius))
}

export function GI(i, e) {
    return TI(i, e)
}

export function Hg(i, e) {
    if (!Jo(e, i.aabb))
        return false;
    let t, A = true;
    const s = i.points.length;
    for (let r = 0; r < s; r++) {
        const n = i.points[r];
        const o = i.points[r + 1 > s - 1 ? 0 : r + 1];
        const a = {
            x: e.x - n.x,
            y: e.y - n.y
        };
        const h = {
            x: o.x - n.x,
            y: o.y - n.y
        };
        const g = h.x * a.x + h.y * a.y;
        const l = h.x ** 2 + h.y ** 2;
        const c = g / l;
        const I = c < 0 ? n : c > 1 ? o : {
            x: n.x + h.x * c,
            y: n.y + h.y * c
        };
        if (Og(I, e) <= e.radius)
            return true;
        const u = h.x * a.y - h.y * a.x;
        if (t != null && (t > 0 && u <= 0 && (A = false),
            t < 0 && u >= 0 && (A = false)),
            t = u);
    }
    return A
}

export function kI(i, e) {
    switch (e.type) {
        case "rect":
            return Jo(i, e);
        case "circle":
            return FI(i, e);
        case "convex_polygon":
            return Hg(e, i)
    }
}

export function LI(i, e) {
    switch (e.type) {
        case "rect":
            return GI(i, e);
        case "circle":
            return Jo(e, i);
        case "convex_polygon":
            throw Error("Not implemented now")
    }
}

export function UI(i, e) {
    switch (e.type) {
        case "rect":
            throw Error("Not implemented");
        case "circle":
            return Hg(i, e);
        case "convex_polygon":
            throw Error("Not implemented now")
    }
}

export function Qa(i, e) {
    switch (i.type) {
        case "rect":
            return LI(i, e);
        case "circle":
            return kI(i, e);
        case "convex_polygon":
            return UI(i, e)
    }
}

// 幾何学的形状の種類
export var ge = (i => (i[i.POLY = 0] = "POLY",
    i[i.RECT = 1] = "RECT",
    i[i.CIRC = 2] = "CIRC",
    i[i.ELIP = 3] = "ELIP",
    i[i.RREC = 4] = "RREC",
    i))(ge || {});

// 点クラス
export class Point {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    clone() {
        return new Point(this.x, this.y);
    }

    copyFrom(point) {
        this.set(point.x, point.y);
        return this;
    }

    copyTo(point) {
        point.set(this.x, this.y);
        return point;
    }

    equals(point) {
        return point.x === this.x && point.y === this.y;
    }

    set(x = 0, y = x) {
        this.x = x;
        this.y = y;
        return this;
    }
}

// 矩形クラス
export class Rectangle {
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = Number(x);
        this.y = Number(y);
        this.width = Number(width);
        this.height = Number(height);
        this.type = ge.RECT;
    }

    get left() {
        return this.x;
    }

    get right() {
        return this.x + this.width;
    }

    get top() {
        return this.y;
    }

    get bottom() {
        return this.y + this.height;
    }

    static get EMPTY() {
        return new Rectangle(0, 0, 0, 0);
    }

    clone() {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }

    contains(x, y) {
        if (this.width <= 0 || this.height <= 0) return false;
        return x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height;
    }
}

// 円クラス
export class Circle {
    constructor(x = 0, y = 0, radius = 0) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.type = ge.CIRC;
    }

    clone() {
        return new Circle(this.x, this.y, this.radius);
    }

    contains(x, y) {
        if (this.radius <= 0) return false;
        const radiusSquared = this.radius * this.radius;
        let dx = this.x - x;
        let dy = this.y - y;
        dx *= dx;
        dy *= dy;
        return dx + dy <= radiusSquared;
    }

    getBounds() {
        return new Rectangle(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    }
}

// 楕円クラス
export class Ellipse {
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = ge.ELIP;
    }

    clone() {
        return new Ellipse(this.x, this.y, this.width, this.height);
    }

    contains(x, y) {
        if (this.width <= 0 || this.height <= 0) return false;
        let normx = (x - this.x) / this.width;
        let normy = (y - this.y) / this.height;
        normx *= normx;
        normy *= normy;
        return normx + normy <= 1;
    }

    getBounds() {
        return new Rectangle(this.x - this.width, this.y - this.height, this.width, this.height);
    }
}

// 多角形クラス
export class Polygon {
    constructor(...points) {
        let flat = Array.isArray(points[0]) ? points[0] : points;
        if (typeof flat[0] !== "number") {
            const p = [];
            for (let i = 0, il = flat.length; i < il; i++) {
                p.push(flat[i].x, flat[i].y);
            }
            flat = p;
        }
        this.points = flat;
        this.type = ge.POLY;
        this.closeStroke = true;
    }

    clone() {
        const points = this.points.slice();
        const polygon = new Polygon(points);
        polygon.closeStroke = this.closeStroke;
        return polygon;
    }

    contains(x, y) {
        let inside = false;
        const length = this.points.length / 2;
        for (let i = 0, j = length - 1; i < length; j = i++) {
            const xi = this.points[i * 2];
            const yi = this.points[i * 2 + 1];
            const xj = this.points[j * 2];
            const yj = this.points[j * 2 + 1];
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * ((y - yi) / (yj - yi)) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }
}

// 角丸矩形クラス
export class RoundedRectangle {
    constructor(x = 0, y = 0, width = 0, height = 0, radius = 20) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.radius = radius;
        this.type = ge.RREC;
    }

    clone() {
        return new RoundedRectangle(this.x, this.y, this.width, this.height, this.radius);
    }

    contains(x, y) {
        if (this.width <= 0 || this.height <= 0) return false;
        if (x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height) {
            const radius = Math.max(0, Math.min(this.radius, Math.min(this.width, this.height) / 2));
            if ((y >= this.y + radius && y <= this.y + this.height - radius) ||
                (x >= this.x + radius && x <= this.x + this.width - radius)) {
                return true;
            }
            let dx = x - (this.x + radius);
            let dy = y - (this.y + radius);
            const radiusSquared = radius * radius;
            if ((dx * dx + dy * dy <= radiusSquared) ||
                (dx = x - (this.x + this.width - radius), dx * dx + dy * dy <= radiusSquared) ||
                (dy = y - (this.y + this.height - radius), dx * dx + dy * dy <= radiusSquared) ||
                (dx = x - (this.x + radius), dx * dx + dy * dy <= radiusSquared)) {
                return true;
            }
        }
        return false;
    }
}
