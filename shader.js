/**
 * Shader Module
 * シェーダー関連のクラス（ShaderSystem、Program、GLProgram等）を含む
 */

// GLProgram - WebGLプログラムのラッパー
class GLProgram {
    constructor(program, uniformData) {
        this.program = program;
        this.uniformData = uniformData;
        this.uniformGroups = {};
        this.uniformDirtyGroups = {};
        this.uniformBufferBindings = {};
    }

    destroy() {
        this.uniformData = null;
        this.uniformGroups = null;
        this.uniformDirtyGroups = null;
        this.uniformBufferBindings = null;
        this.program = null;
    }
}

// Program - シェーダープログラムクラス
class Program {
    constructor(vertexSrc, fragmentSrc, name = 'pixi-shader') {
        this.id = Program.ProgramIdCount++;
        this.vertexSrc = vertexSrc || Program.defaultVertexSrc;
        this.fragmentSrc = fragmentSrc || Program.defaultFragmentSrc;
        this.name = name;
        this.glPrograms = {};
        this.syncUniforms = {};
        this.attributeData = {};
        this.uniformData = {};
        this.extra = {};
    }

    static from(vertexSrc, fragmentSrc, name) {
        const key = vertexSrc + fragmentSrc + name;

        let program = Program.ProgramCache[key];

        if (!program) {
            Program.ProgramCache[key] = program = new Program(vertexSrc, fragmentSrc, name);
        }

        return program;
    }

    destroy() {
        this.glPrograms = null;
        this.syncUniforms = null;
        this.attributeData = null;
        this.uniformData = null;
        this.extra = null;
    }
}

Program.ProgramIdCount = 0;
Program.ProgramCache = {};
Program.defaultVertexSrc = `
    attribute vec2 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat3 projectionMatrix;

    varying vec2 vTextureCoord;

    void main(void) {
        gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
        vTextureCoord = aTextureCoord;
    }
`;
Program.defaultFragmentSrc = `
    varying vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
`;

// Shader - シェーダークラス
class Shader {
    constructor(program, uniforms) {
        this.program = program;
        this.uniformGroup = uniforms || {};
        this.disposeRunner = { add: () => { }, remove: () => { } };
        this.uniformBindCount = 0;
    }

    static from(vertexSrc, fragmentSrc, uniforms, name) {
        const program = Program.from(vertexSrc, fragmentSrc, name);
        const shader = new Shader(program, uniforms);

        return shader;
    }

    destroy() {
        this.uniformGroup = null;
        this.program = null;
    }
}

// UniformGroup - ユニフォーム管理
class UniformGroup {
    constructor(uniforms, isStatic = false, isUbo = false) {
        this.uniforms = uniforms;
        this.group = true;
        this.syncUniforms = {};
        this.dirtyId = 0;
        this.id = UniformGroup.uboCount++;
        this.static = isStatic;
        this.ubo = isUbo;

        if (isUbo) {
            this.buffer = null;
            this.autoManage = true;
            this.size = 0;
        }
    }

    update() {
        this.dirtyId++;
    }

    add(name, uniforms, isStatic) {
        if (!this.uniforms[name]) {
            this.uniforms[name] = new UniformGroup(uniforms, isStatic);
        }
    }

    static from(uniforms, isStatic, isUbo) {
        return new UniformGroup(uniforms, isStatic, isUbo);
    }

    static uboFrom(uniforms, isStatic) {
        return new UniformGroup(uniforms, isStatic, true);
    }

    destroy() {
        this.uniforms = null;
    }
}

UniformGroup.uboCount = 0;

// シェーダーユーティリティ関数
const ShaderUtils = {
    // WebGLタイプからサイズを取得
    getSize(type) {
        switch (type) {
            case 'FLOAT':
            case 'INT':
            case 'UINT':
            case 'BOOL':
                return 1;
            case 'FLOAT_VEC2':
            case 'INT_VEC2':
            case 'UINT_VEC2':
            case 'BOOL_VEC2':
                return 2;
            case 'FLOAT_VEC3':
            case 'INT_VEC3':
            case 'UINT_VEC3':
            case 'BOOL_VEC3':
                return 3;
            case 'FLOAT_VEC4':
            case 'INT_VEC4':
            case 'UINT_VEC4':
            case 'BOOL_VEC4':
                return 4;
            case 'FLOAT_MAT2':
                return 4;
            case 'FLOAT_MAT3':
                return 9;
            case 'FLOAT_MAT4':
                return 16;
            default:
                return 1;
        }
    },

    // WebGLタイプを文字列に変換
    mapType(gl, type) {
        const typeMap = {
            [gl.FLOAT]: 'FLOAT',
            [gl.FLOAT_VEC2]: 'FLOAT_VEC2',
            [gl.FLOAT_VEC3]: 'FLOAT_VEC3',
            [gl.FLOAT_VEC4]: 'FLOAT_VEC4',
            [gl.INT]: 'INT',
            [gl.INT_VEC2]: 'INT_VEC2',
            [gl.INT_VEC3]: 'INT_VEC3',
            [gl.INT_VEC4]: 'INT_VEC4',
            [gl.UINT]: 'UINT',
            [gl.UINT_VEC2]: 'UINT_VEC2',
            [gl.UINT_VEC3]: 'UINT_VEC3',
            [gl.UINT_VEC4]: 'UINT_VEC4',
            [gl.BOOL]: 'BOOL',
            [gl.BOOL_VEC2]: 'BOOL_VEC2',
            [gl.BOOL_VEC3]: 'BOOL_VEC3',
            [gl.BOOL_VEC4]: 'BOOL_VEC4',
            [gl.FLOAT_MAT2]: 'FLOAT_MAT2',
            [gl.FLOAT_MAT3]: 'FLOAT_MAT3',
            [gl.FLOAT_MAT4]: 'FLOAT_MAT4',
            [gl.SAMPLER_2D]: 'SAMPLER_2D',
            [gl.SAMPLER_CUBE]: 'SAMPLER_CUBE',
            [gl.SAMPLER_2D_ARRAY]: 'SAMPLER_2D_ARRAY'
        };

        return typeMap[type] || 'UNKNOWN';
    },

    // デフォルト値を生成
    getDefaultValue(type, size) {
        switch (type) {
            case 'FLOAT':
            case 'INT':
            case 'UINT':
            case 'BOOL':
                return size === 1 ? 0 : new Array(size).fill(0);
            case 'FLOAT_VEC2':
            case 'INT_VEC2':
            case 'UINT_VEC2':
            case 'BOOL_VEC2':
                return new Float32Array(2);
            case 'FLOAT_VEC3':
            case 'INT_VEC3':
            case 'UINT_VEC3':
            case 'BOOL_VEC3':
                return new Float32Array(3);
            case 'FLOAT_VEC4':
            case 'INT_VEC4':
            case 'UINT_VEC4':
            case 'BOOL_VEC4':
                return new Float32Array(4);
            case 'FLOAT_MAT2':
                return new Float32Array(4);
            case 'FLOAT_MAT3':
                return new Float32Array(9);
            case 'FLOAT_MAT4':
                return new Float32Array(16);
            case 'SAMPLER_2D':
            case 'SAMPLER_CUBE':
            case 'SAMPLER_2D_ARRAY':
                return null;
            default:
                return null;
        }
    }
};

// シェーダーコンパイル関数
function compileShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Could not compile WebGL shader: ${info}`);
    }

    return shader;
}

// 属性データの取得
function getAttributeData(program, gl) {
    const attributes = {};
    const attributeCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

    for (let i = 0; i < attributeCount; i++) {
        const attribute = gl.getActiveAttrib(program, i);

        if (attribute.name.startsWith('gl_')) {
            continue;
        }

        const type = ShaderUtils.mapType(gl, attribute.type);
        const size = ShaderUtils.getSize(type);

        attributes[attribute.name] = {
            type: type,
            name: attribute.name,
            size: size,
            location: gl.getAttribLocation(program, attribute.name)
        };
    }

    return attributes;
}

// ユニフォームデータの取得
function getUniformData(program, gl) {
    const uniforms = {};
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

    for (let i = 0; i < uniformCount; i++) {
        const uniform = gl.getActiveUniform(program, i);
        const name = uniform.name.replace(/\[.*?\]$/, '');
        const isArray = !!uniform.name.match(/\[.*?\]$/);
        const type = ShaderUtils.mapType(gl, uniform.type);

        uniforms[name] = {
            name: name,
            index: i,
            type: type,
            size: uniform.size,
            isArray: isArray,
            value: ShaderUtils.getDefaultValue(type, uniform.size)
        };
    }

    return uniforms;
}

// プログラムの生成
function generateProgram(gl, program) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, program.vertexSrc);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, program.fragmentSrc);

    const webglProgram = gl.createProgram();

    gl.attachShader(webglProgram, vertexShader);
    gl.attachShader(webglProgram, fragmentShader);

    // TransformFeedbackの設定（WebGL2）
    if (program.extra && program.extra.transformFeedbackVaryings) {
        if (typeof gl.transformFeedbackVaryings === 'function') {
            const varyings = program.extra.transformFeedbackVaryings;
            gl.transformFeedbackVaryings(
                webglProgram,
                varyings.names,
                varyings.bufferMode === 'separate' ? gl.SEPARATE_ATTRIBS : gl.INTERLEAVED_ATTRIBS
            );
        }
    }

    gl.linkProgram(webglProgram);

    if (!gl.getProgramParameter(webglProgram, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(webglProgram);
        gl.deleteProgram(webglProgram);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        throw new Error(`Could not link WebGL program: ${info}`);
    }

    // 属性とユニフォームデータの取得
    program.attributeData = getAttributeData(webglProgram, gl);
    program.uniformData = getUniformData(webglProgram, gl);

    // WebGL1の場合、属性の場所を手動で設定
    if (!program.vertexSrc.includes('#version 300 es')) {
        const attributeNames = Object.keys(program.attributeData);
        attributeNames.sort((a, b) => a > b ? 1 : -1);

        for (let i = 0; i < attributeNames.length; i++) {
            program.attributeData[attributeNames[i]].location = i;
            gl.bindAttribLocation(webglProgram, i, attributeNames[i]);
        }

        gl.linkProgram(webglProgram);
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    // ユニフォームの場所を取得
    const uniformLocations = {};

    for (const name in program.uniformData) {
        const uniform = program.uniformData[name];
        uniformLocations[name] = {
            location: gl.getUniformLocation(webglProgram, name),
            value: ShaderUtils.getDefaultValue(uniform.type, uniform.size)
        };
    }

    return new GLProgram(webglProgram, uniformLocations);
}

// ShaderSystem - シェーダー管理システム
class ShaderSystem {
    constructor(renderer) {
        this.destroyed = false;
        this.renderer = renderer;
        this.gl = null;
        this.shader = null;
        this.program = null;
        this.cache = {};
        this._uboCache = {};
        this.id = ShaderSystem.systemIdCount++;
    }

    contextChange(gl) {
        this.gl = gl;
        this.reset();
    }

    bind(shader, dontSync) {
        shader.disposeRunner.add(this);
        shader.uniforms.globals = this.renderer.globalUniforms;

        const program = shader.program;
        const glProgram = program.glPrograms[this.renderer.CONTEXT_UID] || this.generateProgram(shader);

        this.shader = shader;

        if (this.program !== program) {
            this.program = program;
            this.gl.useProgram(glProgram.program);
        }

        if (!dontSync) {
            this.syncUniformGroup(shader.uniformGroup);
        }

        return glProgram;
    }

    setUniforms(uniforms) {
        const shader = this.shader.program;
        const glProgram = shader.glPrograms[this.renderer.CONTEXT_UID];

        shader.syncUniforms(glProgram.uniformData, uniforms, this.renderer);
    }

    syncUniformGroup(group, syncData) {
        const glProgram = this.getGlProgram();

        if (!group.static || group.dirtyId !== glProgram.uniformDirtyGroups[group.id]) {
            glProgram.uniformDirtyGroups[group.id] = group.dirtyId;
            this.syncUniforms(group, glProgram, syncData);
        }
    }

    syncUniforms(group, glProgram, syncData) {
        const syncFunc = group.syncUniforms[this.shader.program.id] || this.createSyncGroups(group);
        syncFunc(glProgram.uniformData, group.uniforms, this.renderer, syncData);
    }

    createSyncGroups(group) {
        const id = this.getSignature(group, this.shader.program.uniformData, 'u');

        if (!this.cache[id]) {
            this.cache[id] = this.generateUniformSyncFunction(group, this.shader.program.uniformData);
        }

        group.syncUniforms[this.shader.program.id] = this.cache[id];

        return group.syncUniforms[this.shader.program.id];
    }

    generateUniformSyncFunction(group, uniformData) {
        // 簡略化されたユニフォーム同期関数の生成
        return function (ud, uv, renderer, syncData) {
            for (const name in uv) {
                if (ud[name]) {
                    const uniform = ud[name];
                    const value = uv[name];

                    if (uniform.location && value !== undefined) {
                        // WebGLユニフォームの設定
                        renderer.gl.uniform1f(uniform.location, value);
                    }
                }
            }
        };
    }

    syncUniformBufferGroup(group, name) {
        const glProgram = this.getGlProgram();

        if (!group.static || group.dirtyId !== 0 || !glProgram.uniformGroups[group.id]) {
            group.dirtyId = 0;

            const syncFunc = glProgram.uniformGroups[group.id] ||
                this.createSyncBufferGroup(group, glProgram, name);

            group.buffer.update();
            syncFunc(glProgram.uniformData, group.uniforms, this.renderer, {}, group.buffer);
        }

        this.renderer.buffer.bindBufferBase(group.buffer, glProgram.uniformBufferBindings[name]);
    }

    createSyncBufferGroup(group, glProgram, name) {
        const gl = this.renderer.gl;

        this.renderer.buffer.bind(group.buffer);

        const uniformBlockIndex = gl.getUniformBlockIndex(glProgram.program, name);
        glProgram.uniformBufferBindings[name] = this.shader.uniformBindCount;

        gl.uniformBlockBinding(glProgram.program, uniformBlockIndex, this.shader.uniformBindCount);
        this.shader.uniformBindCount++;

        const signature = this.getSignature(group, this.shader.program.uniformData, 'ubo');

        let uboData = this._uboCache[signature];

        if (!uboData) {
            uboData = this._uboCache[signature] = this.generateUniformBufferSync(group, this.shader.program.uniformData);
        }

        if (group.autoManage) {
            const data = new Float32Array(uboData.size / 4);
            group.buffer.update(data);
        }

        glProgram.uniformGroups[group.id] = uboData.syncFunc;

        return glProgram.uniformGroups[group.id];
    }

    generateUniformBufferSync(group, uniformData) {
        // 簡略化されたUBO同期関数の生成
        return {
            size: 256, // デフォルトサイズ
            syncFunc: function (ud, uv, renderer, syncData, buffer) {
                // UBOの更新処理
                renderer.buffer.update(buffer);
            }
        };
    }

    getSignature(group, uniformData, prefix) {
        const uniforms = group.uniforms;
        const strings = [prefix + '-'];

        for (const name in uniforms) {
            strings.push(name);

            if (uniformData[name]) {
                strings.push(uniformData[name].type);
            }
        }

        return strings.join('-');
    }

    getGlProgram() {
        if (this.shader) {
            return this.shader.program.glPrograms[this.renderer.CONTEXT_UID];
        }

        return null;
    }

    generateProgram(shader) {
        const gl = this.gl;
        const program = shader.program;
        const glProgram = generateProgram(gl, program);

        program.glPrograms[this.renderer.CONTEXT_UID] = glProgram;

        return glProgram;
    }

    reset() {
        this.program = null;
        this.shader = null;
    }

    disposeShader(shader) {
        if (this.shader === shader) {
            this.shader = null;
        }
    }

    destroy() {
        this.renderer = null;
        this.destroyed = true;
    }
}

ShaderSystem.systemIdCount = 0;

// エクスポート
export {
    GLProgram,
    Program,
    Shader,
    UniformGroup,
    ShaderUtils,
    ShaderSystem,
    compileShader,
    getAttributeData,
    getUniformData,
    generateProgram
};

// デフォルトエクスポート
export default {
    GLProgram,
    Program,
    Shader,
    UniformGroup,
    ShaderUtils,
    ShaderSystem,
    compileShader,
    getAttributeData,
    getUniformData,
    generateProgram
};
