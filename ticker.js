/**
 * Ticker Module
 * Ticker、TickerPlugin関連のアニメーションとタイミング管理クラスを含む
 */

// TickerListener - Tickerのリスナー管理
class TickerListener {
    constructor(fn, context = null, priority = 0, once = false) {
        this.next = null;
        this.previous = null;
        this._destroyed = false;
        this.fn = fn;
        this.context = context;
        this.priority = priority;
        this.once = once;
    }

    match(fn, context = null) {
        return this.fn === fn && this.context === context;
    }

    emit(deltaTime) {
        if (this.fn) {
            if (this.context) {
                this.fn.call(this.context, deltaTime);
            } else {
                this.fn(deltaTime);
            }
        }

        const redirect = this.next;

        if (this.once) {
            this.destroy(true);
        }

        if (this._destroyed) {
            this.next = null;
        }

        return redirect;
    }

    connect(previous) {
        this.previous = previous;
        if (previous.next) {
            previous.next.previous = this;
        }
        this.next = previous.next;
        previous.next = this;
    }

    destroy(hard = false) {
        this._destroyed = true;
        this.fn = null;
        this.context = null;

        if (this.previous) {
            this.previous.next = this.next;
        }

        if (this.next) {
            this.next.previous = this.previous;
        }

        const redirect = this.next;

        this.next = hard ? null : redirect;
        this.previous = null;

        return redirect;
    }
}

// 優先度定数
const UPDATE_PRIORITY = {
    INTERACTION: 50,
    HIGH: 25,
    NORMAL: 0,
    LOW: -25,
    UTILITY: -50
};

// Ticker - メインのティッカークラス
class Ticker {
    constructor() {
        this.autoStart = false;
        this.deltaTime = 1;
        this.lastTime = -1;
        this.speed = 1;
        this.started = false;
        this._requestId = null;
        this._maxElapsedMS = 100;
        this._minElapsedMS = 0;
        this._protected = false;
        this._lastFrame = -1;
        this._head = new TickerListener(null, null, Infinity);
        this.deltaMS = 1 / Ticker.targetFPMS;
        this.elapsedMS = 1 / Ticker.targetFPMS;

        this._tick = (time) => {
            this._requestId = null;

            if (this.started) {
                this.update(time);

                if (this.started && this._requestId === null && this._head.next) {
                    this._requestId = requestAnimationFrame(this._tick);
                }
            }
        };
    }

    _requestIfNeeded() {
        if (this._requestId === null && this._head.next) {
            this.lastTime = performance.now();
            this._lastFrame = this.lastTime;
            this._requestId = requestAnimationFrame(this._tick);
        }
    }

    _cancelIfNeeded() {
        if (this._requestId !== null) {
            cancelAnimationFrame(this._requestId);
            this._requestId = null;
        }
    }

    _startIfPossible() {
        if (this.started) {
            this._requestIfNeeded();
        } else if (this.autoStart) {
            this.start();
        }
    }

    add(fn, context, priority = UPDATE_PRIORITY.NORMAL) {
        return this._addListener(new TickerListener(fn, context, priority));
    }

    addOnce(fn, context, priority = UPDATE_PRIORITY.NORMAL) {
        return this._addListener(new TickerListener(fn, context, priority, true));
    }

    _addListener(listener) {
        let current = this._head.next;
        let previous = this._head;

        if (!current) {
            listener.connect(previous);
        } else {
            while (current) {
                if (listener.priority > current.priority) {
                    listener.connect(previous);
                    break;
                }
                previous = current;
                current = current.next;
            }

            if (!listener.previous) {
                listener.connect(previous);
            }
        }

        this._startIfPossible();

        return this;
    }

    remove(fn, context) {
        let listener = this._head.next;

        while (listener) {
            if (listener.match(fn, context)) {
                listener = listener.destroy();
            } else {
                listener = listener.next;
            }
        }

        if (!this._head.next) {
            this._cancelIfNeeded();
        }

        return this;
    }

    get count() {
        if (!this._head) {
            return 0;
        }

        let count = 0;
        let current = this._head;

        while ((current = current.next)) {
            count++;
        }

        return count;
    }

    start() {
        if (!this.started) {
            this.started = true;
            this._requestIfNeeded();
        }
    }

    stop() {
        if (this.started) {
            this.started = false;
            this._cancelIfNeeded();
        }
    }

    destroy() {
        if (!this._protected) {
            this.stop();

            let listener = this._head.next;

            while (listener) {
                listener = listener.destroy(true);
            }

            this._head.destroy();
            this._head = null;
        }
    }

    update(currentTime = performance.now()) {
        let elapsedMS;

        if (currentTime > this.lastTime) {
            elapsedMS = this.elapsedMS = currentTime - this.lastTime;

            if (elapsedMS > this._maxElapsedMS) {
                elapsedMS = this._maxElapsedMS;
            }

            elapsedMS *= this.speed;

            if (this._minElapsedMS) {
                const delta = currentTime - this._lastFrame | 0;

                if (delta < this._minElapsedMS) {
                    return;
                }

                this._lastFrame = currentTime - (delta % this._minElapsedMS);
            }

            this.deltaMS = elapsedMS;
            this.deltaTime = this.deltaMS * Ticker.targetFPMS;

            const head = this._head;
            let listener = head.next;

            while (listener) {
                listener = listener.emit(this.deltaTime);
            }

            if (!head.next) {
                this._cancelIfNeeded();
            }
        } else {
            this.deltaTime = this.deltaMS = this.elapsedMS = 0;
        }

        this.lastTime = currentTime;
    }

    get FPS() {
        return 1000 / this.elapsedMS;
    }

    get minFPS() {
        return 1000 / this._maxElapsedMS;
    }

    set minFPS(fps) {
        const minFPS = Math.min(this.maxFPS, fps);
        const targetFPMS = Math.min(Math.max(0, minFPS) / 1000, Ticker.targetFPMS);

        this._maxElapsedMS = 1 / targetFPMS;
    }

    get maxFPS() {
        if (this._minElapsedMS) {
            return Math.round(1000 / this._minElapsedMS);
        }

        return 0;
    }

    set maxFPS(fps) {
        if (fps === 0) {
            this._minElapsedMS = 0;
        } else {
            const maxFPS = Math.max(this.minFPS, fps);
            this._minElapsedMS = 1 / (maxFPS / 1000);
        }
    }

    static get shared() {
        if (!Ticker._shared) {
            const ticker = Ticker._shared = new Ticker();
            ticker.autoStart = true;
            ticker._protected = true;
        }

        return Ticker._shared;
    }

    static get system() {
        if (!Ticker._system) {
            const ticker = Ticker._system = new Ticker();
            ticker.autoStart = true;
            ticker._protected = true;
        }

        return Ticker._system;
    }
}

// 60FPSターゲット
Ticker.targetFPMS = 0.06;

// TickerPlugin - アプリケーション用のTickerプラグイン
class TickerPlugin {
    static init(options) {
        options = Object.assign({
            autoStart: true,
            sharedTicker: false
        }, options);

        Object.defineProperty(this, 'ticker', {
            set(ticker) {
                if (this._ticker && this._ticker.remove) {
                    this._ticker.remove(this.render, this);
                }
                this._ticker = ticker;
                if (ticker && ticker.add) {
                    ticker.add(this.render, this, UPDATE_PRIORITY.LOW);
                }
            },
            get() {
                return this._ticker;
            }
        });

        this.stop = () => {
            this._ticker.stop();
        };

        this.start = () => {
            this._ticker.start();
        };

        this._ticker = null;
        this.ticker = options.sharedTicker ? Ticker.shared : new Ticker();

        if (options.autoStart) {
            this.start();
        }
    }

    static destroy() {
        if (this._ticker) {
            const oldTicker = this._ticker;
            this.ticker = null;
            oldTicker.destroy();
        }
    }
}

// AnimationFrame - requestAnimationFrameのポリフィル
class AnimationFrame {
    constructor() {
        this.nativeRAF = globalThis.requestAnimationFrame;
        this.nativeCAF = globalThis.cancelAnimationFrame;

        this._tick = (time) => {
            this._head.emit(time);
        };

        this._emptyFrame = new TickerListener(null, null, Infinity);
        this._head = new TickerListener(this._tick, null, Infinity);
    }

    requestAnimationFrame(callback) {
        if (!this._head.next) {
            const id = this.nativeRAF(this._tick);
            this._head.next = this._emptyFrame;
            this._emptyFrame.previous = this._head;
            return id;
        }

        return ++AnimationFrame._uid;
    }

    cancelAnimationFrame(id) {
        if (this._head.next) {
            this._head.next = null;
            this._emptyFrame.previous = null;
            this.nativeCAF(id);
        }
    }
}

AnimationFrame._uid = 0;

// DeltaTime - デルタタイム計算ユーティリティ
class DeltaTime {
    constructor() {
        this.deltaTime = 0;
        this.elapsedMS = 0;
        this.lastTime = -1;
        this.speed = 1;
        this.minFPS = 10;
        this.maxFPS = 60;
    }

    update(currentTime = performance.now()) {
        if (this.lastTime === -1) {
            this.lastTime = currentTime;
            return;
        }

        const elapsedMS = currentTime - this.lastTime;
        const maxElapsedMS = 1000 / this.minFPS;
        const minElapsedMS = 1000 / this.maxFPS;

        this.elapsedMS = Math.min(elapsedMS, maxElapsedMS) * this.speed;

        if (this.elapsedMS < minElapsedMS) {
            return;
        }

        this.deltaTime = this.elapsedMS / 16.66667; // 60fps基準
        this.lastTime = currentTime;
    }

    reset() {
        this.lastTime = -1;
        this.deltaTime = 0;
        this.elapsedMS = 0;
    }
}

// FrameCounter - FPS計測
class FrameCounter {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.updateInterval = 1000; // 1秒間隔で更新
    }

    update() {
        this.frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastTime;

        if (elapsed >= this.updateInterval) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }

    reset() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
    }
}

// Scheduler - タスクスケジューラー
class Scheduler {
    constructor() {
        this.tasks = [];
        this.running = false;
        this.currentTime = 0;
    }

    schedule(callback, delay = 0, repeat = false) {
        const task = {
            id: Scheduler._taskId++,
            callback,
            delay,
            repeat,
            nextTime: this.currentTime + delay,
            active: true
        };

        this.tasks.push(task);
        return task.id;
    }

    unschedule(taskId) {
        const index = this.tasks.findIndex(task => task.id === taskId);
        if (index !== -1) {
            this.tasks[index].active = false;
        }
    }

    update(deltaTime) {
        this.currentTime += deltaTime;

        for (let i = this.tasks.length - 1; i >= 0; i--) {
            const task = this.tasks[i];

            if (!task.active) {
                this.tasks.splice(i, 1);
                continue;
            }

            if (this.currentTime >= task.nextTime) {
                task.callback();

                if (task.repeat) {
                    task.nextTime = this.currentTime + task.delay;
                } else {
                    this.tasks.splice(i, 1);
                }
            }
        }
    }

    clear() {
        this.tasks = [];
    }

    start() {
        this.running = true;
    }

    stop() {
        this.running = false;
    }
}

Scheduler._taskId = 0;

// Easing - イージング関数
const Easing = {
    linear: (t) => t,

    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => (--t) * t * t + 1,
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

    easeInQuart: (t) => t * t * t * t,
    easeOutQuart: (t) => 1 - (--t) * t * t * t,
    easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

    easeInSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
    easeOutSine: (t) => Math.sin((t * Math.PI) / 2),
    easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,

    easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: (t) => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
        return (2 - Math.pow(2, -20 * t + 10)) / 2;
    }
};

// Tween - 簡単なトゥイーンクラス
class Tween {
    constructor(target, duration = 1000, easing = Easing.linear) {
        this.target = target;
        this.duration = duration;
        this.easing = easing;
        this.startValues = {};
        this.endValues = {};
        this.currentTime = 0;
        this.completed = false;
        this.onComplete = null;
        this.onUpdate = null;
    }

    to(properties) {
        for (const prop in properties) {
            this.startValues[prop] = this.target[prop];
            this.endValues[prop] = properties[prop];
        }
        return this;
    }

    onCompleteCallback(callback) {
        this.onComplete = callback;
        return this;
    }

    onUpdateCallback(callback) {
        this.onUpdate = callback;
        return this;
    }

    update(deltaTime) {
        if (this.completed) return;

        this.currentTime += deltaTime;
        const progress = Math.min(this.currentTime / this.duration, 1);
        const easedProgress = this.easing(progress);

        for (const prop in this.endValues) {
            const start = this.startValues[prop];
            const end = this.endValues[prop];
            this.target[prop] = start + (end - start) * easedProgress;
        }

        if (this.onUpdate) {
            this.onUpdate(this.target, progress);
        }

        if (progress >= 1) {
            this.completed = true;
            if (this.onComplete) {
                this.onComplete(this.target);
            }
        }
    }

    reset() {
        this.currentTime = 0;
        this.completed = false;
        for (const prop in this.startValues) {
            this.target[prop] = this.startValues[prop];
        }
    }
}

// エクスポート
export {
    TickerListener,
    UPDATE_PRIORITY,
    Ticker,
    TickerPlugin,
    AnimationFrame,
    DeltaTime,
    FrameCounter,
    Scheduler,
    Easing,
    Tween
};

// デフォルトエクスポート
export default {
    TickerListener,
    UPDATE_PRIORITY,
    Ticker,
    TickerPlugin,
    AnimationFrame,
    DeltaTime,
    FrameCounter,
    Scheduler,
    Easing,
    Tween
};
