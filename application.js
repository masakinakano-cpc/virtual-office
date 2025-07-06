// Application Module - アプリケーション管理とシステム統合
// メインアプリケーション、イベント、アクセシビリティを提供

import { Container } from './sprites.js';
import { Renderer } from './webgl.js';
import { EventEmitter } from './display.js';

// アプリケーションクラス
export class Application {
    constructor(options = {}) {
        this.stage = new Container();

        options = Object.assign({
            forceCanvas: false
        }, options);

        this.renderer = this.createRenderer(options);

        // プラグインの初期化
        Application._plugins.forEach(plugin => {
            plugin.init.call(this, options);
        });
    }

    createRenderer(options) {
        // レンダラーの作成（簡略化）
        return new Renderer(options);
    }

    render() {
        this.renderer.render(this.stage);
    }

    get view() {
        return this.renderer?.view;
    }

    get screen() {
        return this.renderer?.screen;
    }

    destroy(removeView, stageOptions) {
        const plugins = Application._plugins.slice(0);
        plugins.reverse();

        plugins.forEach(plugin => {
            plugin.destroy.call(this);
        });

        this.stage.destroy(stageOptions);
        this.stage = null;
        this.renderer.destroy(removeView);
        this.renderer = null;
    }

    static _plugins = [];
}

// リサイズプラグイン
export class ResizePlugin {
    static extension = 'Application';

    static init(options) {
        Object.defineProperty(this, 'resizeTo', {
            set(element) {
                globalThis.removeEventListener('resize', this.queueResize);
                this._resizeTo = element;
                if (element) {
                    globalThis.addEventListener('resize', this.queueResize);
                    this.resize();
                }
            },
            get() {
                return this._resizeTo;
            }
        });

        this.queueResize = () => {
            if (this._resizeTo) {
                this.cancelResize();
                this._resizeId = requestAnimationFrame(() => this.resize());
            }
        };

        this.cancelResize = () => {
            if (this._resizeId) {
                cancelAnimationFrame(this._resizeId);
                this._resizeId = null;
            }
        };

        this.resize = () => {
            if (!this._resizeTo) return;

            this.cancelResize();
            let width, height;

            if (this._resizeTo === globalThis.window) {
                width = globalThis.innerWidth;
                height = globalThis.innerHeight;
            } else {
                const { clientWidth, clientHeight } = this._resizeTo;
                width = clientWidth;
                height = clientHeight;
            }

            this.renderer.resize(width, height);
            this.render();
        };

        this._resizeId = null;
        this._resizeTo = null;
        this.resizeTo = options.resizeTo || null;
    }

    static destroy() {
        globalThis.removeEventListener('resize', this.queueResize);
        this.cancelResize();
        this.cancelResize = null;
        this.queueResize = null;
        this.resizeTo = null;
        this.resize = null;
    }
}

// 抽出システム
export class Extract {
    constructor(renderer) {
        this.renderer = renderer;
        this._rendererPremultipliedAlpha = false;
    }

    contextChange() {
        const attributes = this.renderer?.gl.getContextAttributes();
        this._rendererPremultipliedAlpha = !!(attributes && attributes.alpha && attributes.premultipliedAlpha);
    }

    async image(target, format, quality, frame) {
        const base64 = await this.base64(target, format, quality, frame);
        const img = new Image();
        img.src = base64;
        return img;
    }

    async base64(target, format, quality, frame) {
        const canvas = this.canvas(target, frame);

        if (canvas.toBlob !== undefined) {
            return new Promise((resolve, reject) => {
                canvas.toBlob(blob => {
                    if (!blob) {
                        reject(new Error('Canvas.toBlob failed!'));
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                }, format, quality);
            });
        }

        if (canvas.toDataURL !== undefined) {
            return canvas.toDataURL(format, quality);
        }

        throw new Error('Extract.base64() requires Canvas.toDataURL or Canvas.toBlob');
    }

    canvas(target, frame) {
        const { pixels, width, height, flipY, premultipliedAlpha } = this._rawPixels(target, frame);

        if (flipY) {
            Extract._flipY(pixels, width, height);
        }

        if (premultipliedAlpha) {
            Extract._unpremultiplyAlpha(pixels);
        }

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;

        const imageData = new ImageData(new Uint8ClampedArray(pixels.buffer), width, height);
        context.putImageData(imageData, 0, 0);

        return canvas;
    }

    pixels(target, frame) {
        const { pixels, width, height, flipY, premultipliedAlpha } = this._rawPixels(target, frame);

        if (flipY) {
            Extract._flipY(pixels, width, height);
        }

        if (premultipliedAlpha) {
            Extract._unpremultiplyAlpha(pixels);
        }

        return pixels;
    }

    _rawPixels(target, frame) {
        if (!this.renderer) {
            throw new Error('Extract has been destroyed');
        }

        let resolution = 1;
        let flipY = false;
        let premultipliedAlpha = false;
        let renderTexture;
        let generated = false;

        if (target) {
            if (target instanceof RenderTexture) {
                renderTexture = target;
            } else {
                renderTexture = this.renderer.generateTexture(target, {
                    region: frame,
                    resolution: this.renderer.resolution,
                    multisample: this.renderer.multisample
                });
                generated = true;
            }
        }

        const gl = this.renderer.gl;

        if (renderTexture) {
            resolution = renderTexture.baseTexture.resolution;
            frame = frame ?? renderTexture.frame;
            flipY = false;
            premultipliedAlpha = renderTexture.baseTexture.alphaMode > 0;

            if (!generated) {
                this.renderer.renderTexture.bind(renderTexture);
            }
        } else {
            resolution = this.renderer.resolution;
            if (!frame) {
                frame = { x: 0, y: 0, width: this.renderer.width / resolution, height: this.renderer.height / resolution };
            }
            flipY = true;
            premultipliedAlpha = this._rendererPremultipliedAlpha;
            this.renderer.renderTexture.bind();
        }

        const width = Math.max(Math.round(frame.width * resolution), 1);
        const height = Math.max(Math.round(frame.height * resolution), 1);
        const pixels = new Uint8Array(4 * width * height);

        gl.readPixels(
            Math.round(frame.x * resolution),
            Math.round(frame.y * resolution),
            width,
            height,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixels
        );

        if (generated) {
            renderTexture?.destroy(true);
        }

        return { pixels, width, height, flipY, premultipliedAlpha };
    }

    static _flipY(pixels, width, height) {
        const bytesPerRow = width << 2;
        const halfHeight = height >> 1;
        const temp = new Uint8Array(bytesPerRow);

        for (let y = 0; y < halfHeight; y++) {
            const topRowOffset = y * bytesPerRow;
            const bottomRowOffset = (height - y - 1) * bytesPerRow;

            temp.set(pixels.subarray(topRowOffset, topRowOffset + bytesPerRow));
            pixels.copyWithin(topRowOffset, bottomRowOffset, bottomRowOffset + bytesPerRow);
            pixels.set(temp, bottomRowOffset);
        }
    }

    static _unpremultiplyAlpha(pixels) {
        if (pixels instanceof Uint8ClampedArray) {
            pixels = new Uint8Array(pixels.buffer);
        }

        const length = pixels.length;
        for (let i = 0; i < length; i += 4) {
            const alpha = pixels[i + 3];
            if (alpha !== 0) {
                const invAlpha = 255.001 / alpha;
                pixels[i] = (pixels[i] * invAlpha + 0.5);
                pixels[i + 1] = (pixels[i + 1] * invAlpha + 0.5);
                pixels[i + 2] = (pixels[i + 2] * invAlpha + 0.5);
            }
        }
    }

    destroy() {
        this.renderer = null;
    }

    static extension = {
        name: 'extract',
        type: 'RendererSystem'
    };
}

// イベントシステム
export class EventSystem {
    constructor(renderer) {
        this.supportsTouchEvents = 'ontouchstart' in globalThis;
        this.supportsPointerEvents = !!globalThis.PointerEvent;
        this.domElement = null;
        this.resolution = 1;
        this.renderer = renderer;
        this.rootBoundary = new EventBoundary(null);
        this.autoPreventDefault = true;
        this.eventsAdded = false;
        this.cursorStyles = {
            default: 'inherit',
            pointer: 'pointer'
        };

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        this.onPointerOverOut = this.onPointerOverOut.bind(this);
        this.onWheel = this.onWheel.bind(this);
    }

    init(options) {
        const { view, resolution } = this.renderer;
        this.setTargetElement(view);
        this.resolution = resolution;

        Object.assign(this.features, options.eventFeatures ?? {});
        this.rootBoundary.enableGlobalMoveEvents = this.features.globalMove;
    }

    setCursor(cursor = 'default') {
        if (this.currentCursor === cursor) return;
        this.currentCursor = cursor;

        const cursorStyle = this.cursorStyles[cursor];
        if (cursorStyle) {
            if (typeof cursorStyle === 'string') {
                this.domElement.style.cursor = cursorStyle;
            } else if (typeof cursorStyle === 'function') {
                cursorStyle(cursor);
            } else if (typeof cursorStyle === 'object') {
                Object.assign(this.domElement.style, cursorStyle);
            }
        } else if (typeof cursor === 'string') {
            this.domElement.style.cursor = cursor;
        }
    }

    onPointerDown(event) {
        if (!this.features.click) return;
        this.rootBoundary.rootTarget = this.renderer.lastObjectRendered;
        const normalizedEvents = this.normalizeToPointerData(event);

        if (this.autoPreventDefault && normalizedEvents[0].isNormalized) {
            event.preventDefault();
        }

        for (const normalizedEvent of normalizedEvents) {
            const pixiEvent = this.bootstrapEvent(normalizedEvent);
            this.rootBoundary.mapEvent(pixiEvent);
        }

        this.setCursor(this.rootBoundary.cursor);
    }

    onPointerMove(event) {
        if (!this.features.move) return;
        this.rootBoundary.rootTarget = this.renderer.lastObjectRendered;

        const normalizedEvents = this.normalizeToPointerData(event);
        for (const normalizedEvent of normalizedEvents) {
            const pixiEvent = this.bootstrapEvent(normalizedEvent);
            this.rootBoundary.mapEvent(pixiEvent);
        }

        this.setCursor(this.rootBoundary.cursor);
    }

    onPointerUp(event) {
        if (!this.features.click) return;
        this.rootBoundary.rootTarget = this.renderer.lastObjectRendered;

        let target = event.target;
        if (event.composedPath && event.composedPath().length > 0) {
            target = event.composedPath()[0];
        }

        const outside = target !== this.domElement ? 'outside' : '';
        const normalizedEvents = this.normalizeToPointerData(event);

        for (const normalizedEvent of normalizedEvents) {
            const pixiEvent = this.bootstrapEvent(normalizedEvent);
            pixiEvent.type += outside;
            this.rootBoundary.mapEvent(pixiEvent);
        }

        this.setCursor(this.rootBoundary.cursor);
    }

    onPointerOverOut(event) {
        if (!this.features.click) return;
        this.rootBoundary.rootTarget = this.renderer.lastObjectRendered;

        const normalizedEvents = this.normalizeToPointerData(event);
        for (const normalizedEvent of normalizedEvents) {
            const pixiEvent = this.bootstrapEvent(normalizedEvent);
            this.rootBoundary.mapEvent(pixiEvent);
        }

        this.setCursor(this.rootBoundary.cursor);
    }

    onWheel(event) {
        if (!this.features.wheel) return;
        const wheelEvent = this.normalizeWheelEvent(event);
        this.rootBoundary.rootTarget = this.renderer.lastObjectRendered;
        this.rootBoundary.mapEvent(wheelEvent);
    }

    setTargetElement(element) {
        this.removeEvents();
        this.domElement = element;
        this.addEvents();
    }

    addEvents() {
        if (this.eventsAdded || !this.domElement) return;

        const style = this.domElement.style;
        if (style) {
            if (this.supportsPointerEvents) {
                style.touchAction = 'none';
            }
        }

        if (this.supportsPointerEvents) {
            globalThis.document.addEventListener('pointermove', this.onPointerMove, true);
            this.domElement.addEventListener('pointerdown', this.onPointerDown, true);
            this.domElement.addEventListener('pointerleave', this.onPointerOverOut, true);
            this.domElement.addEventListener('pointerover', this.onPointerOverOut, true);
            globalThis.addEventListener('pointerup', this.onPointerUp, true);
        } else {
            globalThis.document.addEventListener('mousemove', this.onPointerMove, true);
            this.domElement.addEventListener('mousedown', this.onPointerDown, true);
            this.domElement.addEventListener('mouseout', this.onPointerOverOut, true);
            this.domElement.addEventListener('mouseover', this.onPointerOverOut, true);
            globalThis.addEventListener('mouseup', this.onPointerUp, true);

            if (this.supportsTouchEvents) {
                this.domElement.addEventListener('touchstart', this.onPointerDown, true);
                this.domElement.addEventListener('touchend', this.onPointerUp, true);
                this.domElement.addEventListener('touchmove', this.onPointerMove, true);
            }
        }

        this.domElement.addEventListener('wheel', this.onWheel, { passive: true, capture: true });
        this.eventsAdded = true;
    }

    removeEvents() {
        if (!this.eventsAdded || !this.domElement) return;

        if (this.supportsPointerEvents) {
            globalThis.document.removeEventListener('pointermove', this.onPointerMove, true);
            this.domElement.removeEventListener('pointerdown', this.onPointerDown, true);
            this.domElement.removeEventListener('pointerleave', this.onPointerOverOut, true);
            this.domElement.removeEventListener('pointerover', this.onPointerOverOut, true);
            globalThis.removeEventListener('pointerup', this.onPointerUp, true);
        } else {
            globalThis.document.removeEventListener('mousemove', this.onPointerMove, true);
            this.domElement.removeEventListener('mousedown', this.onPointerDown, true);
            this.domElement.removeEventListener('mouseout', this.onPointerOverOut, true);
            this.domElement.removeEventListener('mouseover', this.onPointerOverOut, true);
            globalThis.removeEventListener('mouseup', this.onPointerUp, true);

            if (this.supportsTouchEvents) {
                this.domElement.removeEventListener('touchstart', this.onPointerDown, true);
                this.domElement.removeEventListener('touchend', this.onPointerUp, true);
                this.domElement.removeEventListener('touchmove', this.onPointerMove, true);
            }
        }

        this.domElement.removeEventListener('wheel', this.onWheel, true);
        this.domElement = null;
        this.eventsAdded = false;
    }

    normalizeToPointerData(event) {
        const normalized = [];

        if (this.supportsTouchEvents && event instanceof TouchEvent) {
            for (const touch of event.changedTouches) {
                this.normalizeTouch(touch, event);
                normalized.push(touch);
            }
        } else {
            this.normalizeMouse(event);
            normalized.push(event);
        }

        return normalized;
    }

    normalizeTouch(touch, event) {
        touch.button = touch.button ?? 0;
        touch.buttons = touch.buttons ?? 1;
        touch.isPrimary = touch.isPrimary ?? (event.touches.length === 1 && event.type === 'touchstart');
        touch.width = touch.width ?? touch.radiusX ?? 1;
        touch.height = touch.height ?? touch.radiusY ?? 1;
        touch.tiltX = touch.tiltX ?? 0;
        touch.tiltY = touch.tiltY ?? 0;
        touch.pointerType = touch.pointerType ?? 'touch';
        touch.pointerId = touch.pointerId ?? touch.identifier ?? 0;
        touch.pressure = touch.pressure ?? touch.force ?? 0.5;
        touch.twist = touch.twist ?? 0;
        touch.tangentialPressure = touch.tangentialPressure ?? 0;
        touch.isNormalized = true;
        touch.type = event.type;
    }

    normalizeMouse(event) {
        event.isPrimary = event.isPrimary ?? true;
        event.width = event.width ?? 1;
        event.height = event.height ?? 1;
        event.tiltX = event.tiltX ?? 0;
        event.tiltY = event.tiltY ?? 0;
        event.pointerType = event.pointerType ?? 'mouse';
        event.pointerId = event.pointerId ?? 1;
        event.pressure = event.pressure ?? 0.5;
        event.twist = event.twist ?? 0;
        event.tangentialPressure = event.tangentialPressure ?? 0;
        event.isNormalized = true;
    }

    bootstrapEvent(nativeEvent) {
        const event = new PixiEvent();
        event.nativeEvent = nativeEvent;
        event.pointerId = nativeEvent.pointerId;
        event.width = nativeEvent.width;
        event.height = nativeEvent.height;
        event.isPrimary = nativeEvent.isPrimary;
        event.pointerType = nativeEvent.pointerType;
        event.pressure = nativeEvent.pressure;
        event.tangentialPressure = nativeEvent.tangentialPressure;
        event.tiltX = nativeEvent.tiltX;
        event.tiltY = nativeEvent.tiltY;
        event.twist = nativeEvent.twist;

        this.transferMouseData(event, nativeEvent);
        this.mapPositionToPoint(event.screen, nativeEvent.clientX, nativeEvent.clientY);
        event.global.copyFrom(event.screen);
        event.offset.copyFrom(event.screen);
        event.isTrusted = nativeEvent.isTrusted;
        event.type = nativeEvent.type;

        return event;
    }

    transferMouseData(event, nativeEvent) {
        event.isTrusted = nativeEvent.isTrusted;
        event.timeStamp = performance.now();
        event.type = nativeEvent.type;
        event.altKey = nativeEvent.altKey;
        event.button = nativeEvent.button;
        event.buttons = nativeEvent.buttons;
        event.client.x = nativeEvent.clientX;
        event.client.y = nativeEvent.clientY;
        event.ctrlKey = nativeEvent.ctrlKey;
        event.metaKey = nativeEvent.metaKey;
        event.movement.x = nativeEvent.movementX;
        event.movement.y = nativeEvent.movementY;
        event.page.x = nativeEvent.pageX;
        event.page.y = nativeEvent.pageY;
        event.shiftKey = nativeEvent.shiftKey;
    }

    mapPositionToPoint(point, x, y) {
        const rect = this.domElement.isConnected ?
            this.domElement.getBoundingClientRect() :
            { width: this.domElement.width, height: this.domElement.height, left: 0, top: 0 };

        const resolution = 1 / this.resolution;
        point.x = (x - rect.left) * (this.domElement.width / rect.width) * resolution;
        point.y = (y - rect.top) * (this.domElement.height / rect.height) * resolution;
    }

    destroy() {
        this.setTargetElement(null);
        this.renderer = null;
    }

    static extension = {
        name: 'events',
        type: ['RendererSystem', 'CanvasRendererSystem']
    };
}

// 簡易イベントクラス
export class PixiEvent extends EventEmitter {
    constructor() {
        super();
        this.bubbles = true;
        this.cancelBubble = true;
        this.cancelable = false;
        this.composed = false;
        this.defaultPrevented = false;
        this.eventPhase = 0;
        this.propagationStopped = false;
        this.propagationImmediatelyStopped = false;
        this.client = { x: 0, y: 0 };
        this.movement = { x: 0, y: 0 };
        this.offset = { x: 0, y: 0 };
        this.global = { x: 0, y: 0 };
        this.screen = { x: 0, y: 0 };
        this.page = { x: 0, y: 0 };
    }

    preventDefault() {
        if (this.nativeEvent instanceof Event && this.nativeEvent.cancelable) {
            this.nativeEvent.preventDefault();
        }
        this.defaultPrevented = true;
    }

    stopImmediatePropagation() {
        this.propagationImmediatelyStopped = true;
    }

    stopPropagation() {
        this.propagationStopped = true;
    }
}

// 簡易イベント境界
export class EventBoundary {
    constructor(rootTarget) {
        this.rootTarget = rootTarget;
        this.cursor = null;
        this.enableGlobalMoveEvents = true;
    }

    mapEvent(event) {
        // 簡易的なイベントマッピング
        console.log('Event mapped:', event.type);
    }
}

// アクセシビリティマネージャー
export class AccessibilityManager {
    constructor(renderer) {
        this.debug = false;
        this._isActive = false;
        this._isMobileAccessibility = false;
        this.pool = [];
        this.renderId = 0;
        this.children = [];
        this.renderer = renderer;

        const div = document.createElement('div');
        div.style.width = '100px';
        div.style.height = '100px';
        div.style.position = 'absolute';
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.zIndex = '2';
        this.div = div;

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        globalThis.addEventListener('keydown', this._onKeyDown, false);
    }

    get isActive() {
        return this._isActive;
    }

    get isMobileAccessibility() {
        return this._isMobileAccessibility;
    }

    activate() {
        if (this._isActive) return;

        this._isActive = true;
        globalThis.document.addEventListener('mousemove', this._onMouseMove, true);
        globalThis.removeEventListener('keydown', this._onKeyDown, false);
        this.renderer.on('postrender', this.update, this);

        if (this.renderer.view.parentNode) {
            this.renderer.view.parentNode.appendChild(this.div);
        }
    }

    deactivate() {
        if (!this._isActive || this._isMobileAccessibility) return;

        this._isActive = false;
        globalThis.document.removeEventListener('mousemove', this._onMouseMove, true);
        globalThis.addEventListener('keydown', this._onKeyDown, false);
        this.renderer.off('postrender', this.update);

        if (this.div.parentNode) {
            this.div.parentNode.removeChild(this.div);
        }
    }

    update() {
        // アクセシビリティ要素の更新
        if (!this.renderer.renderingToScreen) return;

        // 簡易的な実装
        this.renderId++;
    }

    _onKeyDown(event) {
        if (event.keyCode === 9) { // Tab key
            this.activate();
        }
    }

    _onMouseMove(event) {
        if (event.movementX === 0 && event.movementY === 0) return;
        this.deactivate();
    }

    destroy() {
        this.div = null;
        globalThis.document.removeEventListener('mousemove', this._onMouseMove, true);
        globalThis.removeEventListener('keydown', this._onKeyDown);
        this.pool = null;
        this.children = null;
        this.renderer = null;
    }

    static extension = {
        name: 'accessibility',
        type: ['RendererPlugin', 'CanvasRendererPlugin']
    };
}

// プラグイン登録
Application._plugins.push(ResizePlugin);

// デフォルトエクスポート
export default {
    Application,
    ResizePlugin,
    Extract,
    EventSystem,
    AccessibilityManager,
    PixiEvent,
    EventBoundary
};
