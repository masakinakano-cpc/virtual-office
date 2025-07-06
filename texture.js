/**
 * Texture and Resource Module
 * テクスチャ、リソース、テクスチャシステム関連のクラスを含む
 */

// BaseResource - リソースの基底クラス
class BaseResource {
    constructor(width = 0, height = 0) {
        this.width = width;
        this.height = height;
        this.valid = false;
        this.destroyed = false;
        this._width = width;
        this._height = height;
        this.internal = false;
        this.onResize = { emit: () => { } };
        this.onUpdate = { emit: () => { } };
        this.onError = { emit: () => { } };
    }

    bind(baseTexture) {
        this.baseTexture = baseTexture;
    }

    unbind(baseTexture) {
        this.baseTexture = null;
    }

    resize(width, height) {
        if (this.width !== width || this.height !== height) {
            this.width = width;
            this.height = height;
            this.onResize.emit(width, height);
        }
    }

    update() {
        if (!this.destroyed) {
            this.onUpdate.emit();
        }
    }

    load() {
        return Promise.resolve(this);
    }

    upload(renderer, baseTexture, glTexture) {
        return false;
    }

    style(renderer, baseTexture, glTexture) {
        return false;
    }

    dispose() {
        this.destroyed = true;
    }

    destroy() {
        if (!this.destroyed) {
            this.dispose();
        }
    }

    get realWidth() {
        return this.width;
    }

    get realHeight() {
        return this.height;
    }
}

// ImageBitmapResource - ImageBitmap用リソース
class ImageBitmapResource extends BaseResource {
    constructor(source, options = {}) {
        const { width, height } = options;
        super(width || source.width, height || source.height);

        this.source = source;
        this.crossOrigin = options.crossOrigin ?? true;
        this.alphaMode = options.alphaMode ?? null;
        this.ownsImageBitmap = options.ownsImageBitmap ?? false;
        this._load = null;

        if (typeof source === 'string') {
            this.url = source;
            this.source = null;
            if (options.autoLoad !== false) {
                this.load();
            }
        } else {
            this.url = null;
            this.valid = true;
        }
    }

    async load() {
        if (this._load) return this._load;

        if (this.url === null) {
            return Promise.resolve(this);
        }

        this._load = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(this.url, {
                    mode: this.crossOrigin ? 'cors' : 'no-cors'
                });

                if (this.destroyed) return;

                const blob = await response.blob();
                if (this.destroyed) return;

                const bitmap = await createImageBitmap(blob, {
                    premultiplyAlpha: this.alphaMode === null ? 'premultiply' : 'none'
                });

                if (this.destroyed) {
                    bitmap.close();
                    return;
                }

                this.source = bitmap;
                this.valid = true;
                this.update();
                resolve(this);
            } catch (error) {
                if (this.destroyed) return;
                reject(error);
                this.onError.emit(error);
            }
        });

        return this._load;
    }

    upload(renderer, baseTexture, glTexture) {
        if (!(this.source instanceof ImageBitmap)) {
            this.load();
            return false;
        }

        const gl = renderer.gl;
        const { width, height } = this.source;

        glTexture.width = width;
        glTexture.height = height;

        gl.texImage2D(
            baseTexture.target,
            0,
            glTexture.internalFormat,
            baseTexture.format,
            glTexture.type,
            this.source
        );

        return true;
    }

    dispose() {
        if (this.ownsImageBitmap && this.source instanceof ImageBitmap) {
            this.source.close();
        }
        super.dispose();
        this._load = null;
    }

    static test(source) {
        return typeof createImageBitmap !== 'undefined' &&
            typeof ImageBitmap !== 'undefined' &&
            (typeof source === 'string' || source instanceof ImageBitmap);
    }
}

// VideoResource - Video用リソース
class VideoResource extends BaseResource {
    constructor(source, options = {}) {
        let videoElement;

        if (!(source instanceof HTMLVideoElement)) {
            videoElement = document.createElement('video');

            if (options.autoLoad !== false) {
                videoElement.setAttribute('preload', 'auto');
            }
            if (options.playsinline !== false) {
                videoElement.setAttribute('webkit-playsinline', '');
                videoElement.setAttribute('playsinline', '');
            }
            if (options.muted === true) {
                videoElement.setAttribute('muted', '');
                videoElement.muted = true;
            }
            if (options.loop === true) {
                videoElement.setAttribute('loop', '');
            }
            if (options.autoPlay !== false) {
                videoElement.setAttribute('autoplay', '');
            }

            const sources = Array.isArray(source) ? source : [source];
            sources.forEach(src => {
                const sourceElement = document.createElement('source');
                sourceElement.src = typeof src === 'string' ? src : src.src;
                if (src.type) sourceElement.type = src.type;
                videoElement.appendChild(sourceElement);
            });

            source = videoElement;
        }

        super(source.videoWidth || source.width, source.videoHeight || source.height);

        this.source = source;
        this.noSubImage = true;
        this._autoUpdate = true;
        this._isConnectedToTicker = false;
        this._updateFPS = options.updateFPS || 0;
        this._msToNextUpdate = 0;
        this.autoPlay = options.autoPlay !== false;
        this._load = null;
        this._resolve = null;
        this._reject = null;

        this._onCanPlay = this._onCanPlay.bind(this);
        this._onError = this._onError.bind(this);
        this._onPlayStart = this._onPlayStart.bind(this);
        this._onPlayStop = this._onPlayStop.bind(this);

        if (options.autoLoad !== false) {
            this.load();
        }
    }

    load() {
        if (this._load) return this._load;

        const source = this.source;

        if ((source.readyState === source.HAVE_ENOUGH_DATA ||
            source.readyState === source.HAVE_FUTURE_DATA) &&
            source.width && source.height) {
            source.complete = true;
        }

        source.addEventListener('play', this._onPlayStart);
        source.addEventListener('pause', this._onPlayStop);

        if (this._isSourceReady()) {
            this._onCanPlay();
        } else {
            source.addEventListener('canplay', this._onCanPlay);
            source.addEventListener('canplaythrough', this._onCanPlay);
            source.addEventListener('error', this._onError, true);
        }

        this._load = new Promise((resolve, reject) => {
            if (this.valid) {
                resolve(this);
            } else {
                this._resolve = resolve;
                this._reject = reject;
                source.load();
            }
        });

        return this._load;
    }

    _isSourceReady() {
        return this.source.readyState > 2;
    }

    _isSourcePlaying() {
        const source = this.source;
        return !source.paused && !source.ended && this._isSourceReady();
    }

    _onCanPlay() {
        const source = this.source;
        source.removeEventListener('canplay', this._onCanPlay);
        source.removeEventListener('canplaythrough', this._onCanPlay);

        const valid = this.valid;
        this.resize(source.videoWidth, source.videoHeight);

        if (!valid && this._resolve) {
            this._resolve(this);
            this._resolve = null;
            this._reject = null;
        }

        if (this._isSourcePlaying()) {
            this._onPlayStart();
        } else if (this.autoPlay) {
            source.play();
        }
    }

    _onError(error) {
        this.source.removeEventListener('error', this._onError, true);
        this.onError.emit(error);

        if (this._reject) {
            this._reject(error);
            this._reject = null;
            this._resolve = null;
        }
    }

    _onPlayStart() {
        if (!this.valid) this._onCanPlay();
    }

    _onPlayStop() {
        // 再生停止時の処理
    }

    upload(renderer, baseTexture, glTexture) {
        const gl = renderer.gl;
        const source = this.source;

        if (!this.valid) {
            return false;
        }

        const { videoWidth, videoHeight } = source;

        if (glTexture.width !== videoWidth || glTexture.height !== videoHeight) {
            glTexture.width = videoWidth;
            glTexture.height = videoHeight;

            gl.texImage2D(
                baseTexture.target,
                0,
                glTexture.internalFormat,
                baseTexture.format,
                glTexture.type,
                source
            );
        } else {
            gl.texSubImage2D(
                baseTexture.target,
                0,
                0,
                0,
                baseTexture.format,
                glTexture.type,
                source
            );
        }

        return true;
    }

    dispose() {
        const source = this.source;

        if (source) {
            source.removeEventListener('play', this._onPlayStart);
            source.removeEventListener('pause', this._onPlayStop);
            source.removeEventListener('canplay', this._onCanPlay);
            source.removeEventListener('canplaythrough', this._onCanPlay);
            source.removeEventListener('error', this._onError, true);
            source.pause();
            source.src = '';
            source.load();
        }

        super.dispose();
    }

    static test(source) {
        return (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) ||
            (typeof source === 'string' && source.match(/\.(mp4|webm|ogg|ogv|m4v|avi|mov)$/i));
    }
}

// CanvasResource - Canvas用リソース
class CanvasResource extends BaseResource {
    constructor(source) {
        super(source.width, source.height);
        this.source = source;
        this.valid = true;
    }

    upload(renderer, baseTexture, glTexture) {
        const gl = renderer.gl;
        const source = this.source;

        glTexture.width = source.width;
        glTexture.height = source.height;

        gl.texImage2D(
            baseTexture.target,
            0,
            glTexture.internalFormat,
            baseTexture.format,
            glTexture.type,
            source
        );

        return true;
    }

    static test(source) {
        const { OffscreenCanvas } = globalThis;
        return (OffscreenCanvas && source instanceof OffscreenCanvas) ||
            (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement);
    }
}

// SVGResource - SVG用リソース
class SVGResource extends BaseResource {
    constructor(source, options = {}) {
        super();

        this.svg = source;
        this.scale = options.scale || 1;
        this._overrideWidth = options.width;
        this._overrideHeight = options.height;
        this._resolve = null;
        this._crossorigin = options.crossorigin;
        this._load = null;

        if (options.autoLoad !== false) {
            this.load();
        }
    }

    load() {
        if (this._load) return this._load;

        this._load = new Promise((resolve) => {
            this._resolve = () => {
                this.update();
                resolve(this);
            };

            if (SVGResource.SVG_XML.test(this.svg.trim())) {
                if (!btoa) {
                    throw new Error("Browser doesn't support base64 conversions.");
                }
                this.svg = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(this.svg)))}`;
            }

            this._loadSvg();
        });

        return this._load;
    }

    _loadSvg() {
        const img = new Image();

        img.src = this.svg;
        img.onerror = (error) => {
            if (this._resolve) {
                img.onerror = null;
                this.onError.emit(error);
            }
        };

        img.onload = () => {
            if (!this._resolve) return;

            const imgWidth = img.width;
            const imgHeight = img.height;

            if (!imgWidth || !imgHeight) {
                throw new Error('SVG must have width and height defined (in pixels)');
            }

            let width = imgWidth * this.scale;
            let height = imgHeight * this.scale;

            if (this._overrideWidth || this._overrideHeight) {
                width = this._overrideWidth || (this._overrideHeight / imgHeight * imgWidth);
                height = this._overrideHeight || (this._overrideWidth / imgWidth * imgHeight);
            }

            width = Math.round(width);
            height = Math.round(height);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, width, height);

            this.source = canvas;
            this.resize(width, height);
            this.valid = true;

            this._resolve();
            this._resolve = null;
        };
    }

    static getSize(svgString) {
        const match = SVGResource.SVG_SIZE.exec(svgString);
        const result = {};

        if (match) {
            result[match[1]] = Math.round(parseFloat(match[3]));
            result[match[5]] = Math.round(parseFloat(match[7]));
        }

        return result;
    }

    dispose() {
        super.dispose();
        this._resolve = null;
        this._crossorigin = null;
    }

    static test(source, extension) {
        return extension === 'svg' ||
            (typeof source === 'string' && source.startsWith('data:image/svg+xml')) ||
            (typeof source === 'string' && SVGResource.SVG_XML.test(source));
    }
}

SVGResource.SVG_XML = /^(<\?xml[^?]+\?>)?\s*(<!--[^(-->)]*-->)?\s*\<svg/m;
SVGResource.SVG_SIZE = /<svg[^>]*(?:\s(width|height)=('|")(\d*(?:\.\d+)?)(?:px)?('|"))[^>]*(?:\s(width|height)=('|")(\d*(?:\.\d+)?)(?:px)?('|"))[^>]*>/i;

// ArrayResource - 配列リソース
class ArrayResource extends BaseResource {
    constructor(source, options = {}) {
        const { width, height } = options;
        let items, length;

        if (Array.isArray(source)) {
            items = source;
            length = source.length;
        } else {
            length = source;
        }

        super(width, height);

        this.items = [];
        this.itemDirtyIds = [];
        this.length = length;
        this._load = null;
        this.baseTexture = null;

        for (let i = 0; i < length; i++) {
            this.items.push(null);
            this.itemDirtyIds.push(-2);
        }

        if (items) {
            this.initFromArray(items, options);
        }
    }

    initFromArray(resources, options) {
        for (let i = 0; i < this.length; i++) {
            if (!resources[i]) continue;

            if (resources[i].resource) {
                this.addResourceAt(resources[i].resource, i);
            } else {
                this.addResourceAt(this.createResource(resources[i], options), i);
            }
        }
    }

    createResource(source, options) {
        // リソースタイプに応じて適切なリソースを作成
        if (typeof source === 'string') {
            return new ImageBitmapResource(source, options);
        } else if (source instanceof HTMLVideoElement) {
            return new VideoResource(source, options);
        } else if (source instanceof HTMLCanvasElement) {
            return new CanvasResource(source);
        }
        return source;
    }

    addResourceAt(resource, index) {
        if (!this.items[index]) {
            throw new Error(`Index ${index} is out of bounds`);
        }

        if (resource.valid && !this.valid) {
            this.resize(resource.width, resource.height);
        }

        this.items[index] = resource;
        return this;
    }

    bind(baseTexture) {
        if (this.baseTexture !== null) {
            throw new Error('Only one base texture per ArrayResource is allowed');
        }

        super.bind(baseTexture);

        for (let i = 0; i < this.length; i++) {
            if (this.items[i]) {
                this.items[i].parentTextureArray = baseTexture;
            }
        }
    }

    unbind(baseTexture) {
        super.unbind(baseTexture);

        for (let i = 0; i < this.length; i++) {
            if (this.items[i]) {
                this.items[i].parentTextureArray = null;
            }
        }
    }

    load() {
        if (this._load) return this._load;

        const resources = this.items
            .map(item => item && item.resource ? item.resource : item)
            .filter(item => item)
            .map(item => item.load ? item.load() : Promise.resolve(item));

        this._load = Promise.all(resources).then(() => {
            const { realWidth, realHeight } = this.items[0];
            this.resize(realWidth, realHeight);
            this.update();
            return Promise.resolve(this);
        });

        return this._load;
    }

    upload(renderer, baseTexture, glTexture) {
        const { length, itemDirtyIds, items } = this;
        const gl = renderer.gl;

        if (glTexture.dirtyId < 0) {
            gl.texImage3D(
                gl.TEXTURE_2D_ARRAY,
                0,
                glTexture.internalFormat,
                this._width,
                this._height,
                length,
                0,
                baseTexture.format,
                glTexture.type,
                null
            );
        }

        for (let i = 0; i < length; i++) {
            const item = items[i];

            if (itemDirtyIds[i] < item.dirtyId) {
                itemDirtyIds[i] = item.dirtyId;

                if (item.valid && item.resource) {
                    gl.texSubImage3D(
                        gl.TEXTURE_2D_ARRAY,
                        0,
                        0,
                        0,
                        i,
                        item.resource.width,
                        item.resource.height,
                        1,
                        baseTexture.format,
                        glTexture.type,
                        item.resource.source
                    );
                }
            }
        }

        return true;
    }

    dispose() {
        for (let i = 0; i < this.length; i++) {
            if (this.items[i]) {
                this.items[i].destroy();
            }
        }

        this.items = null;
        this.itemDirtyIds = null;
        this._load = null;
    }
}

// TextureSystem - テクスチャ管理システム
class TextureSystem {
    constructor(renderer) {
        this.renderer = renderer;
        this.boundTextures = [];
        this.currentLocation = -1;
        this.managedTextures = [];
        this._unknownBoundTextures = false;
        this.unknownTexture = null;
        this.hasIntegerTextures = false;
        this.gl = null;
        this.CONTEXT_UID = 0;
        this.webGLVersion = 1;
        this.internalFormats = {};
        this.samplerTypes = {};
        this.emptyTextures = {};
    }

    contextChange() {
        const gl = this.gl = this.renderer.gl;
        this.CONTEXT_UID = this.renderer.CONTEXT_UID;
        this.webGLVersion = this.renderer.context.webGLVersion;

        // 内部フォーマットとサンプラータイプの設定
        this.internalFormats = this.getInternalFormats(gl);
        this.samplerTypes = this.getSamplerTypes(gl);

        // 最大テクスチャ数の取得
        const maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        this.boundTextures.length = maxTextures;

        for (let i = 0; i < maxTextures; i++) {
            this.boundTextures[i] = null;
        }

        // 空のテクスチャの作成
        this.createEmptyTextures(gl);

        // 全てのテクスチャスロットを初期化
        for (let i = 0; i < this.boundTextures.length; i++) {
            this.bind(null, i);
        }
    }

    getInternalFormats(gl) {
        // WebGL1/2に応じた内部フォーマットの設定
        const formats = {};

        formats[gl.UNSIGNED_BYTE] = {
            [gl.RGBA]: gl.RGBA,
            [gl.RGB]: gl.RGB,
            [gl.ALPHA]: gl.ALPHA,
            [gl.LUMINANCE]: gl.LUMINANCE,
            [gl.LUMINANCE_ALPHA]: gl.LUMINANCE_ALPHA
        };

        return formats;
    }

    getSamplerTypes(gl) {
        // サンプラータイプの設定
        const types = {};

        types[gl.RGBA] = 'FLOAT';
        types[gl.RGB] = 'FLOAT';
        types[gl.ALPHA] = 'FLOAT';
        types[gl.LUMINANCE] = 'FLOAT';
        types[gl.LUMINANCE_ALPHA] = 'FLOAT';

        return types;
    }

    createEmptyTextures(gl) {
        // 空のテクスチャの作成
        const emptyTexture2D = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, emptyTexture2D);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));

        this.emptyTextures[gl.TEXTURE_2D] = {
            texture: emptyTexture2D,
            width: 1,
            height: 1,
            dirtyId: -1,
            dirtyStyleId: -1,
            mipmap: false,
            wrapMode: gl.CLAMP_TO_EDGE,
            type: gl.UNSIGNED_BYTE,
            internalFormat: gl.RGBA,
            samplerType: 'FLOAT'
        };
    }

    bind(texture, location = 0) {
        const gl = this.gl;

        if (texture && texture.valid && !texture.parentTextureArray) {
            texture.touched = Date.now();

            const glTexture = texture._glTextures[this.CONTEXT_UID] || this.initTexture(texture);

            if (this.boundTextures[location] !== texture) {
                if (this.currentLocation !== location) {
                    this.currentLocation = location;
                    gl.activeTexture(gl.TEXTURE0 + location);
                }

                gl.bindTexture(texture.target, glTexture.texture);
            }

            if (glTexture.dirtyId !== texture.dirtyId) {
                if (this.currentLocation !== location) {
                    this.currentLocation = location;
                    gl.activeTexture(gl.TEXTURE0 + location);
                }

                this.updateTexture(texture);
            } else if (glTexture.dirtyStyleId !== texture.dirtyStyleId) {
                this.updateTextureStyle(texture);
            }

            this.boundTextures[location] = texture;
        } else {
            if (this.currentLocation !== location) {
                this.currentLocation = location;
                gl.activeTexture(gl.TEXTURE0 + location);
            }

            gl.bindTexture(gl.TEXTURE_2D, this.emptyTextures[gl.TEXTURE_2D].texture);
            this.boundTextures[location] = null;
        }
    }

    initTexture(texture) {
        const gl = this.gl;
        const glTexture = {
            texture: gl.createTexture(),
            width: -1,
            height: -1,
            dirtyId: -1,
            dirtyStyleId: -1,
            mipmap: false,
            wrapMode: gl.CLAMP_TO_EDGE,
            type: gl.UNSIGNED_BYTE,
            internalFormat: gl.RGBA,
            samplerType: 'FLOAT'
        };

        texture._glTextures[this.CONTEXT_UID] = glTexture;
        this.managedTextures.push(texture);

        return glTexture;
    }

    updateTexture(texture) {
        const glTexture = texture._glTextures[this.CONTEXT_UID];
        if (!glTexture) return;

        const renderer = this.renderer;

        // テクスチャタイプの初期化
        this.initTextureType(texture, glTexture);

        // リソースのアップロード
        if (texture.resource && texture.resource.upload) {
            if (texture.resource.upload(renderer, texture, glTexture)) {
                if (glTexture.samplerType !== 'FLOAT') {
                    this.hasIntegerTextures = true;
                }
            }
        } else {
            // デフォルトのテクスチャデータ
            const gl = renderer.gl;
            const realWidth = texture.realWidth;
            const realHeight = texture.realHeight;

            if (glTexture.width !== realWidth || glTexture.height !== realHeight || glTexture.dirtyId < 0) {
                glTexture.width = realWidth;
                glTexture.height = realHeight;

                gl.texImage2D(
                    texture.target,
                    0,
                    glTexture.internalFormat,
                    realWidth,
                    realHeight,
                    0,
                    texture.format,
                    glTexture.type,
                    null
                );
            }
        }

        // スタイルの更新
        if (texture.dirtyStyleId !== glTexture.dirtyStyleId) {
            this.updateTextureStyle(texture);
        }

        glTexture.dirtyId = texture.dirtyId;
    }

    initTextureType(texture, glTexture) {
        const internalFormat = this.internalFormats[texture.type];
        if (internalFormat && internalFormat[texture.format]) {
            glTexture.internalFormat = internalFormat[texture.format];
        } else {
            glTexture.internalFormat = texture.format;
        }

        glTexture.samplerType = this.samplerTypes[glTexture.internalFormat] || 'FLOAT';
        glTexture.type = texture.type;
    }

    updateTextureStyle(texture) {
        const glTexture = texture._glTextures[this.CONTEXT_UID];
        if (!glTexture) return;

        // ミップマップの設定
        if (texture.mipmap && !texture.isPowerOfTwo && this.webGLVersion === 1) {
            glTexture.mipmap = false;
        } else {
            glTexture.mipmap = texture.mipmap >= 1;
        }

        // ラップモードの設定
        if (this.webGLVersion === 1 && !texture.isPowerOfTwo) {
            glTexture.wrapMode = this.gl.CLAMP_TO_EDGE;
        } else {
            glTexture.wrapMode = texture.wrapMode;
        }

        // リソースのスタイル適用
        if (texture.resource && texture.resource.style) {
            texture.resource.style(this.renderer, texture, glTexture);
        } else {
            this.setStyle(texture, glTexture);
        }

        glTexture.dirtyStyleId = texture.dirtyStyleId;
    }

    setStyle(texture, glTexture) {
        const gl = this.gl;

        // ミップマップの生成
        if (glTexture.mipmap && texture.mipmap !== 'ON_MANUAL') {
            gl.generateMipmap(texture.target);
        }

        // ラップモードの設定
        gl.texParameteri(texture.target, gl.TEXTURE_WRAP_S, glTexture.wrapMode);
        gl.texParameteri(texture.target, gl.TEXTURE_WRAP_T, glTexture.wrapMode);

        // フィルタリングの設定
        if (glTexture.mipmap) {
            gl.texParameteri(
                texture.target,
                gl.TEXTURE_MIN_FILTER,
                texture.scaleMode === 'LINEAR' ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST_MIPMAP_NEAREST
            );
        } else {
            gl.texParameteri(
                texture.target,
                gl.TEXTURE_MIN_FILTER,
                texture.scaleMode === 'LINEAR' ? gl.LINEAR : gl.NEAREST
            );
        }

        gl.texParameteri(
            texture.target,
            gl.TEXTURE_MAG_FILTER,
            texture.scaleMode === 'LINEAR' ? gl.LINEAR : gl.NEAREST
        );
    }

    unbind(texture) {
        const gl = this.gl;
        const boundTextures = this.boundTextures;

        if (this._unknownBoundTextures) {
            this._unknownBoundTextures = false;

            for (let i = 0; i < boundTextures.length; i++) {
                if (boundTextures[i] === this.unknownTexture) {
                    this.bind(null, i);
                }
            }
        }

        for (let i = 0; i < boundTextures.length; i++) {
            if (boundTextures[i] === texture) {
                if (this.currentLocation !== i) {
                    gl.activeTexture(gl.TEXTURE0 + i);
                    this.currentLocation = i;
                }

                gl.bindTexture(texture.target, this.emptyTextures[texture.target].texture);
                boundTextures[i] = null;
            }
        }
    }

    reset() {
        this._unknownBoundTextures = true;
        this.hasIntegerTextures = false;
        this.currentLocation = -1;

        for (let i = 0; i < this.boundTextures.length; i++) {
            this.boundTextures[i] = this.unknownTexture;
        }
    }

    destroyTexture(texture, skipRemove) {
        const gl = this.gl;

        texture = texture.castToBaseTexture ? texture.castToBaseTexture() : texture;

        if (texture._glTextures[this.CONTEXT_UID]) {
            this.unbind(texture);

            gl.deleteTexture(texture._glTextures[this.CONTEXT_UID].texture);
            delete texture._glTextures[this.CONTEXT_UID];

            if (!skipRemove) {
                const index = this.managedTextures.indexOf(texture);
                if (index !== -1) {
                    this.managedTextures.splice(index, 1);
                }
            }
        }
    }

    destroy() {
        this.renderer = null;
        this.gl = null;
    }
}

// エクスポート
export {
    BaseResource,
    ImageBitmapResource,
    VideoResource,
    CanvasResource,
    SVGResource,
    ArrayResource,
    TextureSystem
};

// デフォルトエクスポート
export default {
    BaseResource,
    ImageBitmapResource,
    VideoResource,
    CanvasResource,
    SVGResource,
    ArrayResource,
    TextureSystem
};
