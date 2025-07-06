/**
 * Display Objects Module
 * DisplayObject、Container、Bounds関連のクラスを含む
 */

// Transform - 変換行列管理
class Transform {
    constructor() {
        this.worldTransform = new Float32Array(16);
        this.localTransform = new Float32Array(16);
        this.position = { x: 0, y: 0 };
        this.scale = { x: 1, y: 1 };
        this.pivot = { x: 0, y: 0 };
        this.skew = { x: 0, y: 0 };
        this.rotation = 0;
        this._parentID = -1;
        this._worldID = 0;
    }

    updateTransform(parentTransform) {
        const lt = this.localTransform;
        const wt = this.worldTransform;

        // ローカル変換行列の更新
        this.updateLocalTransform();

        // ワールド変換行列の更新
        if (parentTransform) {
            this.multiplyMatrix(wt, parentTransform, lt);
        } else {
            for (let i = 0; i < 16; i++) {
                wt[i] = lt[i];
            }
        }

        this._worldID++;
    }

    updateLocalTransform() {
        const lt = this.localTransform;
        const { x, y } = this.position;
        const { x: sx, y: sy } = this.scale;
        const { x: px, y: py } = this.pivot;
        const { x: skx, y: sky } = this.skew;
        const rot = this.rotation;

        // 2D変換行列の計算
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);

        lt[0] = cos * sx;
        lt[1] = sin * sx;
        lt[4] = -sin * sy;
        lt[5] = cos * sy;
        lt[12] = x - (px * lt[0] + py * lt[4]);
        lt[13] = y - (px * lt[1] + py * lt[5]);
        lt[15] = 1;
    }

    multiplyMatrix(out, a, b) {
        // 4x4行列の乗算
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
        const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
        const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
        const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

        out[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
        out[1] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
        out[12] = a00 * b12 + a01 * b22 + a02 * b32 + a03 * b33;
        out[13] = a10 * b12 + a11 * b22 + a12 * b32 + a13 * b33;
        // 他の要素も同様に計算...
    }

    apply(pos, newPos) {
        const wt = this.worldTransform;
        const x = pos.x;
        const y = pos.y;

        newPos = newPos || { x: 0, y: 0 };
        newPos.x = wt[0] * x + wt[4] * y + wt[12];
        newPos.y = wt[1] * x + wt[5] * y + wt[13];

        return newPos;
    }

    applyInverse(pos, newPos) {
        const wt = this.worldTransform;
        const id = 1 / (wt[0] * wt[5] - wt[1] * wt[4]);
        const x = pos.x;
        const y = pos.y;

        newPos = newPos || { x: 0, y: 0 };
        newPos.x = wt[5] * id * x + -wt[4] * id * y + (wt[13] * wt[4] - wt[12] * wt[5]) * id;
        newPos.y = wt[0] * id * y + -wt[1] * id * x + (-wt[13] * wt[0] + wt[12] * wt[1]) * id;

        return newPos;
    }
}

// Bounds - 境界ボックス管理
class Bounds {
    constructor() {
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
        this.rect = null;
        this.updateID = -1;
    }

    isEmpty() {
        return this.minX > this.maxX || this.minY > this.maxY;
    }

    clear() {
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
    }

    getRectangle(rect) {
        if (this.minX > this.maxX || this.minY > this.maxY) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }

        rect = rect || { x: 0, y: 0, width: 1, height: 1 };
        rect.x = this.minX;
        rect.y = this.minY;
        rect.width = this.maxX - this.minX;
        rect.height = this.maxY - this.minY;

        return rect;
    }

    addPoint(point) {
        this.minX = Math.min(this.minX, point.x);
        this.maxX = Math.max(this.maxX, point.x);
        this.minY = Math.min(this.minY, point.y);
        this.maxY = Math.max(this.maxY, point.y);
    }

    addBounds(bounds) {
        const minX = this.minX;
        const minY = this.minY;
        const maxX = this.maxX;
        const maxY = this.maxY;

        this.minX = bounds.minX < minX ? bounds.minX : minX;
        this.minY = bounds.minY < minY ? bounds.minY : minY;
        this.maxX = bounds.maxX > maxX ? bounds.maxX : maxX;
        this.maxY = bounds.maxY > maxY ? bounds.maxY : maxY;
    }

    addFrameMatrix(transform, x0, y0, x1, y1) {
        const matrix = transform.worldTransform;
        const a = matrix[0];
        const b = matrix[1];
        const c = matrix[4];
        const d = matrix[5];
        const tx = matrix[12];
        const ty = matrix[13];

        let minX = this.minX;
        let minY = this.minY;
        let maxX = this.maxX;
        let maxY = this.maxY;

        // 四角形の四隅を変換
        let x = a * x0 + c * y0 + tx;
        let y = b * x0 + d * y0 + ty;
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;

        x = a * x1 + c * y0 + tx;
        y = b * x1 + d * y0 + ty;
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;

        x = a * x0 + c * y1 + tx;
        y = b * x0 + d * y1 + ty;
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;

        x = a * x1 + c * y1 + tx;
        y = b * x1 + d * y1 + ty;
        minX = x < minX ? x : minX;
        minY = y < minY ? y : minY;
        maxX = x > maxX ? x : maxX;
        maxY = y > maxY ? y : maxY;

        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    pad(paddingX = 0, paddingY = paddingX) {
        if (!this.isEmpty()) {
            this.minX -= paddingX;
            this.maxX += paddingX;
            this.minY -= paddingY;
            this.maxY += paddingY;
        }
    }
}

// EventEmitter - イベント管理
class EventEmitter {
    constructor() {
        this._events = {};
    }

    on(event, fn, context) {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push({ fn, context });
        return this;
    }

    off(event, fn, context) {
        if (!this._events[event]) return this;

        const listeners = this._events[event];
        for (let i = listeners.length - 1; i >= 0; i--) {
            const listener = listeners[i];
            if (listener.fn === fn && listener.context === context) {
                listeners.splice(i, 1);
                break;
            }
        }

        return this;
    }

    emit(event, ...args) {
        if (!this._events[event]) return this;

        const listeners = this._events[event].slice();
        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            if (listener.context) {
                listener.fn.apply(listener.context, args);
            } else {
                listener.fn(...args);
            }
        }

        return this;
    }

    removeAllListeners(event) {
        if (event) {
            delete this._events[event];
        } else {
            this._events = {};
        }
        return this;
    }
}

// DisplayObject - 表示オブジェクトの基底クラス
class DisplayObject extends EventEmitter {
    constructor() {
        super();
        this.tempDisplayObjectParent = null;
        this.transform = new Transform();
        this.alpha = 1;
        this.visible = true;
        this.renderable = true;
        this.cullable = false;
        this.cullArea = null;
        this.parent = null;
        this.worldAlpha = 1;
        this._lastSortedIndex = 0;
        this._zIndex = 0;
        this.filterArea = null;
        this.filters = null;
        this._enabledFilters = null;
        this._bounds = new Bounds();
        this._localBounds = null;
        this._boundsID = 0;
        this._boundsRect = null;
        this._localBoundsRect = null;
        this._mask = null;
        this._maskRefCount = 0;
        this._destroyed = false;
        this.isSprite = false;
        this.isMask = false;
    }

    get destroyed() {
        return this._destroyed;
    }

    updateTransform() {
        this._boundsID++;
        this.transform.updateTransform(this.parent ? this.parent.transform : null);
        this.worldAlpha = this.alpha * (this.parent ? this.parent.worldAlpha : 1);
    }

    getBounds(skipUpdate, rect) {
        if (!skipUpdate) {
            if (this.parent) {
                this._recursivePostUpdateTransform();
                this.updateTransform();
            } else {
                this.parent = this._tempDisplayObjectParent;
                this.updateTransform();
                this.parent = null;
            }
        }

        if (this._bounds.updateID !== this._boundsID) {
            this.calculateBounds();
            this._bounds.updateID = this._boundsID;
        }

        if (!rect) {
            if (!this._boundsRect) {
                this._boundsRect = { x: 0, y: 0, width: 0, height: 0 };
            }
            rect = this._boundsRect;
        }

        return this._bounds.getRectangle(rect);
    }

    getLocalBounds(rect) {
        if (!rect) {
            if (!this._localBoundsRect) {
                this._localBoundsRect = { x: 0, y: 0, width: 0, height: 0 };
            }
            rect = this._localBoundsRect;
        }

        if (!this._localBounds) {
            this._localBounds = new Bounds();
        }

        const tempParent = this.parent;
        this.parent = null;

        const tempBounds = this._bounds;
        const tempBoundsID = this._boundsID;
        this._bounds = this._localBounds;

        const result = this.getBounds(false, rect);

        this.parent = tempParent;
        this._bounds = tempBounds;
        this._bounds.updateID += this._boundsID - tempBoundsID;

        return result;
    }

    calculateBounds() {
        // サブクラスで実装
    }

    _recursivePostUpdateTransform() {
        if (this.parent) {
            this.parent._recursivePostUpdateTransform();
            this.transform.updateTransform(this.parent.transform);
        } else {
            this.transform.updateTransform(this._tempDisplayObjectParent.transform);
        }
    }

    get _tempDisplayObjectParent() {
        if (this.tempDisplayObjectParent === null) {
            this.tempDisplayObjectParent = new TempDisplayObjectParent();
        }
        return this.tempDisplayObjectParent;
    }

    toGlobal(position, point, skipUpdate = false) {
        if (!skipUpdate) {
            this._recursivePostUpdateTransform();
            if (this.parent) {
                this.updateTransform();
            } else {
                this.parent = this._tempDisplayObjectParent;
                this.updateTransform();
                this.parent = null;
            }
        }

        return this.transform.apply(position, point);
    }

    toLocal(position, from, point, skipUpdate) {
        if (from) {
            position = from.toGlobal(position, point, skipUpdate);
        }

        if (!skipUpdate) {
            this._recursivePostUpdateTransform();
            if (this.parent) {
                this.updateTransform();
            } else {
                this.parent = this._tempDisplayObjectParent;
                this.updateTransform();
                this.parent = null;
            }
        }

        return this.transform.applyInverse(position, point);
    }

    setParent(container) {
        if (!container || !container.addChild) {
            throw new Error('setParent: Argument must be a Container');
        }
        return container.addChild(this);
    }

    removeFromParent() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }

    render(renderer) {
        // サブクラスで実装
    }

    destroy(options) {
        this.removeFromParent();
        this._destroyed = true;
        this.transform = null;
        this.parent = null;
        this._bounds = null;
        this.mask = null;
        this.cullArea = null;
        this.filters = null;
        this.filterArea = null;
        this.emit('destroyed');
        this.removeAllListeners();
    }

    // プロパティのゲッター/セッター
    get x() { return this.transform.position.x; }
    set x(value) { this.transform.position.x = value; }

    get y() { return this.transform.position.y; }
    set y(value) { this.transform.position.y = value; }

    get position() { return this.transform.position; }
    set position(value) { this.transform.position = value; }

    get scale() { return this.transform.scale; }
    set scale(value) { this.transform.scale = value; }

    get pivot() { return this.transform.pivot; }
    set pivot(value) { this.transform.pivot = value; }

    get rotation() { return this.transform.rotation; }
    set rotation(value) { this.transform.rotation = value; }

    get zIndex() { return this._zIndex; }
    set zIndex(value) {
        this._zIndex = value;
        if (this.parent) {
            this.parent.sortDirty = true;
        }
    }

    get mask() { return this._mask; }
    set mask(value) {
        if (this._mask !== value) {
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
    }
}

// TempDisplayObjectParent - 一時的な親オブジェクト
class TempDisplayObjectParent extends DisplayObject {
    constructor() {
        super();
        this.sortDirty = null;
    }
}

// Container - 子オブジェクトを持つコンテナ
class Container extends DisplayObject {
    constructor() {
        super();
        this.children = [];
        this.sortableChildren = false;
        this.sortDirty = false;
    }

    onChildrenChange(childIndex) {
        // サブクラスで実装可能
    }

    addChild(...children) {
        if (children.length > 1) {
            for (let i = 0; i < children.length; i++) {
                this.addChild(children[i]);
            }
        } else {
            const child = children[0];

            if (child.parent) {
                child.parent.removeChild(child);
            }

            child.parent = this;
            this.sortDirty = true;
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
            throw new Error(`addChildAt: The index ${index} supplied is out of bounds ${this.children.length}`);
        }

        if (child.parent) {
            child.parent.removeChild(child);
        }

        child.parent = this;
        this.sortDirty = true;
        child.transform._parentID = -1;
        this.children.splice(index, 0, child);
        this._boundsID++;

        this.onChildrenChange(index);
        child.emit('added', this);
        this.emit('childAdded', child, this, index);

        return child;
    }

    removeChild(...children) {
        if (children.length > 1) {
            for (let i = 0; i < children.length; i++) {
                this.removeChild(children[i]);
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

    getChildAt(index) {
        if (index < 0 || index >= this.children.length) {
            throw new Error(`getChildAt: Index (${index}) does not exist.`);
        }
        return this.children[index];
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

    swapChildren(child1, child2) {
        if (child1 === child2) return;

        const index1 = this.getChildIndex(child1);
        const index2 = this.getChildIndex(child2);

        this.children[index1] = child2;
        this.children[index2] = child1;
        this.onChildrenChange(index1 < index2 ? index1 : index2);
    }

    removeChildren(beginIndex = 0, endIndex = this.children.length) {
        const begin = beginIndex;
        const end = endIndex;
        const range = end - begin;

        if (range > 0 && range <= end) {
            const removed = this.children.splice(begin, range);

            for (let i = 0; i < removed.length; ++i) {
                removed[i].parent = null;
                if (removed[i].transform) {
                    removed[i].transform._parentID = -1;
                }
            }

            this._boundsID++;
            this.onChildrenChange(beginIndex);

            for (let i = 0; i < removed.length; ++i) {
                removed[i].emit('removed', this);
                this.emit('childRemoved', removed[i], this, i);
            }

            return removed;
        } else if (range === 0 && this.children.length === 0) {
            return [];
        }

        throw new RangeError('removeChildren: numeric values are outside the acceptable range.');
    }

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
            this.children.sort((a, b) => {
                if (a.zIndex === b.zIndex) {
                    return a._lastSortedIndex - b._lastSortedIndex;
                }
                return a.zIndex - b.zIndex;
            });
        }

        this.sortDirty = false;
    }

    updateTransform() {
        if (this.sortableChildren && this.sortDirty) {
            this.sortChildren();
        }

        this._boundsID++;
        this.transform.updateTransform(this.parent ? this.parent.transform : null);
        this.worldAlpha = this.alpha * (this.parent ? this.parent.worldAlpha : 1);

        for (let i = 0, j = this.children.length; i < j; ++i) {
            const child = this.children[i];
            if (child.visible) {
                child.updateTransform();
            }
        }
    }

    calculateBounds() {
        this._bounds.clear();
        this._calculateBounds();

        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];

            if (!child.visible || !child.renderable) continue;

            child.calculateBounds();

            if (child._mask) {
                const maskObject = child._mask.isMaskData ? child._mask.maskObject : child._mask;
                if (maskObject) {
                    maskObject.calculateBounds();
                    this._bounds.addBoundsMask(child._bounds, maskObject._bounds);
                } else {
                    this._bounds.addBounds(child._bounds);
                }
            } else if (child.filterArea) {
                this._bounds.addBoundsArea(child._bounds, child.filterArea);
            } else {
                this._bounds.addBounds(child._bounds);
            }
        }

        this._bounds.updateID = this._boundsID;
    }

    _calculateBounds() {
        // サブクラスで実装
    }

    render(renderer) {
        if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
            return;
        }

        if (this._mask || (this.filters && this.filters.length)) {
            this.renderAdvanced(renderer);
        } else {
            this._render(renderer);

            for (let i = 0, j = this.children.length; i < j; ++i) {
                this.children[i].render(renderer);
            }
        }
    }

    renderAdvanced(renderer) {
        // マスクやフィルターを使用したレンダリング
        // 実装は複雑なので簡略化
        this._render(renderer);

        for (let i = 0, j = this.children.length; i < j; ++i) {
            this.children[i].render(renderer);
        }
    }

    _render(renderer) {
        // サブクラスで実装
    }

    destroy(options) {
        super.destroy(options);

        this.sortDirty = false;

        const destroyChildren = options && options.children;
        if (destroyChildren) {
            for (let i = this.children.length - 1; i >= 0; --i) {
                this.children[i].destroy(options);
            }
        }

        this.removeChildren();
        this.children = null;
    }
}

// エクスポート
export {
    Transform,
    Bounds,
    EventEmitter,
    DisplayObject,
    Container,
    TempDisplayObjectParent
};

// デフォルトエクスポート
export default {
    Transform,
    Bounds,
    EventEmitter,
    DisplayObject,
    Container,
    TempDisplayObjectParent
};
