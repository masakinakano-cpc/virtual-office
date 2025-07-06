/**
 * Mask Module
 * マスク関連のクラス（MaskSystem、SpriteMaskFilter、MaskData等）を含む
 */

// MaskData - マスクデータ管理
class MaskData {
    constructor(maskObject = null) {
        this.type = 'NONE';
        this.autoDetect = true;
        this.maskObject = maskObject || null;
        this.pooled = false;
        this.isMaskData = true;
        this.resolution = null;
        this.multisample = 4; // デフォルトマルチサンプル
        this.enabled = true;
        this.colorMask = 15;
        this._filters = null;
        this._stencilCounter = 0;
        this._scissorCounter = 0;
        this._scissorRect = null;
        this._scissorRectLocal = null;
        this._colorMask = 15;
        this._target = null;
    }

    get filter() {
        return this._filters ? this._filters[0] : null;
    }

    set filter(value) {
        if (value) {
            if (this._filters) {
                this._filters[0] = value;
            } else {
                this._filters = [value];
            }
        } else {
            this._filters = null;
        }
    }

    reset() {
        if (this.pooled) {
            this.maskObject = null;
            this.type = 'NONE';
            this.autoDetect = true;
        }
        this._target = null;
        this._scissorRectLocal = null;
    }

    copyCountersOrReset(maskAbove) {
        if (maskAbove) {
            this._stencilCounter = maskAbove._stencilCounter;
            this._scissorCounter = maskAbove._scissorCounter;
            this._scissorRect = maskAbove._scissorRect;
        } else {
            this._stencilCounter = 0;
            this._scissorCounter = 0;
            this._scissorRect = null;
        }
    }
}

// SpriteMaskFilter - スプライトマスク用フィルター
class SpriteMaskFilter {
    constructor(sprite) {
        this.maskSprite = sprite;
        this.maskMatrix = new Float32Array(16);
        this.uniforms = {
            npmAlpha: 0,
            mask: null,
            otherMatrix: new Float32Array(16),
            alpha: 1.0,
            maskClamp: new Float32Array(4)
        };

        // シェーダーコード
        this.vertexSrc = `
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;

            uniform mat3 projectionMatrix;
            uniform mat3 otherMatrix;

            varying vec2 vMaskCoord;
            varying vec2 vTextureCoord;

            void main(void) {
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
                vMaskCoord = (otherMatrix * vec3(aTextureCoord, 1.0)).xy;
            }
        `;

        this.fragmentSrc = `
            varying vec2 vMaskCoord;
            varying vec2 vTextureCoord;

            uniform sampler2D uSampler;
            uniform sampler2D mask;
            uniform float alpha;
            uniform float npmAlpha;
            uniform vec4 maskClamp;

            void main(void) {
                float clip = step(3.5,
                    step(maskClamp.x, vMaskCoord.x) +
                    step(maskClamp.y, vMaskCoord.y) +
                    step(vMaskCoord.x, maskClamp.z) +
                    step(vMaskCoord.y, maskClamp.w));

                vec4 original = texture2D(uSampler, vTextureCoord);
                vec4 masky = texture2D(mask, vMaskCoord);
                float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);

                original *= (alphaMul * masky.r * alpha * clip);

                gl_FragColor = original;
            }
        `;
    }

    get maskSprite() {
        return this._maskSprite;
    }

    set maskSprite(value) {
        this._maskSprite = value;
        if (this._maskSprite) {
            this._maskSprite.renderable = false;
        }
    }

    apply(filterManager, input, output, clearMode) {
        const maskSprite = this._maskSprite;
        const maskTexture = maskSprite._texture;

        if (!maskTexture.valid) return;

        if (!maskTexture.uvMatrix) {
            maskTexture.uvMatrix = new TextureUvs(maskTexture, 0);
        }

        maskTexture.uvMatrix.update();

        this.uniforms.npmAlpha = maskTexture.baseTexture.alphaMode ? 0 : 1;
        this.uniforms.mask = maskTexture;
        this.uniforms.otherMatrix = filterManager.calculateSpriteMatrix(this.maskMatrix, maskSprite)
            .prepend(maskTexture.uvMatrix.mapCoord);
        this.uniforms.alpha = maskSprite.worldAlpha;
        this.uniforms.maskClamp = maskTexture.uvMatrix.uClampFrame;

        filterManager.applyFilter(this, input, output, clearMode);
    }
}

// TextureUvs - テクスチャUV座標管理
class TextureUvs {
    constructor(texture, clampMargin) {
        this._texture = texture;
        this.mapCoord = new Float32Array(16);
        this.uClampFrame = new Float32Array(4);
        this.uClampOffset = new Float32Array(2);
        this._textureID = -1;
        this._updateID = 0;
        this.clampOffset = 0;
        this.clampMargin = typeof clampMargin !== 'undefined' ? clampMargin : 0.5;
        this.isSimple = false;
    }

    get texture() {
        return this._texture;
    }

    set texture(value) {
        this._texture = value;
        this._textureID = -1;
    }

    multiplyUvs(uvs, out) {
        if (out === undefined) {
            out = uvs;
        }

        const matrix = this.mapCoord;

        for (let i = 0; i < uvs.length; i += 2) {
            const x = uvs[i];
            const y = uvs[i + 1];

            out[i] = x * matrix[0] + y * matrix[4] + matrix[12];
            out[i + 1] = x * matrix[1] + y * matrix[5] + matrix[13];
        }

        return out;
    }

    update(forceUpdate) {
        const texture = this._texture;

        if (!texture || !texture.valid) {
            return false;
        }

        if (!forceUpdate && this._textureID === texture._updateID) {
            return false;
        }

        this._textureID = texture._updateID;
        this._updateID++;

        const uvs = texture._uvs;

        this.mapCoord[0] = uvs.x1 - uvs.x0;
        this.mapCoord[1] = uvs.y1 - uvs.y0;
        this.mapCoord[4] = uvs.x3 - uvs.x0;
        this.mapCoord[5] = uvs.y3 - uvs.y0;
        this.mapCoord[12] = uvs.x0;
        this.mapCoord[13] = uvs.y0;
        this.mapCoord[15] = 1;

        const orig = texture.orig;
        const trim = texture.trim;

        if (trim) {
            const tempMatrix = new Float32Array(16);
            tempMatrix[0] = orig.width / trim.width;
            tempMatrix[5] = orig.height / trim.height;
            tempMatrix[12] = -trim.x / trim.width;
            tempMatrix[13] = -trim.y / trim.height;
            tempMatrix[15] = 1;

            this.multiplyMatrix(this.mapCoord, tempMatrix);
        }

        const baseTexture = texture.baseTexture;
        const frame = texture._frame;
        const resolution = baseTexture.resolution;
        const margin = this.clampMargin / resolution;
        const offset = this.clampOffset;

        this.uClampFrame[0] = (frame.x + margin + offset) / baseTexture.width;
        this.uClampFrame[1] = (frame.y + margin + offset) / baseTexture.height;
        this.uClampFrame[2] = (frame.x + frame.width - margin + offset) / baseTexture.width;
        this.uClampFrame[3] = (frame.y + frame.height - margin + offset) / baseTexture.height;

        this.uClampOffset[0] = offset / baseTexture.realWidth;
        this.uClampOffset[1] = offset / baseTexture.realHeight;

        this.isSimple = frame.width === baseTexture.width &&
            frame.height === baseTexture.height &&
            texture.rotate === 0;

        return true;
    }

    multiplyMatrix(out, a) {
        // 4x4行列の乗算の簡略版（2D用）
        const a00 = a[0], a01 = a[1], a04 = a[4], a05 = a[5];
        const a12 = a[12], a13 = a[13];

        const b00 = out[0], b01 = out[1], b04 = out[4], b05 = out[5];
        const b12 = out[12], b13 = out[13];

        out[0] = a00 * b00 + a01 * b04;
        out[1] = a00 * b01 + a01 * b05;
        out[4] = a04 * b00 + a05 * b04;
        out[5] = a04 * b01 + a05 * b05;
        out[12] = a00 * b12 + a01 * b13 + a12;
        out[13] = a04 * b12 + a05 * b13 + a13;
    }
}

// AbstractMaskSystem - マスクシステムの基底クラス
class AbstractMaskSystem {
    constructor(renderer) {
        this.renderer = renderer;
        this.maskStack = [];
        this.glConst = 0;
    }

    getStackLength() {
        return this.maskStack.length;
    }

    setMaskStack(maskStack) {
        const gl = this.renderer.gl;
        const currentLength = this.getStackLength();

        this.maskStack = maskStack;

        const newLength = this.getStackLength();

        if (newLength !== currentLength) {
            if (newLength === 0) {
                gl.disable(this.glConst);
            } else {
                gl.enable(this.glConst);
                this._useCurrent();
            }
        }
    }

    _useCurrent() {
        // サブクラスで実装
    }

    destroy() {
        this.renderer = null;
        this.maskStack = null;
    }
}

// ScissorSystem - シザーマスクシステム
class ScissorSystem extends AbstractMaskSystem {
    constructor(renderer) {
        super(renderer);
        this.glConst = renderer.gl.SCISSOR_TEST;
    }

    getStackLength() {
        const mask = this.maskStack[this.maskStack.length - 1];
        return mask ? mask._scissorCounter : 0;
    }

    calcScissorRect(maskData) {
        if (maskData._scissorRectLocal) {
            return;
        }

        const scissorRect = maskData._scissorRect;
        const { maskObject } = maskData;
        const { renderer } = this;
        const renderTexture = renderer.renderTexture;
        const bounds = maskObject.getBounds(true);

        this.roundFrameToPixels(
            bounds,
            renderTexture.current ? renderTexture.current.resolution : renderer.resolution,
            renderTexture.sourceFrame,
            renderTexture.destinationFrame,
            renderer.projection.transform
        );

        if (scissorRect) {
            bounds.fit(scissorRect);
        }

        maskData._scissorRectLocal = bounds;
    }

    static isMatrixRotated(matrix) {
        if (!matrix) {
            return false;
        }

        const { a, b, c, d } = matrix;

        return (Math.abs(b) > 1e-4 || Math.abs(c) > 1e-4) &&
            (Math.abs(a) > 1e-4 || Math.abs(d) > 1e-4);
    }

    testScissor(maskData) {
        const { maskObject } = maskData;

        if (!maskObject.isFastRect ||
            !maskObject.isFastRect() ||
            ScissorSystem.isMatrixRotated(maskObject.worldTransform) ||
            ScissorSystem.isMatrixRotated(this.renderer.projection.transform)) {
            return false;
        }

        this.calcScissorRect(maskData);

        const rect = maskData._scissorRectLocal;

        return rect.width > 0 && rect.height > 0;
    }

    roundFrameToPixels(frame, resolution, sourceFrame, destFrame, projectionTransform) {
        if (ScissorSystem.isMatrixRotated(projectionTransform)) {
            return;
        }

        const transform = projectionTransform || new Float32Array(16);

        // 変換行列の設定
        transform[0] = destFrame.width / sourceFrame.width;
        transform[5] = destFrame.height / sourceFrame.height;
        transform[12] = destFrame.x - sourceFrame.x * transform[0];
        transform[13] = destFrame.y - sourceFrame.y * transform[5];

        // フレームの変換
        this.transformAABB(transform, frame);

        frame.fit(destFrame);
        frame.x = Math.round(frame.x * resolution);
        frame.y = Math.round(frame.y * resolution);
        frame.width = Math.round(frame.width * resolution);
        frame.height = Math.round(frame.height * resolution);
    }

    transformAABB(transform, rect) {
        const x1 = rect.x;
        const y1 = rect.y;
        const x2 = rect.x + rect.width;
        const y2 = rect.y + rect.height;

        const tx1 = transform[0] * x1 + transform[4] * y1 + transform[12];
        const ty1 = transform[1] * x1 + transform[5] * y1 + transform[13];
        const tx2 = transform[0] * x2 + transform[4] * y2 + transform[12];
        const ty2 = transform[1] * x2 + transform[5] * y2 + transform[13];

        rect.x = Math.min(tx1, tx2);
        rect.y = Math.min(ty1, ty2);
        rect.width = Math.max(tx1, tx2) - rect.x;
        rect.height = Math.max(ty1, ty2) - rect.y;
    }

    push(maskData) {
        if (!maskData._scissorRectLocal) {
            this.calcScissorRect(maskData);
        }

        const gl = this.renderer.gl;

        if (!maskData._scissorRect) {
            gl.enable(gl.SCISSOR_TEST);
        }

        maskData._scissorCounter++;
        maskData._scissorRect = maskData._scissorRectLocal;
        this._useCurrent();
    }

    pop(maskData) {
        const gl = this.renderer.gl;

        if (this.getStackLength() > 0) {
            this._useCurrent();
        } else {
            gl.disable(gl.SCISSOR_TEST);
        }
    }

    _useCurrent() {
        const rect = this.maskStack[this.maskStack.length - 1]._scissorRect;
        let y;

        if (this.renderer.renderTexture.current) {
            y = rect.y;
        } else {
            y = this.renderer.height - rect.height - rect.y;
        }

        this.renderer.gl.scissor(rect.x, y, rect.width, rect.height);
    }
}

// StencilSystem - ステンシルマスクシステム
class StencilSystem extends AbstractMaskSystem {
    constructor(renderer) {
        super(renderer);
        this.glConst = renderer.gl.STENCIL_TEST;
    }

    getStackLength() {
        const mask = this.maskStack[this.maskStack.length - 1];
        return mask ? mask._stencilCounter : 0;
    }

    push(maskData) {
        const maskObject = maskData.maskObject;
        const gl = this.renderer.gl;
        const prevMaskCount = maskData._stencilCounter;

        if (prevMaskCount === 0) {
            // ステンシルバッファの初期化
            this.renderer.framebuffer.forceStencil();
            gl.clearStencil(0);
            gl.clear(gl.STENCIL_BUFFER_BIT);
            gl.enable(gl.STENCIL_TEST);
        }

        maskData._stencilCounter++;

        const colorMask = maskData._colorMask;

        if (colorMask !== 0) {
            maskData._colorMask = 0;
            gl.colorMask(false, false, false, false);
        }

        // ステンシルテストの設定
        gl.stencilFunc(gl.EQUAL, prevMaskCount, 0xFFFFFFFF);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);

        // マスクオブジェクトのレンダリング
        maskObject.renderable = true;
        maskObject.render(this.renderer);
        this.renderer.batch.flush();
        maskObject.renderable = false;

        if (colorMask !== 0) {
            maskData._colorMask = colorMask;
            gl.colorMask(
                (colorMask & 1) !== 0,
                (colorMask & 2) !== 0,
                (colorMask & 4) !== 0,
                (colorMask & 8) !== 0
            );
        }

        this._useCurrent();
    }

    pop(maskObject) {
        const gl = this.renderer.gl;

        if (this.getStackLength() === 0) {
            // ステンシルテストを無効化
            gl.disable(gl.STENCIL_TEST);
        } else {
            const maskData = this.maskStack.length !== 0 ? this.maskStack[this.maskStack.length - 1] : null;
            const colorMask = maskData ? maskData._colorMask : 15;

            if (colorMask !== 0) {
                maskData._colorMask = 0;
                gl.colorMask(false, false, false, false);
            }

            // ステンシル値のデクリメント
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.DECR);

            maskObject.renderable = true;
            maskObject.render(this.renderer);
            this.renderer.batch.flush();
            maskObject.renderable = false;

            if (colorMask !== 0) {
                maskData._colorMask = colorMask;
                gl.colorMask(
                    (colorMask & 1) !== 0,
                    (colorMask & 2) !== 0,
                    (colorMask & 4) !== 0,
                    (colorMask & 8) !== 0
                );
            }

            this._useCurrent();
        }
    }

    _useCurrent() {
        const gl = this.renderer.gl;
        gl.stencilFunc(gl.EQUAL, this.getStackLength(), 0xFFFFFFFF);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    }
}

// MaskSystem - メインのマスクシステム
class MaskSystem {
    constructor(renderer) {
        this.renderer = renderer;
        this.enableScissor = true;
        this.alphaMaskPool = [];
        this.maskDataPool = [];
        this.maskStack = [];
        this.alphaMaskIndex = 0;
    }

    setMaskStack(maskStack) {
        this.maskStack = maskStack;
        this.renderer.scissor.setMaskStack(maskStack);
        this.renderer.stencil.setMaskStack(maskStack);
    }

    push(target, maskDataOrMaskObject) {
        let maskData = maskDataOrMaskObject;

        if (!maskData.isMaskData) {
            const tempMaskData = this.maskDataPool.pop() || new MaskData();
            tempMaskData.pooled = true;
            tempMaskData.maskObject = maskDataOrMaskObject;
            maskData = tempMaskData;
        }

        const maskAbove = this.maskStack.length !== 0 ? this.maskStack[this.maskStack.length - 1] : null;

        maskData.copyCountersOrReset(maskAbove);
        maskData._colorMask = maskAbove ? maskAbove._colorMask : 15;

        if (maskData.autoDetect) {
            this.detect(maskData);
        }

        maskData._target = target;

        if (maskData.type !== 'SPRITE') {
            this.maskStack.push(maskData);
        }

        if (maskData.enabled) {
            switch (maskData.type) {
                case 'SCISSOR':
                    this.renderer.scissor.push(maskData);
                    break;
                case 'STENCIL':
                    this.renderer.stencil.push(maskData);
                    break;
                case 'SPRITE':
                    maskData.copyCountersOrReset(null);
                    this.pushSpriteMask(maskData);
                    break;
                case 'COLOR':
                    this.pushColorMask(maskData);
                    break;
            }
        }

        if (maskData.type === 'SPRITE') {
            this.maskStack.push(maskData);
        }
    }

    pop(target) {
        const maskData = this.maskStack.pop();

        if (!maskData || maskData._target !== target) {
            return;
        }

        if (maskData.enabled) {
            switch (maskData.type) {
                case 'SCISSOR':
                    this.renderer.scissor.pop(maskData);
                    break;
                case 'STENCIL':
                    this.renderer.stencil.pop(maskData.maskObject);
                    break;
                case 'SPRITE':
                    this.popSpriteMask(maskData);
                    break;
                case 'COLOR':
                    this.popColorMask(maskData);
                    break;
            }
        }

        maskData.reset();

        if (maskData.pooled) {
            this.maskDataPool.push(maskData);
        }

        if (this.maskStack.length !== 0) {
            const maskAbove = this.maskStack[this.maskStack.length - 1];

            if (maskAbove.type === 'SPRITE' && maskAbove._filters) {
                maskAbove._filters[0].maskSprite = maskAbove.maskObject;
            }
        }
    }

    detect(maskData) {
        const maskObject = maskData.maskObject;

        if (!maskObject) {
            maskData.type = 'COLOR';
        } else if (maskObject.isSprite) {
            maskData.type = 'SPRITE';
        } else if (this.enableScissor && this.renderer.scissor.testScissor(maskData)) {
            maskData.type = 'SCISSOR';
        } else {
            maskData.type = 'STENCIL';
        }
    }

    pushSpriteMask(maskData) {
        const { maskObject } = maskData;
        const target = maskData._target;

        let filters = maskData._filters;

        if (!filters) {
            filters = this.alphaMaskPool[this.alphaMaskIndex];

            if (!filters) {
                filters = this.alphaMaskPool[this.alphaMaskIndex] = [new SpriteMaskFilter()];
            }
        }

        const filter = filters[0];
        filter.resolution = maskData.resolution;
        filter.multisample = maskData.multisample;
        filter.maskSprite = maskObject;

        const filterArea = target.filterArea;

        target.filterArea = maskObject.getBounds(true);
        this.renderer.filter.push(target, filters);
        target.filterArea = filterArea;

        if (!maskData._filters) {
            this.alphaMaskIndex++;
        }
    }

    popSpriteMask(maskData) {
        this.renderer.filter.pop();

        if (maskData._filters) {
            maskData._filters[0].maskSprite = null;
        } else {
            this.alphaMaskIndex--;
            this.alphaMaskPool[this.alphaMaskIndex][0].maskSprite = null;
        }
    }

    pushColorMask(maskData) {
        const currentColorMask = maskData._colorMask;
        const newColorMask = maskData._colorMask = currentColorMask & maskData.colorMask;

        if (newColorMask !== currentColorMask) {
            this.renderer.gl.colorMask(
                (newColorMask & 1) !== 0,
                (newColorMask & 2) !== 0,
                (newColorMask & 4) !== 0,
                (newColorMask & 8) !== 0
            );
        }
    }

    popColorMask(maskData) {
        const currentColorMask = maskData._colorMask;
        const newColorMask = this.maskStack.length > 0 ?
            this.maskStack[this.maskStack.length - 1]._colorMask : 15;

        if (newColorMask !== currentColorMask) {
            this.renderer.gl.colorMask(
                (newColorMask & 1) !== 0,
                (newColorMask & 2) !== 0,
                (newColorMask & 4) !== 0,
                (newColorMask & 8) !== 0
            );
        }
    }

    destroy() {
        this.renderer = null;
    }
}

// エクスポート
export {
    MaskData,
    SpriteMaskFilter,
    TextureUvs,
    AbstractMaskSystem,
    ScissorSystem,
    StencilSystem,
    MaskSystem
};

// デフォルトエクスポート
export default {
    MaskData,
    SpriteMaskFilter,
    TextureUvs,
    AbstractMaskSystem,
    ScissorSystem,
    StencilSystem,
    MaskSystem
};
