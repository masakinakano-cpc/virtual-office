// Filters Module - 画像エフェクトとポストプロセッシング
// 各種フィルター効果を提供

import { Shader } from './shader.js';
import { Point } from './display.js';
import { Color } from './display.js';

// 基底フィルタークラス
export class Filter {
    constructor(vertexSrc, fragmentSrc, uniforms) {
        this.vertexSrc = vertexSrc;
        this.fragmentSrc = fragmentSrc;
        this.uniforms = uniforms || {};
        this.enabled = true;
        this.autoFit = true;
        this.legacy = false;
        this.resolution = 1;
        this.multisample = 1;
        this.padding = 0;
        this.antialias = false;
        this.blendMode = null;
        this.state = null;
    }

    apply(filterManager, input, output, clearMode, currentState) {
        filterManager.applyFilter(this, input, output, clearMode);
    }

    get blendMode() {
        return this._blendMode;
    }

    set blendMode(value) {
        this._blendMode = value;
    }

    static get defaultVertexSrc() {
        return `
            attribute vec2 aVertexPosition;
            uniform mat3 projectionMatrix;
            uniform vec4 inputSize;
            uniform vec4 outputFrame;
            varying vec2 vTextureCoord;

            vec4 filterVertexPosition( void )
            {
                vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;
                return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
            }

            vec2 filterTextureCoord( void )
            {
                return aVertexPosition * (outputFrame.zw * inputSize.zw);
            }

            void main(void)
            {
                gl_Position = filterVertexPosition();
                vTextureCoord = filterTextureCoord();
            }
        `;
    }

    static get defaultFragmentSrc() {
        return `
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;

            void main(void)
            {
                gl_FragColor = texture2D(uSampler, vTextureCoord);
            }
        `;
    }
}

// アルファフィルター
export class AlphaFilter extends Filter {
    constructor(alpha = 1.0) {
        const fragmentSrc = `
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform float uAlpha;

            void main(void)
            {
               gl_FragColor = texture2D(uSampler, vTextureCoord) * uAlpha;
            }
        `;

        super(Filter.defaultVertexSrc, fragmentSrc, { uAlpha: 1 });
        this.alpha = alpha;
    }

    get alpha() {
        return this.uniforms.uAlpha;
    }

    set alpha(value) {
        this.uniforms.uAlpha = value;
    }
}

// ブラーフィルター（単方向）
export class BlurFilterPass extends Filter {
    constructor(horizontal, strength = 8, quality = 4, resolution = Filter.defaultResolution, kernelSize = 5) {
        const vertexSrc = this.generateVertexSrc(kernelSize, horizontal);
        const fragmentSrc = this.generateFragmentSrc(kernelSize);

        super(vertexSrc, fragmentSrc);

        this.horizontal = horizontal;
        this.resolution = resolution;
        this._quality = 0;
        this.quality = quality;
        this.blur = strength;
    }

    apply(filterManager, input, output, clearMode) {
        if (output) {
            if (this.horizontal) {
                this.uniforms.strength = (1 / output.width) * (output.width / input.width);
            } else {
                this.uniforms.strength = (1 / output.height) * (output.height / input.height);
            }
        } else {
            if (this.horizontal) {
                this.uniforms.strength = (1 / filterManager.renderer.width) * (filterManager.renderer.width / input.width);
            } else {
                this.uniforms.strength = (1 / filterManager.renderer.height) * (filterManager.renderer.height / input.height);
            }
        }

        this.uniforms.strength *= this.strength;
        this.uniforms.strength /= this.passes;

        if (this.passes === 1) {
            filterManager.applyFilter(this, input, output, clearMode);
        } else {
            const renderTarget = filterManager.getFilterTexture();
            const renderer = filterManager.renderer;

            let flip = input;
            let flop = renderTarget;

            this.state.blend = false;
            filterManager.applyFilter(this, flip, flop, true);

            for (let i = 1; i < this.passes - 1; i++) {
                filterManager.bindAndClear(flip, true);
                this.uniforms.uSampler = flop;

                const temp = flop;
                flop = flip;
                flip = temp;

                renderer.shader.bind(this);
                renderer.geometry.draw(5);
            }

            this.state.blend = true;
            filterManager.applyFilter(this, flop, output, clearMode);
            filterManager.returnFilterTexture(renderTarget);
        }
    }

    get blur() {
        return this.strength;
    }

    set blur(value) {
        this.padding = 1 + (Math.abs(value) * 2);
        this.strength = value;
    }

    get quality() {
        return this._quality;
    }

    set quality(value) {
        this._quality = value;
        this.passes = value;
    }

    generateVertexSrc(kernelSize, x) {
        const halfLength = Math.ceil(kernelSize / 2);
        let vertexSrc = Filter.defaultVertexSrc;
        let sampleValues = '';

        if (x) {
            sampleValues = 'vBlurTexCoords[%index%] =  textureCoord + vec2(%sampleIndex% * strength, 0.0);';
        } else {
            sampleValues = 'vBlurTexCoords[%index%] =  textureCoord + vec2(0.0, %sampleIndex% * strength);';
        }

        for (let i = 0; i < kernelSize; i++) {
            let blur = sampleValues.replace('%index%', i.toString());
            blur = blur.replace('%sampleIndex%', `${i - (halfLength - 1)}.0`);
            vertexSrc += blur;
            vertexSrc += '\n';
        }

        return vertexSrc;
    }

    generateFragmentSrc(kernelSize) {
        const kernel = this.getGaussianKernel(kernelSize);
        let fragmentSrc = `
            varying vec2 vBlurTexCoords[${kernelSize}];
            uniform sampler2D uSampler;
            void main(void)
            {
                gl_FragColor = vec4(0.0);
        `;

        for (let i = 0; i < kernelSize; i++) {
            fragmentSrc += `gl_FragColor += texture2D(uSampler, vBlurTexCoords[${i}]) * ${kernel[i]};`;
        }

        fragmentSrc += '}';
        return fragmentSrc;
    }

    getGaussianKernel(kernelSize) {
        const kernel = [];
        const sigma = kernelSize / 3;
        const mean = (kernelSize - 1) / 2;
        let sum = 0;

        for (let x = 0; x < kernelSize; x++) {
            kernel[x] = Math.exp(-0.5 * Math.pow((x - mean) / sigma, 2.0));
            sum += kernel[x];
        }

        for (let x = 0; x < kernelSize; x++) {
            kernel[x] /= sum;
        }

        return kernel;
    }
}

// ブラーフィルター（両方向）
export class BlurFilter extends Filter {
    constructor(strength = 8, quality = 4, resolution = Filter.defaultResolution, kernelSize = 5) {
        super();

        this._repeatEdgePixels = false;
        this.blurXFilter = new BlurFilterPass(true, strength, quality, resolution, kernelSize);
        this.blurYFilter = new BlurFilterPass(false, strength, quality, resolution, kernelSize);

        this.resolution = resolution;
        this.quality = quality;
        this.blur = strength;
        this.repeatEdgePixels = false;
    }

    apply(filterManager, input, output, clearMode) {
        const xStrength = Math.abs(this.blurXFilter.strength);
        const yStrength = Math.abs(this.blurYFilter.strength);

        if (xStrength && yStrength) {
            const renderTarget = filterManager.getFilterTexture();
            this.blurXFilter.apply(filterManager, input, renderTarget, 1);
            this.blurYFilter.apply(filterManager, renderTarget, output, clearMode);
            filterManager.returnFilterTexture(renderTarget);
        } else if (yStrength) {
            this.blurYFilter.apply(filterManager, input, output, clearMode);
        } else {
            this.blurXFilter.apply(filterManager, input, output, clearMode);
        }
    }

    updatePadding() {
        if (this._repeatEdgePixels) {
            this.padding = 0;
        } else {
            this.padding = Math.max(Math.abs(this.blurXFilter.strength), Math.abs(this.blurYFilter.strength)) * 2;
        }
    }

    get blur() {
        return this.blurXFilter.blur;
    }

    set blur(value) {
        this.blurXFilter.blur = this.blurYFilter.blur = value;
        this.updatePadding();
    }

    get quality() {
        return this.blurXFilter.quality;
    }

    set quality(value) {
        this.blurXFilter.quality = this.blurYFilter.quality = value;
    }

    get blurX() {
        return this.blurXFilter.blur;
    }

    set blurX(value) {
        this.blurXFilter.blur = value;
        this.updatePadding();
    }

    get blurY() {
        return this.blurYFilter.blur;
    }

    set blurY(value) {
        this.blurYFilter.blur = value;
        this.updatePadding();
    }

    get blendMode() {
        return this.blurYFilter.blendMode;
    }

    set blendMode(value) {
        this.blurYFilter.blendMode = value;
    }

    get repeatEdgePixels() {
        return this._repeatEdgePixels;
    }

    set repeatEdgePixels(value) {
        this._repeatEdgePixels = value;
        this.updatePadding();
    }
}

// カラーマトリックスフィルター
export class ColorMatrixFilter extends Filter {
    constructor() {
        const fragmentSrc = `
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform float m[20];
            uniform float uAlpha;

            void main(void)
            {
                vec4 c = texture2D(uSampler, vTextureCoord);

                if (uAlpha == 0.0) {
                    gl_FragColor = c;
                    return;
                }

                // Un-premultiply alpha before applying the color matrix
                if (c.a > 0.0) {
                  c.rgb /= c.a;
                }

                vec4 result;

                result.r = (m[0] * c.r);
                    result.r += (m[1] * c.g);
                    result.r += (m[2] * c.b);
                    result.r += (m[3] * c.a);
                    result.r += m[4];

                result.g = (m[5] * c.r);
                    result.g += (m[6] * c.g);
                    result.g += (m[7] * c.b);
                    result.g += (m[8] * c.a);
                    result.g += m[9];

                result.b = (m[10] * c.r);
                   result.b += (m[11] * c.g);
                   result.b += (m[12] * c.b);
                   result.b += (m[13] * c.a);
                   result.b += m[14];

                result.a = (m[15] * c.r);
                   result.a += (m[16] * c.g);
                   result.a += (m[17] * c.b);
                   result.a += (m[18] * c.a);
                   result.a += m[19];

                vec3 rgb = mix(c.rgb, result.rgb, uAlpha);

                // Premultiply alpha again.
                rgb *= result.a;

                gl_FragColor = vec4(rgb, result.a);
            }
        `;

        const uniforms = {
            m: new Float32Array([1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]),
            uAlpha: 1
        };

        super(Filter.defaultVertexSrc, fragmentSrc, uniforms);
        this.alpha = 1;
    }

    _loadMatrix(matrix, multiply = false) {
        let newMatrix = matrix;

        if (multiply) {
            this._multiply(newMatrix, this.uniforms.m, matrix);
            newMatrix = this._colorMatrix(newMatrix);
        }

        this.uniforms.m = newMatrix;
    }

    _multiply(out, a, b) {
        // 4x5 matrix multiplication
        out[0] = (a[0] * b[0]) + (a[1] * b[5]) + (a[2] * b[10]) + (a[3] * b[15]);
        out[1] = (a[0] * b[1]) + (a[1] * b[6]) + (a[2] * b[11]) + (a[3] * b[16]);
        out[2] = (a[0] * b[2]) + (a[1] * b[7]) + (a[2] * b[12]) + (a[3] * b[17]);
        out[3] = (a[0] * b[3]) + (a[1] * b[8]) + (a[2] * b[13]) + (a[3] * b[18]);
        out[4] = (a[0] * b[4]) + (a[1] * b[9]) + (a[2] * b[14]) + (a[3] * b[19]) + a[4];

        out[5] = (a[5] * b[0]) + (a[6] * b[5]) + (a[7] * b[10]) + (a[8] * b[15]);
        out[6] = (a[5] * b[1]) + (a[6] * b[6]) + (a[7] * b[11]) + (a[8] * b[16]);
        out[7] = (a[5] * b[2]) + (a[6] * b[7]) + (a[7] * b[12]) + (a[8] * b[17]);
        out[8] = (a[5] * b[3]) + (a[6] * b[8]) + (a[7] * b[13]) + (a[8] * b[18]);
        out[9] = (a[5] * b[4]) + (a[6] * b[9]) + (a[7] * b[14]) + (a[8] * b[19]) + a[9];

        out[10] = (a[10] * b[0]) + (a[11] * b[5]) + (a[12] * b[10]) + (a[13] * b[15]);
        out[11] = (a[10] * b[1]) + (a[11] * b[6]) + (a[12] * b[11]) + (a[13] * b[16]);
        out[12] = (a[10] * b[2]) + (a[11] * b[7]) + (a[12] * b[12]) + (a[13] * b[17]);
        out[13] = (a[10] * b[3]) + (a[11] * b[8]) + (a[12] * b[13]) + (a[13] * b[18]);
        out[14] = (a[10] * b[4]) + (a[11] * b[9]) + (a[12] * b[14]) + (a[13] * b[19]) + a[14];

        out[15] = (a[15] * b[0]) + (a[16] * b[5]) + (a[17] * b[10]) + (a[18] * b[15]);
        out[16] = (a[15] * b[1]) + (a[16] * b[6]) + (a[17] * b[11]) + (a[18] * b[16]);
        out[17] = (a[15] * b[2]) + (a[16] * b[7]) + (a[17] * b[12]) + (a[18] * b[17]);
        out[18] = (a[15] * b[3]) + (a[16] * b[8]) + (a[17] * b[13]) + (a[18] * b[18]);
        out[19] = (a[15] * b[4]) + (a[16] * b[9]) + (a[17] * b[14]) + (a[18] * b[19]) + a[19];

        return out;
    }

    _colorMatrix(matrix) {
        const m = new Float32Array(matrix);
        m[4] /= 255;
        m[9] /= 255;
        m[14] /= 255;
        m[19] /= 255;
        return m;
    }

    // カラー調整メソッド群
    brightness(value, multiply) {
        const matrix = [
            value, 0, 0, 0, 0,
            0, value, 0, 0, 0,
            0, 0, value, 0, 0,
            0, 0, 0, 1, 0
        ];

        this._loadMatrix(matrix, multiply);
    }

    tint(color, multiply) {
        const [r, g, b] = Color.shared.setValue(color).toArray();
        const matrix = [
            r, 0, 0, 0, 0,
            0, g, 0, 0, 0,
            0, 0, b, 0, 0,
            0, 0, 0, 1, 0
        ];

        this._loadMatrix(matrix, multiply);
    }

    greyscale(scale, multiply) {
        const matrix = [
            scale, scale, scale, 0, 0,
            scale, scale, scale, 0, 0,
            scale, scale, scale, 0, 0,
            0, 0, 0, 1, 0
        ];

        this._loadMatrix(matrix, multiply);
    }

    blackAndWhite(multiply) {
        const matrix = [
            0.3, 0.6, 0.1, 0, 0,
            0.3, 0.6, 0.1, 0, 0,
            0.3, 0.6, 0.1, 0, 0,
            0, 0, 0, 1, 0
        ];

        this._loadMatrix(matrix, multiply);
    }

    hue(rotation, multiply) {
        rotation = (rotation || 0) / 180 * Math.PI;

        const cosR = Math.cos(rotation);
        const sinR = Math.sin(rotation);
        const sqrt = Math.sqrt;

        const w = 1 / 3;
        const sqrW = sqrt(w);

        const a00 = cosR + (1 - cosR) * w;
        const a01 = w * (1 - cosR) - sqrW * sinR;
        const a02 = w * (1 - cosR) + sqrW * sinR;

        const a10 = w * (1 - cosR) + sqrW * sinR;
        const a11 = cosR + w * (1 - cosR);
        const a12 = w * (1 - cosR) - sqrW * sinR;

        const a20 = w * (1 - cosR) - sqrW * sinR;
        const a21 = w * (1 - cosR) + sqrW * sinR;
        const a22 = cosR + w * (1 - cosR);

        const matrix = [
            a00, a01, a02, 0, 0,
            a10, a11, a12, 0, 0,
            a20, a21, a22, 0, 0,
            0, 0, 0, 1, 0
        ];

        this._loadMatrix(matrix, multiply);
    }

    contrast(amount, multiply) {
        const v = (amount || 0) + 1;
        const o = -0.5 * (v - 1);

        const matrix = [
            v, 0, 0, 0, o,
            0, v, 0, 0, o,
            0, 0, v, 0, o,
            0, 0, 0, 1, 0
        ];

        this._loadMatrix(matrix, multiply);
    }

    saturate(amount = 0, multiply) {
        const x = (amount * 2 / 3) + 1;
        const y = ((x - 1) * -0.5);

        const matrix = [
            x, y, y, 0, 0,
            y, x, y, 0, 0,
            y, y, x, 0, 0,
            0, 0, 0, 1, 0
        ];

        this._loadMatrix(matrix, multiply);
    }

    desaturate() {
        this.saturate(-1);
    }

    negative(multiply) {
        const matrix = [
            -1, 0, 0, 1, 0,
            0, -1, 0, 1, 0,
            0, 0, -1, 1, 0,
            0, 0, 0, 1, 0
        ];

        this._loadMatrix(matrix, multiply);
    }

    sepia(multiply) {
        const matrix = [
            0.393, 0.7689999, 0.18899999, 0, 0,
            0.349, 0.6859999, 0.16799999, 0, 0,
            0.272, 0.5339999, 0.13099999, 0, 0,
            0, 0, 0, 1, 0
        ];

        this._loadMatrix(matrix, multiply);
    }

    reset() {
        const matrix = [
            1, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1, 0, 0,
            0, 0, 0, 1, 0
        ];

        this._loadMatrix(matrix, false);
    }

    get matrix() {
        return this.uniforms.m;
    }

    set matrix(value) {
        this.uniforms.m = value;
    }

    get alpha() {
        return this.uniforms.uAlpha;
    }

    set alpha(value) {
        this.uniforms.uAlpha = value;
    }
}

// 変位フィルター
export class DisplacementFilter extends Filter {
    constructor(sprite, scale = 20) {
        const vertexSrc = `
            attribute vec2 aVertexPosition;
            uniform mat3 projectionMatrix;
            uniform mat3 filterMatrix;
            varying vec2 vTextureCoord;
            varying vec2 vFilterCoord;
            uniform vec4 inputSize;
            uniform vec4 outputFrame;

            vec4 filterVertexPosition( void )
            {
                vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;
                return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
            }

            vec2 filterTextureCoord( void )
            {
                return aVertexPosition * (outputFrame.zw * inputSize.zw);
            }

            void main(void)
            {
                gl_Position = filterVertexPosition();
                vTextureCoord = filterTextureCoord();
                vFilterCoord = ( filterMatrix * vec3( vTextureCoord, 1.0)  ).xy;
            }
        `;

        const fragmentSrc = `
            varying vec2 vFilterCoord;
            varying vec2 vTextureCoord;
            uniform vec2 scale;
            uniform mat2 rotation;
            uniform sampler2D uSampler;
            uniform sampler2D mapSampler;
            uniform highp vec4 inputSize;
            uniform vec4 inputClamp;

            void main(void)
            {
              vec4 map =  texture2D(mapSampler, vFilterCoord);
              map -= 0.5;
              map.xy = scale * inputSize.zw * (rotation * map.xy);
              gl_FragColor = texture2D(uSampler, clamp(vec2(vTextureCoord.x + map.x, vTextureCoord.y + map.y), inputClamp.xy, inputClamp.zw));
            }
        `;

        const maskMatrix = new Matrix();

        sprite.renderable = false;

        super(vertexSrc, fragmentSrc, {
            mapSampler: sprite._texture,
            filterMatrix: maskMatrix,
            scale: { x: 1, y: 1 },
            rotation: new Float32Array([1, 0, 0, 1])
        });

        this.maskSprite = sprite;
        this.maskMatrix = maskMatrix;

        if (scale === null || scale === undefined) {
            scale = 20;
        }

        this.scale = new Point(scale, scale);
    }

    apply(filterManager, input, output, clearMode) {
        this.uniforms.filterMatrix = filterManager.calculateSpriteMatrix(this.maskMatrix, this.maskSprite);
        this.uniforms.scale.x = this.scale.x;
        this.uniforms.scale.y = this.scale.y;

        const wt = this.maskSprite.worldTransform;
        const lenX = Math.sqrt((wt.a * wt.a) + (wt.b * wt.b));
        const lenY = Math.sqrt((wt.c * wt.c) + (wt.d * wt.d));

        if (lenX !== 0 && lenY !== 0) {
            this.uniforms.rotation[0] = wt.a / lenX;
            this.uniforms.rotation[1] = wt.b / lenX;
            this.uniforms.rotation[2] = wt.c / lenY;
            this.uniforms.rotation[3] = wt.d / lenY;
        }

        filterManager.applyFilter(this, input, output, clearMode);
    }

    get map() {
        return this.uniforms.mapSampler;
    }

    set map(value) {
        this.uniforms.mapSampler = value;
    }
}

// ノイズフィルター
export class NoiseFilter extends Filter {
    constructor(noise = 0.5, seed = Math.random()) {
        const fragmentSrc = `
            precision highp float;
            varying vec2 vTextureCoord;
            varying vec4 vColor;
            uniform float uNoise;
            uniform float uSeed;
            uniform sampler2D uSampler;

            float rand(vec2 co)
            {
                return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
            }

            void main()
            {
                vec4 color = texture2D(uSampler, vTextureCoord);
                float randomValue = rand(gl_FragCoord.xy * uSeed);
                float diff = (randomValue - 0.5) * uNoise;

                // Un-premultiply alpha before applying the color matrix
                if (color.a > 0.0) {
                    color.rgb /= color.a;
                }

                color.r += diff;
                color.g += diff;
                color.b += diff;

                // Premultiply alpha again.
                color.rgb *= color.a;

                gl_FragColor = color;
            }
        `;

        super(Filter.defaultVertexSrc, fragmentSrc, {
            uNoise: 0,
            uSeed: 0
        });

        this.noise = noise;
        this.seed = seed;
    }

    get noise() {
        return this.uniforms.uNoise;
    }

    set noise(value) {
        this.uniforms.uNoise = value;
    }

    get seed() {
        return this.uniforms.uSeed;
    }

    set seed(value) {
        this.uniforms.uSeed = value;
    }
}

// FXAAフィルター（アンチエイリアシング）
export class FXAAFilter extends Filter {
    constructor() {
        const vertexSrc = `
            attribute vec2 aVertexPosition;
            uniform mat3 projectionMatrix;
            varying vec2 v_rgbNW;
            varying vec2 v_rgbNE;
            varying vec2 v_rgbSW;
            varying vec2 v_rgbSE;
            varying vec2 v_rgbM;
            varying vec2 vFragCoord;
            uniform vec4 inputSize;
            uniform vec4 outputFrame;

            vec4 filterVertexPosition( void )
            {
                vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;
                return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
            }

            void texcoords(vec2 fragCoord, vec2 inverseVP,
                           out vec2 v_rgbNW, out vec2 v_rgbNE,
                           out vec2 v_rgbSW, out vec2 v_rgbSE,
                           out vec2 v_rgbM) {
                v_rgbNW = (fragCoord + vec2(-1.0, -1.0)) * inverseVP;
                v_rgbNE = (fragCoord + vec2(1.0, -1.0)) * inverseVP;
                v_rgbSW = (fragCoord + vec2(-1.0, 1.0)) * inverseVP;
                v_rgbSE = (fragCoord + vec2(1.0, 1.0)) * inverseVP;
                v_rgbM = vec2(fragCoord * inverseVP);
            }

            void main(void) {
               gl_Position = filterVertexPosition();
               vFragCoord = aVertexPosition * outputFrame.zw;
               texcoords(vFragCoord, inputSize.zw, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);
            }
        `;

        const fragmentSrc = `
            varying vec2 v_rgbNW;
            varying vec2 v_rgbNE;
            varying vec2 v_rgbSW;
            varying vec2 v_rgbSE;
            varying vec2 v_rgbM;
            varying vec2 vFragCoord;
            uniform sampler2D uSampler;
            uniform highp vec4 inputSize;

            #ifndef FXAA_REDUCE_MIN
            #define FXAA_REDUCE_MIN   (1.0/ 128.0)
            #endif
            #ifndef FXAA_REDUCE_MUL
            #define FXAA_REDUCE_MUL   (1.0 / 8.0)
            #endif
            #ifndef FXAA_SPAN_MAX
            #define FXAA_SPAN_MAX     8.0
            #endif

            vec4 fxaa(sampler2D tex, vec2 fragCoord, vec2 inverseVP,
                      vec2 v_rgbNW, vec2 v_rgbNE,
                      vec2 v_rgbSW, vec2 v_rgbSE,
                      vec2 v_rgbM) {
                vec4 color;
                vec3 rgbNW = texture2D(tex, v_rgbNW).xyz;
                vec3 rgbNE = texture2D(tex, v_rgbNE).xyz;
                vec3 rgbSW = texture2D(tex, v_rgbSW).xyz;
                vec3 rgbSE = texture2D(tex, v_rgbSE).xyz;
                vec4 texColor = texture2D(tex, v_rgbM);
                vec3 rgbM  = texColor.xyz;
                vec3 luma = vec3(0.299, 0.587, 0.114);
                float lumaNW = dot(rgbNW, luma);
                float lumaNE = dot(rgbNE, luma);
                float lumaSW = dot(rgbSW, luma);
                float lumaSE = dot(rgbSE, luma);
                float lumaM  = dot(rgbM,  luma);
                float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
                float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

                mediump vec2 dir;
                dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
                dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

                float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *
                                      (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);

                float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
                dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
                          max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
                              dir * rcpDirMin)) * inverseVP;

                vec3 rgbA = 0.5 * (
                                   texture2D(tex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)).xyz +
                                   texture2D(tex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)).xyz);
                vec3 rgbB = rgbA * 0.5 + 0.25 * (
                                                 texture2D(tex, fragCoord * inverseVP + dir * -0.5).xyz +
                                                 texture2D(tex, fragCoord * inverseVP + dir * 0.5).xyz);

                float lumaB = dot(rgbB, luma);
                if ((lumaB < lumaMin) || (lumaB > lumaMax))
                    color = vec4(rgbA, texColor.a);
                else
                    color = vec4(rgbB, texColor.a);
                return color;
            }

            void main() {
                  vec4 color;
                  color = fxaa(uSampler, vFragCoord, inputSize.zw, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);
                  gl_FragColor = color;
            }
        `;

        super(vertexSrc, fragmentSrc);
    }
}

// フィルターコレクション
export const filters = {
    AlphaFilter,
    BlurFilter,
    BlurFilterPass,
    ColorMatrixFilter,
    DisplacementFilter,
    FXAAFilter,
    NoiseFilter
};

// デフォルトエクスポート
export default {
    Filter,
    AlphaFilter,
    BlurFilter,
    BlurFilterPass,
    ColorMatrixFilter,
    DisplacementFilter,
    FXAAFilter,
    NoiseFilter,
    filters
};
