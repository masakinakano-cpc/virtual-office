// Graphics Module - ベクターグラフィックス描画システム
// 図形描画、パス操作、スタイル管理を提供

import { Point } from './display.js';
import { Texture } from './texture.js';
import { Matrix } from './display.js';
import { Color } from './display.js';
import { State } from './webgl.js';
import { BLEND_MODES } from './main-pixi.js';

// 図形タイプ定数
export const SHAPES = {
    POLY: 0,
    RECT: 1,
    CIRC: 2,
    ELIP: 3,
    RREC: 4
};

// ライン結合タイプ
export const LINE_JOIN = {
    MITER: "miter",
    BEVEL: "bevel",
    ROUND: "round"
};

// ライン端点タイプ
export const LINE_CAP = {
    BUTT: "butt",
    ROUND: "round",
    SQUARE: "square"
};

// 図形クラス群
export class Rectangle {
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = SHAPES.RECT;
    }

    clone() {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }

    contains(x, y) {
        return x >= this.x && x < this.x + this.width &&
            y >= this.y && y < this.y + this.height;
    }
}

export class Circle {
    constructor(x = 0, y = 0, radius = 0) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.type = SHAPES.CIRC;
    }

    clone() {
        return new Circle(this.x, this.y, this.radius);
    }

    contains(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return dx * dx + dy * dy <= this.radius * this.radius;
    }
}

export class Ellipse {
    constructor(x = 0, y = 0, halfWidth = 0, halfHeight = 0) {
        this.x = x;
        this.y = y;
        this.width = halfWidth;
        this.height = halfHeight;
        this.type = SHAPES.ELIP;
    }

    clone() {
        return new Ellipse(this.x, this.y, this.width, this.height);
    }

    contains(x, y) {
        const normx = ((x - this.x) / this.width);
        const normy = ((y - this.y) / this.height);
        return (normx * normx) + (normy * normy) <= 1;
    }
}

export class Polygon {
    constructor(...points) {
        let flat = Array.isArray(points[0]) ? points[0] : points;
        if (typeof flat[0] !== 'number') {
            const p = [];
            for (let i = 0; i < flat.length; i++) {
                p.push(flat[i].x, flat[i].y);
            }
            flat = p;
        }
        this.points = flat;
        this.type = SHAPES.POLY;
        this.closeStroke = true;
    }

    clone() {
        return new Polygon(this.points.slice());
    }

    contains(x, y) {
        let inside = false;
        const length = this.points.length / 2;

        for (let i = 0, j = length - 1; i < length; j = i++) {
            const xi = this.points[i * 2];
            const yi = this.points[i * 2 + 1];
            const xj = this.points[j * 2];
            const yj = this.points[j * 2 + 1];

            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }

        return inside;
    }
}

export class RoundedRectangle extends Rectangle {
    constructor(x = 0, y = 0, width = 0, height = 0, radius = 20) {
        super(x, y, width, height);
        this.radius = radius;
        this.type = SHAPES.RREC;
    }

    clone() {
        return new RoundedRectangle(this.x, this.y, this.width, this.height, this.radius);
    }
}

// スタイルクラス群
export class FillStyle {
    constructor() {
        this.color = 0xFFFFFF;
        this.alpha = 1;
        this.texture = Texture.WHITE;
        this.matrix = null;
        this.visible = false;
        this.reset();
    }

    clone() {
        const obj = new FillStyle();
        obj.color = this.color;
        obj.alpha = this.alpha;
        obj.texture = this.texture;
        obj.matrix = this.matrix;
        obj.visible = this.visible;
        return obj;
    }

    reset() {
        this.color = 0xFFFFFF;
        this.alpha = 1;
        this.texture = Texture.WHITE;
        this.matrix = null;
        this.visible = false;
    }

    destroy() {
        this.texture = null;
        this.matrix = null;
    }
}

export class LineStyle extends FillStyle {
    constructor() {
        super();
        this.width = 0;
        this.alignment = 0.5;
        this.native = false;
        this.cap = LINE_CAP.BUTT;
        this.join = LINE_JOIN.MITER;
        this.miterLimit = 10;
    }

    clone() {
        const obj = new LineStyle();
        obj.color = this.color;
        obj.alpha = this.alpha;
        obj.texture = this.texture;
        obj.matrix = this.matrix;
        obj.visible = this.visible;
        obj.width = this.width;
        obj.alignment = this.alignment;
        obj.native = this.native;
        obj.cap = this.cap;
        obj.join = this.join;
        obj.miterLimit = this.miterLimit;
        return obj;
    }

    reset() {
        super.reset();
        this.color = 0x0;
        this.alignment = 0.5;
        this.width = 0;
        this.native = false;
        this.cap = LINE_CAP.BUTT;
        this.join = LINE_JOIN.MITER;
        this.miterLimit = 10;
    }
}

// グラフィックスデータ
export class GraphicsData {
    constructor(shape, fillStyle = null, lineStyle = null, matrix = null) {
        this.points = [];
        this.holes = [];
        this.shape = shape;
        this.lineStyle = lineStyle;
        this.fillStyle = fillStyle;
        this.matrix = matrix;
        this.type = shape.type;
    }

    clone() {
        return new GraphicsData(this.shape, this.fillStyle, this.lineStyle, this.matrix);
    }

    destroy() {
        this.shape = null;
        this.holes.length = 0;
        this.holes = null;
        this.points.length = 0;
        this.points = null;
        this.lineStyle = null;
        this.fillStyle = null;
    }
}

// 描画バッチ
export class GraphicsBatch {
    constructor() {
        this.reset();
    }

    begin(style, start, attribStart) {
        this.reset();
        this.style = style;
        this.start = start;
        this.attribStart = attribStart;
    }

    end(end, attribEnd) {
        this.attribSize = attribEnd - this.attribStart;
        this.size = end - this.start;
    }

    reset() {
        this.style = null;
        this.size = 0;
        this.start = 0;
        this.attribStart = 0;
        this.attribSize = 0;
    }
}

// 図形ビルダー - 各図形タイプのポイント生成
export class ShapeBuilders {
    static buildCircle(graphicsData) {
        const points = graphicsData.points;
        const shape = graphicsData.shape;
        let x, y, dx, dy, rx, ry;

        if (graphicsData.type === SHAPES.CIRC) {
            x = shape.x;
            y = shape.y;
            rx = ry = shape.radius;
            dx = dy = 0;
        } else if (graphicsData.type === SHAPES.ELIP) {
            x = shape.x;
            y = shape.y;
            rx = shape.width;
            ry = shape.height;
            dx = dy = 0;
        } else {
            const rect = shape;
            const halfWidth = rect.width / 2;
            const halfHeight = rect.height / 2;
            x = rect.x + halfWidth;
            y = rect.y + halfHeight;
            rx = ry = Math.max(0, Math.min(rect.radius, Math.min(halfWidth, halfHeight)));
            dx = halfWidth - rx;
            dy = halfHeight - ry;
        }

        if (!(rx >= 0 && ry >= 0 && dx >= 0 && dy >= 0)) {
            points.length = 0;
            return;
        }

        const totalSegs = Math.ceil(2.3 * Math.sqrt(rx + ry));
        const seg = (totalSegs * 8) + (dx ? 4 : 0) + (dy ? 4 : 0);

        points.length = seg;

        if (seg === 0) return;

        if (totalSegs === 0) {
            points.length = 8;
            points[0] = points[6] = x + dx;
            points[1] = points[3] = y + dy;
            points[2] = points[4] = x - dx;
            points[5] = points[7] = y - dy;
            return;
        }

        let index = 0;
        let p1x = totalSegs * 4 + (dx ? 2 : 0) + 2;
        let p2x = p1x;
        let p2y = seg;

        // 右上の角
        const rxw = dx + rx;
        const ryh = dy;
        const xcoord = x + rxw;
        const ycoord = x - rxw;
        const yvalue = y + ryh;

        points[index++] = xcoord;
        points[index++] = yvalue;
        points[--p1x] = yvalue;
        points[--p1x] = ycoord;

        if (dy) {
            const yvalue2 = y - ryh;
            points[p2x++] = ycoord;
            points[p2x++] = yvalue2;
            points[--p2y] = yvalue2;
            points[--p2y] = xcoord;
        }

        for (let i = 1; i < totalSegs; i++) {
            const angle = Math.PI / 2 * (i / totalSegs);
            const x1 = dx + Math.cos(angle) * rx;
            const y1 = dy + Math.sin(angle) * ry;
            const x2 = x + x1;
            const x3 = x - x1;
            const y2 = y + y1;
            const y3 = y - y1;

            points[index++] = x2;
            points[index++] = y2;
            points[--p1x] = y2;
            points[--p1x] = x3;
            points[p2x++] = x3;
            points[p2x++] = y3;
            points[--p2y] = y3;
            points[--p2y] = x2;
        }

        // 上の角
        const rxw2 = dx;
        const ryh2 = dy + ry;
        const xcoord2 = x + rxw2;
        const ycoord2 = x - rxw2;
        const yvalue3 = y + ryh2;
        const yvalue4 = y - ryh2;

        points[index++] = xcoord2;
        points[index++] = yvalue3;
        points[--p2y] = yvalue4;
        points[--p2y] = xcoord2;

        if (dx) {
            points[index++] = ycoord2;
            points[index++] = yvalue3;
            points[--p2y] = yvalue4;
            points[--p2y] = ycoord2;
        }
    }

    static buildRectangle(graphicsData) {
        const rectData = graphicsData.shape;
        const x = rectData.x;
        const y = rectData.y;
        const width = rectData.width;
        const height = rectData.height;
        const points = graphicsData.points;

        points.length = 0;

        if (width >= 0 && height >= 0) {
            points.push(x, y,
                x + width, y,
                x + width, y + height,
                x, y + height);
        }
    }

    static buildPolygon(graphicsData) {
        graphicsData.points = graphicsData.shape.points.slice();
    }
}

// 三角形分割ユーティリティ
export class Triangulation {
    static triangulateCircle(graphicsData, graphicsGeometry) {
        const points = graphicsData.points;
        const verts = graphicsGeometry.points;
        const indices = graphicsGeometry.indices;

        if (points.length === 0) return;

        let vertPos = verts.length / 2;
        const center = vertPos;

        let x, y;
        if (graphicsData.type !== SHAPES.RREC) {
            const circle = graphicsData.shape;
            x = circle.x;
            y = circle.y;
        } else {
            const rect = graphicsData.shape;
            x = rect.x + rect.width / 2;
            y = rect.y + rect.height / 2;
        }

        const matrix = graphicsData.matrix;
        verts.push(
            graphicsData.matrix ? matrix.a * x + matrix.c * y + matrix.tx : x,
            graphicsData.matrix ? matrix.b * x + matrix.d * y + matrix.ty : y
        );
        vertPos++;

        verts.push(points[0], points[1]);

        for (let i = 2; i < points.length; i += 2) {
            verts.push(points[i], points[i + 1]);
            indices.push(vertPos++, center, vertPos);
        }

        indices.push(center + 1, center, vertPos);
    }

    static triangulateRectangle(graphicsData, graphicsGeometry) {
        const points = graphicsData.points;
        const verts = graphicsGeometry.points;

        if (points.length === 0) return;

        const vertPos = verts.length / 2;

        verts.push(points[0], points[1],
            points[2], points[3],
            points[6], points[7],
            points[4], points[5]);

        graphicsGeometry.indices.push(vertPos, vertPos + 1, vertPos + 2,
            vertPos + 1, vertPos + 2, vertPos + 3);
    }
}

// ライン描画ユーティリティ
export class LineUtils {
    static buildLine(graphicsData, graphicsGeometry) {
        if (graphicsData.lineStyle.native) {
            this.buildNativeLine(graphicsData, graphicsGeometry);
        } else {
            this.buildLine2(graphicsData, graphicsGeometry);
        }
    }

    static buildNativeLine(graphicsData, graphicsGeometry) {
        let i = 0;
        const shape = graphicsData.shape;
        const points = graphicsData.points || shape.points;
        const closedShape = shape.type !== SHAPES.POLY || shape.closeStroke;

        if (points.length === 0) return;

        const verts = graphicsGeometry.points;
        const indices = graphicsGeometry.indices;
        const length = points.length / 2;
        const startIndex = verts.length / 2;
        let currentIndex = startIndex;

        verts.push(points[0], points[1]);
        for (i = 1; i < length; i++) {
            verts.push(points[i * 2], points[i * 2 + 1]);
            indices.push(currentIndex, currentIndex + 1);
            currentIndex++;
        }

        if (closedShape) {
            indices.push(currentIndex, startIndex);
        }
    }

    static buildLine2(graphicsData, graphicsGeometry) {
        // 複雑なライン描画実装（省略）
        // 実際の実装では、線幅、結合、端点処理などを含む
        console.warn('Advanced line building not implemented in this example');
    }
}

// メインのGraphicsGeometryクラス
export class GraphicsGeometry {
    constructor() {
        this.closePointEps = 1e-4;
        this.boundsPadding = 0;
        this.uvsFloat32 = null;
        this.indicesUint16 = null;
        this.batchable = false;

        this.points = [];
        this.colors = [];
        this.uvs = [];
        this.indices = [];
        this.textureIds = [];
        this.graphicsData = [];
        this.drawCalls = [];

        this.batchDirty = -1;
        this.batches = [];
        this.dirty = 0;
        this.cacheDirty = -1;
        this.clearDirty = 0;
        this.shapeIndex = 0;

        this._bounds = null; // Rectangle
        this.boundsDirty = -1;
    }

    static BATCHABLE_SIZE = 100;

    get bounds() {
        this.updateBatches();
        if (this.boundsDirty !== this.dirty) {
            this.boundsDirty = this.dirty;
            this.calculateBounds();
        }
        return this._bounds;
    }

    invalidate() {
        this.boundsDirty = -1;
        this.dirty++;
        this.batchDirty++;
        this.shapeIndex = 0;

        this.points.length = 0;
        this.colors.length = 0;
        this.uvs.length = 0;
        this.indices.length = 0;
        this.textureIds.length = 0;

        this.drawCalls.length = 0;
        this.batches.length = 0;
    }

    clear() {
        if (this.graphicsData.length > 0) {
            this.invalidate();
            this.clearDirty++;
            this.graphicsData.length = 0;
        }
        return this;
    }

    drawShape(shape, fillStyle = null, lineStyle = null, matrix = null) {
        const data = new GraphicsData(shape, fillStyle, lineStyle, matrix);
        this.graphicsData.push(data);
        this.dirty++;
        return this;
    }

    updateBatches() {
        if (!this.graphicsData.length) {
            this.batchable = true;
            return;
        }

        if (!this.validateBatching()) return;

        this.cacheDirty = this.dirty;
        const graphicsData = this.graphicsData;

        for (let i = this.shapeIndex; i < graphicsData.length; i++) {
            this.shapeIndex++;
            const data = graphicsData[i];
            const fillStyle = data.fillStyle;
            const lineStyle = data.lineStyle;

            // 図形のポイントを構築
            this.buildShape(data);

            if (data.matrix) {
                this.transformPoints(data.points, data.matrix);
            }

            if (fillStyle.visible || lineStyle.visible) {
                this.processHoles(data.holes);
            }

            // 塗りつぶし処理
            if (fillStyle.visible) {
                this.processFill(data);
            }

            // 線描画処理
            if (lineStyle.visible) {
                this.processLine(data);
            }
        }

        this.batchable = this.isBatchable();
    }

    buildShape(graphicsData) {
        const { type } = graphicsData;

        switch (type) {
            case SHAPES.RECT:
            case SHAPES.RREC:
                if (type === SHAPES.RECT) {
                    ShapeBuilders.buildRectangle(graphicsData);
                } else {
                    ShapeBuilders.buildCircle(graphicsData);
                }
                break;
            case SHAPES.CIRC:
            case SHAPES.ELIP:
                ShapeBuilders.buildCircle(graphicsData);
                break;
            case SHAPES.POLY:
                ShapeBuilders.buildPolygon(graphicsData);
                break;
        }
    }

    processFill(graphicsData) {
        const { type } = graphicsData;

        if (graphicsData.holes.length) {
            // 複雑な多角形の三角形分割
            this.triangulateComplex(graphicsData);
        } else {
            switch (type) {
                case SHAPES.RECT:
                    Triangulation.triangulateRectangle(graphicsData, this);
                    break;
                case SHAPES.CIRC:
                case SHAPES.ELIP:
                case SHAPES.RREC:
                    Triangulation.triangulateCircle(graphicsData, this);
                    break;
                case SHAPES.POLY:
                    this.triangulateComplex(graphicsData);
                    break;
            }
        }
    }

    processLine(graphicsData) {
        LineUtils.buildLine(graphicsData, this);

        for (let i = 0; i < graphicsData.holes.length; i++) {
            LineUtils.buildLine(graphicsData.holes[i], this);
        }
    }

    triangulateComplex(graphicsData) {
        // earcut または他の三角形分割ライブラリを使用
        console.warn('Complex triangulation not implemented in this example');
    }

    processHoles(holes) {
        for (let i = 0; i < holes.length; i++) {
            const hole = holes[i];
            this.buildShape(hole);
            if (hole.matrix) {
                this.transformPoints(hole.points, hole.matrix);
            }
        }
    }

    transformPoints(points, matrix) {
        for (let i = 0; i < points.length / 2; i++) {
            const x = points[i * 2];
            const y = points[i * 2 + 1];

            points[i * 2] = matrix.a * x + matrix.c * y + matrix.tx;
            points[i * 2 + 1] = matrix.b * x + matrix.d * y + matrix.ty;
        }
    }

    validateBatching() {
        if (this.dirty === this.cacheDirty || !this.graphicsData.length) {
            return false;
        }

        for (let i = 0; i < this.graphicsData.length; i++) {
            const data = this.graphicsData[i];
            const fill = data.fillStyle;
            const line = data.lineStyle;

            if ((fill && !fill.texture.baseTexture.valid) ||
                (line && !line.texture.baseTexture.valid)) {
                return false;
            }
        }

        return true;
    }

    isBatchable() {
        if (this.points.length > 65535 * 2) {
            return false;
        }

        const batches = this.batches;
        for (let i = 0; i < batches.length; i++) {
            if (batches[i].style.native) {
                return false;
            }
        }

        return this.points.length < GraphicsGeometry.BATCHABLE_SIZE * 2;
    }

    calculateBounds() {
        if (!this._bounds) {
            this._bounds = new Rectangle();
        }

        const bounds = this._bounds;
        bounds.x = Infinity;
        bounds.y = Infinity;
        bounds.width = -Infinity;
        bounds.height = -Infinity;

        if (this.points.length) {
            for (let i = 0; i < this.points.length; i += 2) {
                const x = this.points[i];
                const y = this.points[i + 1];

                bounds.x = Math.min(bounds.x, x);
                bounds.y = Math.min(bounds.y, y);
                bounds.width = Math.max(bounds.width, x);
                bounds.height = Math.max(bounds.height, y);
            }

            bounds.width -= bounds.x;
            bounds.height -= bounds.y;
        } else {
            bounds.x = bounds.y = bounds.width = bounds.height = 0;
        }
    }

    destroy() {
        for (let i = 0; i < this.graphicsData.length; ++i) {
            this.graphicsData[i].destroy();
        }

        this.points.length = 0;
        this.points = null;
        this.colors.length = 0;
        this.colors = null;
        this.uvs.length = 0;
        this.uvs = null;
        this.indices.length = 0;
        this.indices = null;
        this.graphicsData.length = 0;
        this.graphicsData = null;
        this.drawCalls.length = 0;
        this.drawCalls = null;
        this.batches.length = 0;
        this.batches = null;
        this._bounds = null;
    }
}

// メインのGraphicsクラス
export class Graphics {
    constructor(geometry = null) {
        this.shader = null;
        this.pluginName = 'batch';
        this.currentPath = null;
        this.batches = [];
        this.batchTint = -1;
        this.batchDirty = -1;
        this.vertexData = null;

        this._fillStyle = new FillStyle();
        this._lineStyle = new LineStyle();
        this._matrix = null;
        this._holeMode = false;

        this.state = State.for2d();
        this._geometry = geometry || new GraphicsGeometry();
        this._geometry.refCount++;
        this._transformID = -1;
        this._tintColor = new Color(0xFFFFFF);
        this.blendMode = BLEND_MODES.NORMAL;
    }

    get geometry() {
        return this._geometry;
    }

    clone() {
        this.finishPoly();
        return new Graphics(this._geometry);
    }

    set blendMode(value) {
        this.state.blendMode = value;
    }

    get blendMode() {
        return this.state.blendMode;
    }

    get tint() {
        return this._tintColor.value;
    }

    set tint(value) {
        this._tintColor.setValue(value);
    }

    get fill() {
        return this._fillStyle;
    }

    get line() {
        return this._lineStyle;
    }

    // 描画メソッド群
    lineStyle(width = null, color = 0, alpha, alignment = 0.5, native = false) {
        if (typeof width === 'number') {
            width = {
                width: width,
                color: color,
                alpha: alpha,
                alignment: alignment,
                native: native
            };
        }
        return this.lineTextureStyle(width);
    }

    lineTextureStyle(options) {
        const defaultOptions = {
            width: 0,
            texture: Texture.WHITE,
            color: (options && options.texture) ? 0xFFFFFF : 0,
            matrix: null,
            alignment: 0.5,
            native: false,
            cap: LINE_CAP.BUTT,
            join: LINE_JOIN.MITER,
            miterLimit: 10
        };

        options = Object.assign(defaultOptions, options);
        this.normalizeColor(options);

        if (this.currentPath) {
            this.startPoly();
        }

        const visible = options.width > 0 && options.alpha > 0;

        if (visible) {
            if (options.matrix) {
                options.matrix = options.matrix.clone();
                options.matrix.invert();
            }

            Object.assign(this._lineStyle, { visible }, options);
        } else {
            this._lineStyle.reset();
        }

        return this;
    }

    beginFill(color = 0, alpha = 1) {
        return this.beginTextureFill({ texture: Texture.WHITE, color, alpha });
    }

    beginTextureFill(options) {
        const defaultOptions = {
            texture: Texture.WHITE,
            color: 0xFFFFFF,
            alpha: 1,
            matrix: null
        };

        options = Object.assign(defaultOptions, options);
        this.normalizeColor(options);

        if (this.currentPath) {
            this.startPoly();
        }

        const visible = options.alpha > 0;

        if (visible) {
            if (options.matrix) {
                options.matrix = options.matrix.clone();
                options.matrix.invert();
            }

            Object.assign(this._fillStyle, { visible }, options);
        } else {
            this._fillStyle.reset();
        }

        return this;
    }

    endFill() {
        this.finishPoly();
        this._fillStyle.reset();
        return this;
    }

    // 図形描画メソッド
    drawRect(x, y, width, height) {
        return this.drawShape(new Rectangle(x, y, width, height));
    }

    drawRoundedRect(x, y, width, height, radius) {
        return this.drawShape(new RoundedRectangle(x, y, width, height, radius));
    }

    drawCircle(x, y, radius) {
        return this.drawShape(new Circle(x, y, radius));
    }

    drawEllipse(x, y, width, height) {
        return this.drawShape(new Ellipse(x, y, width, height));
    }

    drawPolygon(...path) {
        let points;
        let closeStroke = true;

        const poly = path[0];
        if (poly.points) {
            closeStroke = poly.closeStroke;
            points = poly.points;
        } else if (Array.isArray(path[0])) {
            points = path[0];
        } else {
            points = path;
        }

        const shape = new Polygon(points);
        shape.closeStroke = closeStroke;
        return this.drawShape(shape);
    }

    drawShape(shape) {
        if (!this._holeMode) {
            this._geometry.drawShape(
                shape,
                this._fillStyle.visible ? this._fillStyle : null,
                this._lineStyle.visible ? this._lineStyle : null,
                this._matrix
            );
        } else {
            this._geometry.drawHole(shape, this._matrix);
        }

        return this;
    }

    // パス操作
    moveTo(x, y) {
        this.startPoly();
        this.currentPath.points[0] = x;
        this.currentPath.points[1] = y;
        return this;
    }

    lineTo(x, y) {
        if (!this.currentPath) {
            this.moveTo(0, 0);
        }

        const points = this.currentPath.points;
        const fromX = points[points.length - 2];
        const fromY = points[points.length - 1];

        if (fromX !== x || fromY !== y) {
            points.push(x, y);
        }

        return this;
    }

    bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY) {
        if (!this.currentPath) {
            this.moveTo(0, 0);
        }

        const points = this.currentPath.points;
        const fromX = points[points.length - 2];
        const fromY = points[points.length - 1];

        // ベジェ曲線を線分に分割
        const n = 20; // 分割数
        for (let i = 1; i <= n; i++) {
            const t = i / n;
            const u = 1 - t;
            const tt = t * t;
            const uu = u * u;
            const uuu = uu * u;
            const ttt = tt * t;

            const x = uuu * fromX + 3 * uu * t * cpX + 3 * u * tt * cpX2 + ttt * toX;
            const y = uuu * fromY + 3 * uu * t * cpY + 3 * u * tt * cpY2 + ttt * toY;

            points.push(x, y);
        }

        return this;
    }

    quadraticCurveTo(cpX, cpY, toX, toY) {
        if (!this.currentPath) {
            this.moveTo(0, 0);
        }

        const points = this.currentPath.points;
        const fromX = points[points.length - 2];
        const fromY = points[points.length - 1];

        // 二次ベジェ曲線を線分に分割
        const n = 20; // 分割数
        for (let i = 1; i <= n; i++) {
            const t = i / n;
            const u = 1 - t;

            const x = u * u * fromX + 2 * u * t * cpX + t * t * toX;
            const y = u * u * fromY + 2 * u * t * cpY + t * t * toY;

            points.push(x, y);
        }

        return this;
    }

    arc(cx, cy, radius, startAngle, endAngle, anticlockwise = false) {
        if (startAngle === endAngle) return this;

        if (!anticlockwise && endAngle <= startAngle) {
            endAngle += Math.PI * 2;
        } else if (anticlockwise && startAngle <= endAngle) {
            startAngle += Math.PI * 2;
        }

        const sweep = endAngle - startAngle;
        const segs = Math.ceil(Math.abs(sweep) / (Math.PI * 0.25)) * 2;
        const theta = sweep / segs;
        const theta2 = theta / 2;

        theta2 *= anticlockwise ? -1 : 1;

        const cTheta = Math.cos(theta2);
        const sTheta = Math.sin(theta2);

        let angle = startAngle + theta2 * (anticlockwise ? -1 : 1);

        for (let i = 0; i < segs; i++) {
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;

            this.lineTo(x, y);

            angle += theta;
        }

        return this;
    }

    arcTo(x1, y1, x2, y2, radius) {
        if (!this.currentPath) {
            this.moveTo(x1, y1);
        }

        const points = this.currentPath.points;
        const fromX = points[points.length - 2];
        const fromY = points[points.length - 1];

        const a1 = fromY - y1;
        const b1 = fromX - x1;
        const a2 = y2 - y1;
        const b2 = x2 - x1;
        const mm = Math.abs(a1 * b2 - b1 * a2);

        if (mm < 1.0e-8 || radius === 0) {
            if (points[points.length - 2] !== x1 || points[points.length - 1] !== y1) {
                points.push(x1, y1);
            }
        } else {
            const dd = a1 * a1 + b1 * b1;
            const cc = a2 * a2 + b2 * b2;
            const tt = a1 * a2 + b1 * b2;
            const k1 = radius * Math.sqrt(dd) / mm;
            const k2 = radius * Math.sqrt(cc) / mm;
            const j1 = k1 * tt / dd;
            const j2 = k2 * tt / cc;
            const cx = k1 * b2 + k2 * b1;
            const cy = k1 * a2 + k2 * a1;
            const px = b1 * (k2 + j1);
            const py = a1 * (k2 + j1);
            const qx = b2 * (k1 + j2);
            const qy = a2 * (k1 + j2);
            const startAngle = Math.atan2(py - cy, px - cx);
            const endAngle = Math.atan2(qy - cy, qx - cx);

            this.arc(cx + x1, cy + y1, radius, startAngle, endAngle, b1 * a2 > b2 * a1);
        }

        return this;
    }

    closePath() {
        if (this.currentPath) {
            const points = this.currentPath.points;
            if (points.length > 2) {
                points.push(points[0], points[1]);
            }
        }
        return this;
    }

    // ヘルパーメソッド
    startPoly() {
        if (this.currentPath) {
            const points = this.currentPath.points;
            const len = this.currentPath.points.length;

            if (len > 2) {
                this.drawShape(this.currentPath);
                this.currentPath = new Polygon();
                this.currentPath.closeStroke = false;
                this.currentPath.points.push(points[len - 2], points[len - 1]);
            }
        } else {
            this.currentPath = new Polygon();
            this.currentPath.closeStroke = false;
        }
    }

    finishPoly() {
        if (this.currentPath) {
            if (this.currentPath.points.length > 2) {
                this.drawShape(this.currentPath);
                this.currentPath = null;
            } else {
                this.currentPath = null;
            }
        }
    }

    normalizeColor(options) {
        const temp = Color.shared.setValue(options.color || 0);
        options.color = temp.toNumber();
        options.alpha = options.alpha === undefined ? temp.alpha : options.alpha;
    }

    // ホール（穴）操作
    beginHole() {
        this.finishPoly();
        this._holeMode = true;
        return this;
    }

    endHole() {
        this.finishPoly();
        this._holeMode = false;
        return this;
    }

    // クリア
    clear() {
        this._geometry.clear();
        this._lineStyle.reset();
        this._fillStyle.reset();
        this._boundsID++;
        this._matrix = null;
        this._holeMode = false;
        this.currentPath = null;
        return this;
    }

    // 破棄
    destroy(options) {
        this._geometry.refCount--;
        if (this._geometry.refCount === 0) {
            this._geometry.destroy();
        }

        this._matrix = null;
        this.currentPath = null;
        this._lineStyle.destroy();
        this._fillStyle.destroy();
        this._lineStyle = null;
        this._fillStyle = null;
        this._geometry = null;
        this.shader = null;
        this.vertexData = null;
        this.batches.length = 0;
        this.batches = null;

        super.destroy(options);
    }
}

// デフォルトエクスポート
export default {
    Graphics,
    GraphicsGeometry,
    GraphicsData,
    FillStyle,
    LineStyle,
    Rectangle,
    Circle,
    Ellipse,
    Polygon,
    RoundedRectangle,
    SHAPES,
    LINE_JOIN,
    LINE_CAP
};
