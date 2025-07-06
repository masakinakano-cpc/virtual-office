/**
 * WebGL Rendering Module
 * WebGLレンダリング、システム管理、各種レンダリングシステムを含む
 */

// WebGL関連の定数とヘルパー関数
const YB = (i, e = []) => {
    // BlendMode設定
    e[0] = [i.ONE, i.ONE_MINUS_SRC_ALPHA]; // NORMAL
    e[1] = [i.ONE, i.ONE]; // ADD
    e[2] = [i.DST_COLOR, i.ONE_MINUS_SRC_ALPHA, i.ONE, i.ONE_MINUS_SRC_ALPHA]; // MULTIPLY
    e[3] = [i.ONE, i.ONE_MINUS_SRC_COLOR, i.ONE, i.ONE_MINUS_SRC_ALPHA]; // SCREEN
    // その他のブレンドモード...
    return e;
};

// WebGL State管理
class WebGLState {
    constructor() {
        this.gl = null;
        this.stateId = 0;
        this.polygonOffset = 0;
        this.blendMode = 0; // NONE
        this._blendEq = false;
        this.map = [];
        this.checks = [];
        this.defaultState = { data: 0, blend: true };
    }

    contextChange(gl) {
        this.gl = gl;
        this.blendModes = YB(gl);
        this.set(this.defaultState);
        this.reset();
    }

    set(state) {
        state = state || this.defaultState;
        if (this.stateId !== state.data) {
            let diff = this.stateId ^ state.data;
            let i = 0;
            while (diff) {
                if (diff & 1) {
                    this.map[i].call(this, !!(state.data & (1 << i)));
                }
                diff = diff >> 1;
                i++;
            }
            this.stateId = state.data;
        }
    }

    setBlendMode(mode) {
        if (mode === this.blendMode) return;
        this.blendMode = mode;
        const blend = this.blendModes[mode];
        const gl = this.gl;

        if (blend.length === 2) {
            gl.blendFunc(blend[0], blend[1]);
        } else {
            gl.blendFuncSeparate(blend[0], blend[1], blend[2], blend[3]);
        }
    }

    reset() {
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
        this.forceState(this.defaultState);
        this.blendMode = -1;
        this.setBlendMode(0);
    }

    forceState(state) {
        state = state || this.defaultState;
        for (let i = 0; i < this.map.length; i++) {
            this.map[i].call(this, !!(state.data & (1 << i)));
        }
        this.stateId = state.data;
    }

    destroy() {
        this.gl = null;
    }
}

// SystemManager - レンダラーのシステム管理
class SystemManager {
    constructor() {
        this.runners = {};
        this._systemsHash = {};
    }

    setup(config) {
        this.addRunners(...config.runners);
        const priority = (config.priority ?? []).filter(name => config.systems[name]);
        const systems = [...priority, ...Object.keys(config.systems).filter(name => !priority.includes(name))];

        for (const name of systems) {
            this.addSystem(config.systems[name], name);
        }
    }

    addRunners(...names) {
        names.forEach(name => {
            this.runners[name] = { items: [], emit: () => { } };
        });
    }

    addSystem(SystemClass, name) {
        const system = new SystemClass(this);
        if (this[name]) {
            throw new Error(`System name "${name}" is already in use`);
        }
        this[name] = system;
        this._systemsHash[name] = system;
        return this;
    }

    destroy() {
        Object.values(this.runners).forEach(runner => {
            if (runner.destroy) runner.destroy();
        });
        this._systemsHash = {};
    }
}

// Renderer - メインレンダラークラス
class Renderer extends SystemManager {
    constructor(options = {}) {
        super();
        this.type = 'WEBGL';
        this.gl = null;
        this.CONTEXT_UID = 0;
        this.options = options;

        // システム設定
        const systemConfig = {
            runners: ['init', 'destroy', 'contextChange', 'resize', 'render'],
            systems: {
                state: WebGLState,
                // 他のシステムをここに追加
            },
            priority: ['state']
        };

        this.setup(systemConfig);
    }

    static test(options) {
        // WebGL対応チェック
        if (options?.forceCanvas) return false;
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }

    render(displayObject, options) {
        if (!this.gl) return;

        // レンダリング処理
        this.runners.render.emit();

        if (displayObject && displayObject.render) {
            displayObject.render(this);
        }
    }

    resize(width, height) {
        this.runners.resize.emit(width, height);
    }

    destroy(removeView = false) {
        this.runners.destroy.emit({ removeView });
        super.destroy();
    }
}

// GeometrySystem - ジオメトリ管理
class GeometrySystem {
    constructor(renderer) {
        this.renderer = renderer;
        this.managedGeometries = {};
        this.gl = null;
        this.CONTEXT_UID = 0;
    }

    contextChange() {
        this.gl = this.renderer.gl;
        this.CONTEXT_UID = this.renderer.CONTEXT_UID;
    }

    bind(geometry, shader) {
        if (!geometry || !shader) return;

        // VAO（Vertex Array Object）の設定
        const gl = this.gl;
        const program = shader.program;

        // 属性の設定
        this.activateVao(geometry, program);
    }

    activateVao(geometry, program) {
        const gl = this.gl;
        const attributes = geometry.attributes;

        for (const name in attributes) {
            const attribute = attributes[name];
            const location = program.attributeData[name]?.location;

            if (location !== undefined) {
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(
                    location,
                    attribute.size,
                    attribute.type || gl.FLOAT,
                    attribute.normalized,
                    attribute.stride,
                    attribute.start
                );
            }
        }
    }

    draw(topology, count, start, instanceCount) {
        const gl = this.gl;

        if (instanceCount && instanceCount > 1) {
            gl.drawArraysInstanced(topology, start || 0, count, instanceCount);
        } else {
            gl.drawArrays(topology, start || 0, count);
        }
    }

    destroy() {
        this.renderer = null;
        this.gl = null;
    }
}

// ProjectionSystem - プロジェクション管理
class ProjectionSystem {
    constructor(renderer) {
        this.renderer = renderer;
        this.destinationFrame = null;
        this.sourceFrame = null;
        this.projectionMatrix = new Float32Array(16);
    }

    update(destinationFrame, sourceFrame) {
        this.destinationFrame = destinationFrame;
        this.sourceFrame = sourceFrame;
        this.calculateProjection();
    }

    calculateProjection() {
        const matrix = this.projectionMatrix;
        const frame = this.sourceFrame;

        if (!frame) return;

        // 2D投影行列の計算
        matrix[0] = 2 / frame.width;
        matrix[5] = -2 / frame.height;
        matrix[12] = -1;
        matrix[13] = 1;
        matrix[15] = 1;
    }

    destroy() {
        this.renderer = null;
    }
}

// エクスポート
export {
    Renderer,
    SystemManager,
    WebGLState,
    GeometrySystem,
    ProjectionSystem,
    YB as createBlendModes
};

// デフォルトエクスポート
export default {
    Renderer,
    SystemManager,
    WebGLState,
    GeometrySystem,
    ProjectionSystem,
    createBlendModes: YB
};
