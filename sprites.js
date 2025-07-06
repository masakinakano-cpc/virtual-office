// Sprites Module - 表示オブジェクトとスプライト管理
// DisplayObject、Container、Spriteの階層構造を提供

import { Texture } from './texture.js';
import { Transform, Bounds } from './display.js';
import { EventEmitter, Point, Matrix } from './display.js';
import { BLEND_MODES } from './main-pixi.js';

// 表示オブジェクトの基底クラス
export class DisplayObject extends EventEmitter {
    constructor() {
        super();

        this.alpha = 1;
        this.visible = true;
        this.renderable = true;
        this.parent = null;
        this.worldAlpha = 1;
        this.transform = new Transform();
        this._bounds = new Bounds();
        this._localBounds = null;
        this._boundsID = 0;
        this._boundsRect = null;
        this._localBoundsRect = null;
        this._mask = null;
        this._maskRefCount = 0;
        this.filterArea = null;
        this.filters = null;
        this.isSprite = false;
        this.isMask = false;
        this._tempDisplayObjectParent = null;

        // イベント関連
        this.interactive = false;
        this.interactiveChildren = true;
        this.hitArea = null;
        this.buttonMode = false;
        this.cursor = null;
        this._internalEventMode = 'auto';
        this._internalInteractive = undefined;

        // アクセシビリティ
        this.accessible = false;
        this.accessibleTitle = null;
        this.accessibleHint = null;
        this.tabIndex = 0;
        this._accessibleActive = false;
        this._accessibleDiv = null;
        this.accessibleType = 'button';
        this.accessiblePointerEvents = 'auto';
        this.accessibleChildren = true;
        this.renderId = -1;

        // キャッシュ
        this._cacheAsBitmap = false;
        this._cacheData = null;
        this._cacheAsBitmapResolution = null;
        this._cacheAsBitmapMultisample = null;

        this.name = null;
    }

    // 位置プロパティ
    get x() {
        return this.transform.position.x;
    }

    set x(value) {
        this.transform.position.x = value;
    }

    get y() {
        return this.transform.position.y;
    }

    set y(value) {
        this.transform.position.y = value;
    }

    get worldTransform() {
        return this.transform.worldTransform;
    }

    get localTransform() {
        return this.transform.localTransform;
    }

    get position() {
        return this.transform.position;
    }

    set position(value) {
        this.transform.position.copyFrom(value);
    }

    get scale() {
        return this.transform.scale;
    }

    set scale(value) {
        this.transform.scale.copyFrom(value);
    }

    get pivot() {
        return this.transform.pivot;
    }

    set pivot(value) {
        this.transform.pivot.copyFrom(value);
    }

    get skew() {
        return this.transform.skew;
    }

    set skew(value) {
        this.transform.skew.copyFrom(value);
    }

    get rotation() {
        return this.transform.rotation;
    }

    set rotation(value) {
        this.transform.rotation = value;
    }

    get angle() {
        return this.transform.rotation * 180 / Math.PI;
    }

    set angle(value) {
        this.transform.rotation = value * Math.PI / 180;
    }

    get zIndex() {
        return this.transform.zIndex;
    }

    set zIndex(value) {
        this.transform.zIndex = value;
    }

    // マスク
    get mask() {
        return this._mask;
    }

    set mask(value) {
        if (this._mask === value) return;

        if (this._mask) {
            const maskObject = this._mask.isMaskData ? this._mask.maskObject : this._mask;
            if (maskObject) {
                maskObject._maskRefCount--;
                if (maskObject._maskRefCount === 0) {
                    maskObject.renderable = true;
                    maskObject.isMask = false;
                }
            }
        }

        this._mask = value;

        if (this._mask) {
            const maskObject = this._mask.isMaskData ? this._mask.maskObject : this._mask;
            if (maskObject) {
                if (maskObject._maskRefCount === 0) {
                    maskObject.renderable = false;
                    maskObject.isMask = true;
                }
                maskObject._maskRefCount++;
            }
        }
    }

    // イベントモード
    get eventMode() {
        return this._internalEventMode;
    }

    set eventMode(value) {
        this._internalInteractive = this.isInteractiveMode(value);
        this._internalEventMode = value;
    }

    get interactive() {
        return this._internalInteractive ?? this.isInteractiveMode(this._internalEventMode);
    }

    set interactive(value) {
        this._internalInteractive = value;
        this.eventMode = value ? 'static' : 'auto';
    }

    isInteractiveMode(mode) {
        return mode === 'static' || mode === 'dynamic';
    }

    isInteractive() {
        return this.eventMode === 'static' || this.eventMode === 'dynamic';
    }

    // 境界
    getBounds(skipUpdate, rect) {
        if (!skipUpdate) {
            if (!this.parent) {
                this.parent = this._tempDisplayObjectParent;
                this.updateTransform();
                this.parent = null;
            } else {
                this.updateTransform();
            }
        }

        if (this._bounds.updateID !== this._boundsID) {
            this.calculateBounds();
            this._bounds.updateID = this._boundsID;
        }

        if (!rect) {
            if (!this._boundsRect) {
                this._boundsRect = new Rectangle();
            }
            rect = this._boundsRect;
        }

        return this._bounds.getRectangle(rect);
    }

    getLocalBounds(rect) {
        if (!rect) {
            if (!this._localBoundsRect) {
                this._localBoundsRect = new Rectangle();
            }
            rect = this._localBoundsRect;
        }

        if (!this._localBounds) {
            this._localBounds = new Bounds();
        }

        const transformRef = this.transform;
        const parentRef = this.parent;

        this.parent = null;
        this.transform = this._tempTransform;

        const worldBounds = this._bounds;
        const worldBoundsID = this._boundsID;

        this._bounds = this._localBounds;

        const bounds = this.getBounds(false, rect);

        this.parent = parentRef;
        this.transform = transformRef;
        this._bounds = worldBounds;
        this._bounds.updateID += this._boundsID - worldBoundsID;

        return bounds;
    }

    calculateBounds() {
        // 基底実装では何もしない
    }

    // 変換
    updateTransform() {
        if (this.parent) {
            this.transform.updateTransform(this.parent.transform);
            this.worldAlpha = this.alpha * this.parent.worldAlpha;
            this._boundsID++;
        } else {
            this.transform.updateTransform(this._tempTransform);
            this.worldAlpha = this.alpha;
            this._boundsID++;
        }
    }

    // ローカル座標とグローバル座標の変換
    toGlobal(position, point, skipUpdate = false) {
        if (!skipUpdate) {
            this.updateTransform();
            if (!this.parent) {
                this.parent = this._tempDisplayObjectParent;
                this.updateTransform();
                this.parent = null;
            }
        }

        return this.worldTransform.apply(position, point);
    }

    toLocal(position, from, point, skipUpdate) {
        if (from) {
            position = from.toGlobal(position, point, skipUpdate);
        }

        if (!skipUpdate) {
            this.updateTransform();
            if (!this.parent) {
                this.parent = this._tempDisplayObjectParent;
                this.updateTransform();
                this.parent = null;
            }
        }

        return this.worldTransform.applyInverse(position, point);
    }

    // レンダリング
    render(renderer) {
        // 基底実装では何もしない
    }

    renderAdvanced(renderer) {
        const filters = this.filters;
        const mask = this._mask;

        if (filters) {
            this._enabledFilters = this._enabledFilters || [];
            this._enabledFilters.length = 0;

            for (let i = 0; i < filters.length; i++) {
                if (filters[i].enabled) {
                    this._enabledFilters.push(filters[i]);
                }
            }
        }

        const flush = filters && this._enabledFilters?.length ||
            mask && (!mask.isMaskData || (mask.enabled && (mask.autoDetect || mask.type !== 'none')));

        if (flush) {
            renderer.batch.flush();
        }

        if (filters && this._enabledFilters?.length) {
            renderer.filter.push(this, this._enabledFilters);
        }

        if (mask) {
            renderer.mask.push(this, this._mask);
        }

        if (this.cullable) {
            this._renderWithCulling(renderer);
        } else {
            this._render(renderer);
            for (let i = 0, j = this.children?.length || 0; i < j; ++i) {
                this.children[i].render(renderer);
            }
        }

        if (flush) {
            renderer.batch.flush();
        }

        if (mask) {
            renderer.mask.pop(this);
        }

        if (filters && this._enabledFilters?.length) {
            renderer.filter.pop();
        }
    }

    _render(renderer) {
        // 基底実装では何もしない
    }

    _renderWithCulling(renderer) {
        const bounds = this.getBounds(true);

        if (renderer.screen.intersects(bounds)) {
            this._render(renderer);
            for (let i = 0, j = this.children?.length || 0; i < j; ++i) {
                this.children[i].render(renderer);
            }
        }
    }

    // 当たり判定
    containsPoint(point) {
        return false;
    }

    // グローバル位置取得
    getGlobalPosition(point = new Point(), skipUpdate = false) {
        if (this.parent) {
            return this.parent.toGlobal(this.position, point, skipUpdate);
        } else {
            point.x = this.position.x;
            point.y = this.position.y;
            return point;
        }
    }

    // 破棄
    destroy(options) {
        if (this.parent) {
            this.parent.removeChild(this);
        }

        this.removeAllListeners();
        this.transform = null;
        this.parent = null;
        this._bounds = null;
        this._mask = null;
        this.filters = null;
        this.filterArea = null;
        this.hitArea = null;
        this.interactive = false;
        this.interactiveChildren = false;
    }

    // 一時的な親オブジェクト
    enableTempParent() {
        const tempParent = this._tempDisplayObjectParent;
        this.parent = tempParent;
        return tempParent;
    }

    disableTempParent(tempParent) {
        this.parent = null;
    }

    static _tempDisplayObjectParent = new DisplayObject();
}

// コンテナクラス
export class Container extends DisplayObject {
    constructor() {
        super();

        this.children = [];
        this.sortableChildren = Container.defaultSortableChildren;
        this.sortDirty = false;
        this._width = 0;
        this._height = 0;
    }

    static defaultSortableChildren = false;

    // 子オブジェクトの管理
    addChild(...children) {
        if (children.length > 1) {
            for (const child of children) {
                this.addChild(child);
            }
        } else {
            const child = children[0];

            if (child.parent) {
                child.parent.removeChild(child);
            }

            child.parent = this;
            this.sortDirty = this.sortableChildren;
            child.transform._parentID = -1;
            this.children.push(child);
            this._boundsID++;
            this.onChildrenChange(this.children.length - 1);
            this.emit('childAdded', child, this, this.children.length - 1);
            child.emit('added', this);
        }

        return children[0];
    }

    addChildAt(child, index) {
        if (index < 0 || index > this.children.length) {
            throw new Error(`The index ${index} supplied is out of bounds ${this.children.length}`);
        }

        if (child.parent) {
            child.parent.removeChild(child);
        }

        child.parent = this;
        this.sortDirty = this.sortableChildren;
        child.transform._parentID = -1;
        this.children.splice(index, 0, child);
        this._boundsID++;
        this.onChildrenChange(index);
        child.emit('added', this);
        this.emit('childAdded', child, this, index);

        return child;
    }

    swapChildren(child, child2) {
        if (child === child2) return;

        const index1 = this.getChildIndex(child);
        const index2 = this.getChildIndex(child2);

        this.children[index1] = child2;
        this.children[index2] = child;
        this.onChildrenChange(index1 < index2 ? index1 : index2);
    }

    getChildIndex(child) {
        const index = this.children.indexOf(child);
        if (index === -1) {
            throw new Error('The supplied DisplayObject must be a child of the caller');
        }
        return index;
    }

    setChildIndex(child, index) {
        if (index < 0 || index >= this.children.length) {
            throw new Error(`The index ${index} supplied is out of bounds ${this.children.length}`);
        }

        const currentIndex = this.getChildIndex(child);
        this.children.splice(currentIndex, 1);
        this.children.splice(index, 0, child);
        this.onChildrenChange(index);
    }

    getChildAt(index) {
        if (index < 0 || index >= this.children.length) {
            throw new Error(`getChildAt: Index (${index}) does not exist.`);
        }
        return this.children[index];
    }

    removeChild(...children) {
        if (children.length > 1) {
            for (const child of children) {
                this.removeChild(child);
            }
        } else {
            const child = children[0];
            const index = this.children.indexOf(child);

            if (index === -1) return null;

            child.parent = null;
            child.transform._parentID = -1;
            this.children.splice(index, 1);
            this._boundsID++;
            this.onChildrenChange(index);
            child.emit('removed', this);
            this.emit('childRemoved', child, this, index);
        }

        return children[0];
    }

    removeChildAt(index) {
        const child = this.getChildAt(index);
        child.parent = null;
        child.transform._parentID = -1;
        this.children.splice(index, 1);
        this._boundsID++;
        this.onChildrenChange(index);
        child.emit('removed', this);
        this.emit('childRemoved', child, this, index);
        return child;
    }

    removeChildren(beginIndex = 0, endIndex) {
        const begin = beginIndex;
        const end = typeof endIndex === 'number' ? endIndex : this.children.length;
        const range = end - begin;

        if (range > 0 && range <= end) {
            const removed = this.children.splice(begin, range);

            for (const child of removed) {
                child.parent = null;
                child.transform._parentID = -1;
                child.emit('removed', this);
                this.emit('childRemoved', child, this);
            }

            this.onChildrenChange(beginIndex);
            return removed;
        } else if (range === 0 && this.children.length === 0) {
            return [];
        }

        throw new RangeError('removeChildren: numeric values are outside the acceptable range.');
    }

    // ソート
    sortChildren() {
        let sortRequired = false;

        for (let i = 0, j = this.children.length; i < j; ++i) {
            const child = this.children[i];
            child._lastSortedIndex = i;

            if (!sortRequired && child.zIndex !== 0) {
                sortRequired = true;
            }
        }

        if (sortRequired && this.children.length > 1) {
            this.children.sort(Container.sortZIndex);
        }

        this.sortDirty = false;
    }

    static sortZIndex(a, b) {
        if (a.zIndex < b.zIndex) {
            return -1;
        } else if (a.zIndex > b.zIndex) {
            return 1;
        }
        return a._lastSortedIndex - b._lastSortedIndex;
    }

    // 子の変更通知
    onChildrenChange(index) {
        // オーバーライド可能
    }

    // 名前による検索
    getChildByName(name, deep = false) {
        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i].name === name) {
                return this.children[i];
            }
        }

        if (deep) {
            for (let i = 0; i < this.children.length; i++) {
                const child = this.children[i];
                if (child.getChildByName) {
                    const found = child.getChildByName(name, true);
                    if (found) {
                        return found;
                    }
                }
            }
        }

        return null;
    }

    // レンダリング
    render(renderer) {
        if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
            return;
        }

        if (this._mask || (this.filters && this._enabledFilters?.length)) {
            this.renderAdvanced(renderer);
        } else {
            this._render(renderer);

            for (let i = 0, j = this.children.length; i < j; ++i) {
                this.children[i].render(renderer);
            }
        }
    }

    renderAdvanced(renderer) {
        const filters = this.filters;
        const mask = this._mask;

        if (filters) {
            this._enabledFilters = this._enabledFilters || [];
            this._enabledFilters.length = 0;

            for (let i = 0; i < filters.length; i++) {
                if (filters[i].enabled) {
                    this._enabledFilters.push(filters[i]);
                }
            }
        }

        const flush = filters && this._enabledFilters?.length ||
            mask && (!mask.isMaskData || (mask.enabled && (mask.autoDetect || mask.type !== 'none')));

        if (flush) {
            renderer.batch.flush();
        }

        if (filters && this._enabledFilters?.length) {
            renderer.filter.push(this, this._enabledFilters);
        }

        if (mask) {
            renderer.mask.push(this, this._mask);
        }

        if (this.cullable) {
            this._renderWithCulling(renderer);
        } else {
            this._render(renderer);

            if (this.sortableChildren && this.sortDirty) {
                this.sortChildren();
            }

            for (let i = 0, j = this.children.length; i < j; ++i) {
                this.children[i].render(renderer);
            }
        }

        if (flush) {
            renderer.batch.flush();
        }

        if (mask) {
            renderer.mask.pop(this);
        }

        if (filters && this._enabledFilters?.length) {
            renderer.filter.pop();
        }
    }

    // 境界計算
    calculateBounds() {
        this._bounds.clear();

        if (!this.visible) return;

        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];

            if (!child.visible || !child.renderable) {
                continue;
            }

            child.updateTransform();

            if (child._mask) {
                const maskObject = child._mask.isMaskData ? child._mask.maskObject : child._mask;
                if (maskObject && !maskObject._bounds.isEmpty()) {
                    this._bounds.addBounds(maskObject._bounds);
                }
            } else {
                this._bounds.addBounds(child._bounds);
            }
        }

        this._bounds.updateID = this._boundsID;
    }

    // 当たり判定
    containsPoint(point) {
        return this.getBounds().contains(point.x, point.y);
    }

    // サイズ
    get width() {
        return this.scale.x * this.getLocalBounds().width;
    }

    set width(value) {
        const width = this.getLocalBounds().width;
        this.scale.x = width !== 0 ? value / width : 1;
        this._width = value;
    }

    get height() {
        return this.scale.y * this.getLocalBounds().height;
    }

    set height(value) {
        const height = this.getLocalBounds().height;
        this.scale.y = height !== 0 ? value / height : 1;
        this._height = value;
    }

    // 破棄
    destroy(options) {
        super.destroy();

        this.sortDirty = false;

        const destroyChildren = typeof options === 'boolean' ? options : options?.children;
        const removed = this.removeChildren(0, this.children.length);

        if (destroyChildren) {
            for (const child of removed) {
                child.destroy(options);
            }
        }
    }
}

// スプライトクラス
export class Sprite extends Container {
    constructor(texture) {
        super();

        this._anchor = new Point(0, 0);
        this._texture = null;
        this._width = 0;
        this._height = 0;
        this._tintColor = new Color(0xFFFFFF);
        this._tintRGB = null;
        this.tint = 0xFFFFFF;
        this.blendMode = BLEND_MODES.NORMAL;
        this._cachedTint = 0xFFFFFF;
        this.uvs = null;
        this.texture = texture || Texture.EMPTY;
        this.vertexData = new Float32Array(8);
        this.vertexTrimmedData = null;
        this._transformID = -1;
        this._textureID = -1;
        this._transformTrimmedID = -1;
        this._textureTrimmedID = -1;
        this.indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
        this.pluginName = 'batch';
        this.isSprite = true;
        this._roundPixels = false;

        this._onTextureUpdate = this._onTextureUpdate.bind(this);
        this._onAnchorUpdate = this._onAnchorUpdate.bind(this);
    }

    _onTextureUpdate() {
        this._textureID = -1;
        this._textureTrimmedID = -1;
        this._cachedTint = 0xFFFFFF;

        if (this._width) {
            this.scale.x = Math.sign(this.scale.x) * this._width / this._texture.orig.width;
        }

        if (this._height) {
            this.scale.y = Math.sign(this.scale.y) * this._height / this._texture.orig.height;
        }
    }

    _onAnchorUpdate() {
        this._transformID = -1;
        this._transformTrimmedID = -1;
    }

    calculateVertices() {
        const texture = this._texture;

        if (this._transformID === this.transform._worldID && this._textureID === texture._updateID) {
            return;
        }

        if (this._textureID !== texture._updateID) {
            this.uvs = this._texture._uvs.uvsFloat32;
        }

        this._transformID = this.transform._worldID;
        this._textureID = texture._updateID;

        const wt = this.transform.worldTransform;
        const a = wt.a;
        const b = wt.b;
        const c = wt.c;
        const d = wt.d;
        const tx = wt.tx;
        const ty = wt.ty;
        const vertexData = this.vertexData;
        const trim = texture.trim;
        const orig = texture.orig;
        const anchor = this._anchor;

        let w0, w1, h0, h1;

        if (trim) {
            w1 = trim.x - (anchor.x * orig.width);
            w0 = w1 + trim.width;
            h1 = trim.y - (anchor.y * orig.height);
            h0 = h1 + trim.height;
        } else {
            w1 = -anchor.x * orig.width;
            w0 = w1 + orig.width;
            h1 = -anchor.y * orig.height;
            h0 = h1 + orig.height;
        }

        vertexData[0] = (a * w1) + (c * h1) + tx;
        vertexData[1] = (d * h1) + (b * w1) + ty;
        vertexData[2] = (a * w0) + (c * h1) + tx;
        vertexData[3] = (d * h1) + (b * w0) + ty;
        vertexData[4] = (a * w0) + (c * h0) + tx;
        vertexData[5] = (d * h0) + (b * w0) + ty;
        vertexData[6] = (a * w1) + (c * h0) + tx;
        vertexData[7] = (d * h0) + (b * w1) + ty;

        if (this._roundPixels) {
            const resolution = 1; // settings.RESOLUTION
            for (let i = 0; i < vertexData.length; ++i) {
                vertexData[i] = Math.round(vertexData[i] * resolution) / resolution;
            }
        }
    }

    calculateTrimmedVertices() {
        if (!this.vertexTrimmedData) {
            this.vertexTrimmedData = new Float32Array(8);
        } else if (this._transformTrimmedID === this.transform._worldID && this._textureTrimmedID === this._texture._updateID) {
            return;
        }

        this._transformTrimmedID = this.transform._worldID;
        this._textureTrimmedID = this._texture._updateID;

        const texture = this._texture;
        const vertexData = this.vertexTrimmedData;
        const orig = texture.orig;
        const anchor = this._anchor;
        const wt = this.transform.worldTransform;
        const a = wt.a;
        const b = wt.b;
        const c = wt.c;
        const d = wt.d;
        const tx = wt.tx;
        const ty = wt.ty;

        const w1 = -anchor.x * orig.width;
        const w0 = w1 + orig.width;
        const h1 = -anchor.y * orig.height;
        const h0 = h1 + orig.height;

        vertexData[0] = (a * w1) + (c * h1) + tx;
        vertexData[1] = (d * h1) + (b * w1) + ty;
        vertexData[2] = (a * w0) + (c * h1) + tx;
        vertexData[3] = (d * h1) + (b * w0) + ty;
        vertexData[4] = (a * w0) + (c * h0) + tx;
        vertexData[5] = (d * h0) + (b * w0) + ty;
        vertexData[6] = (a * w1) + (c * h0) + tx;
        vertexData[7] = (d * h0) + (b * w1) + ty;
    }

    _render(renderer) {
        this.calculateVertices();
        renderer.batch.setObjectRenderer(renderer.plugins[this.pluginName]);
        renderer.plugins[this.pluginName].render(this);
    }

    _calculateBounds() {
        const trim = this._texture.trim;
        const orig = this._texture.orig;

        if (!trim || (trim.width === orig.width && trim.height === orig.height)) {
            this.calculateVertices();
            this._bounds.addQuad(this.vertexData);
        } else {
            this.calculateTrimmedVertices();
            this._bounds.addQuad(this.vertexTrimmedData);
        }
    }

    getLocalBounds(rect) {
        if (this.children.length === 0) {
            if (!this._localBounds) {
                this._localBounds = new Bounds();
            }

            this._localBounds.minX = this._texture.orig.width * -this._anchor.x;
            this._localBounds.minY = this._texture.orig.height * -this._anchor.y;
            this._localBounds.maxX = this._texture.orig.width * (1 - this._anchor.x);
            this._localBounds.maxY = this._texture.orig.height * (1 - this._anchor.y);

            if (!rect) {
                if (!this._localBoundsRect) {
                    this._localBoundsRect = new Rectangle();
                }
                rect = this._localBoundsRect;
            }

            return this._localBounds.getRectangle(rect);
        }

        return super.getLocalBounds.call(this, rect);
    }

    containsPoint(point) {
        this.worldTransform.applyInverse(point, tempPoint);

        const width = this._texture.orig.width;
        const height = this._texture.orig.height;
        const x1 = -width * this.anchor.x;
        let y1 = 0;

        if (tempPoint.x >= x1 && tempPoint.x < x1 + width) {
            y1 = -height * this.anchor.y;
            if (tempPoint.y >= y1 && tempPoint.y < y1 + height) {
                return true;
            }
        }

        return false;
    }

    destroy(options) {
        super.destroy(options);

        this._texture.off('update', this._onTextureUpdate, this);
        this._anchor = null;

        const destroyTexture = typeof options === 'boolean' ? options : options?.texture;
        if (destroyTexture) {
            const destroyBaseTexture = typeof options === 'boolean' ? options : options?.baseTexture;
            this._texture.destroy(!!destroyBaseTexture);
        }

        this._texture = null;
    }

    static from(source, options) {
        const texture = source instanceof Texture ? source : Texture.from(source, options);
        return new Sprite(texture);
    }

    // プロパティ
    get roundPixels() {
        return this._roundPixels;
    }

    set roundPixels(value) {
        if (this._roundPixels !== value) {
            this._transformID = -1;
        }
        this._roundPixels = value;
    }

    get width() {
        return Math.abs(this.scale.x) * this._texture.orig.width;
    }

    set width(value) {
        const s = Math.sign(this.scale.x) || 1;
        this.scale.x = s * value / this._texture.orig.width;
        this._width = value;
    }

    get height() {
        return Math.abs(this.scale.y) * this._texture.orig.height;
    }

    set height(value) {
        const s = Math.sign(this.scale.y) || 1;
        this.scale.y = s * value / this._texture.orig.height;
        this._height = value;
    }

    get anchor() {
        return this._anchor;
    }

    set anchor(value) {
        this._anchor.copyFrom(value);
    }

    get tint() {
        return this._tintColor.value;
    }

    set tint(value) {
        this._tintColor.setValue(value);
        this._tintRGB = this._tintColor.toLittleEndianNumber();
    }

    get tintValue() {
        return this._tintColor.toNumber();
    }

    get texture() {
        return this._texture;
    }

    set texture(value) {
        if (this._texture === value) return;

        if (this._texture) {
            this._texture.off('update', this._onTextureUpdate, this);
        }

        this._texture = value || Texture.EMPTY;
        this._cachedTint = 0xFFFFFF;
        this._textureID = -1;
        this._textureTrimmedID = -1;

        if (value) {
            if (value.baseTexture.valid) {
                this._onTextureUpdate();
            } else {
                value.once('update', this._onTextureUpdate, this);
            }
        }
    }
}

// 一時的なポイント
const tempPoint = new Point();

// デフォルトエクスポート
export default {
    DisplayObject,
    Container,
    Sprite
};
