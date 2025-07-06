// EventEmitter実装

export class EventEmitter {
    constructor() {
        this._events = {};
        this._eventsCount = 0;
        this._maxListeners = 10;
    }

    // イベントリスナーを追加
    on(event, listener) {
        if (typeof listener !== 'function') {
            throw new TypeError('listener must be a function');
        }

        if (!this._events[event]) {
            this._events[event] = [];
            this._eventsCount++;
        }

        this._events[event].push(listener);

        // 最大リスナー数の警告
        if (this._events[event].length > this._maxListeners) {
            console.warn(`MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ${this._events[event].length} ${event} listeners added.`);
        }

        return this;
    }

    // 一度だけ実行されるリスナーを追加
    once(event, listener) {
        if (typeof listener !== 'function') {
            throw new TypeError('listener must be a function');
        }

        const onceWrapper = (...args) => {
            this.off(event, onceWrapper);
            listener.apply(this, args);
        };

        onceWrapper.listener = listener;
        return this.on(event, onceWrapper);
    }

    // イベントリスナーを削除
    off(event, listener) {
        if (!this._events[event]) {
            return this;
        }

        if (!listener) {
            // 全てのリスナーを削除
            delete this._events[event];
            this._eventsCount--;
            return this;
        }

        const listeners = this._events[event];
        for (let i = listeners.length - 1; i >= 0; i--) {
            if (listeners[i] === listener || listeners[i].listener === listener) {
                listeners.splice(i, 1);
                break;
            }
        }

        if (listeners.length === 0) {
            delete this._events[event];
            this._eventsCount--;
        }

        return this;
    }

    // イベントを発火
    emit(event, ...args) {
        if (!this._events[event]) {
            return false;
        }

        const listeners = this._events[event].slice(); // コピーを作成
        for (const listener of listeners) {
            try {
                listener.apply(this, args);
            } catch (error) {
                console.error('EventEmitter error:', error);
            }
        }

        return true;
    }

    // 指定されたイベントのリスナー数を取得
    listenerCount(event) {
        return this._events[event] ? this._events[event].length : 0;
    }

    // 指定されたイベントのリスナーを取得
    listeners(event) {
        return this._events[event] ? this._events[event].slice() : [];
    }

    // 全てのイベント名を取得
    eventNames() {
        return Object.keys(this._events);
    }

    // 全てのリスナーを削除
    removeAllListeners(event) {
        if (event) {
            if (this._events[event]) {
                delete this._events[event];
                this._eventsCount--;
            }
        } else {
            this._events = {};
            this._eventsCount = 0;
        }
        return this;
    }

    // 最大リスナー数を設定
    setMaxListeners(n) {
        if (typeof n !== 'number' || n < 0) {
            throw new TypeError('n must be a non-negative number');
        }
        this._maxListeners = n;
        return this;
    }

    // 最大リスナー数を取得
    getMaxListeners() {
        return this._maxListeners;
    }

    // prependListenerメソッド（リスナーを先頭に追加）
    prependListener(event, listener) {
        if (typeof listener !== 'function') {
            throw new TypeError('listener must be a function');
        }

        if (!this._events[event]) {
            this._events[event] = [];
            this._eventsCount++;
        }

        this._events[event].unshift(listener);
        return this;
    }

    // prependOnceListenerメソッド（一度だけ実行されるリスナーを先頭に追加）
    prependOnceListener(event, listener) {
        if (typeof listener !== 'function') {
            throw new TypeError('listener must be a function');
        }

        const onceWrapper = (...args) => {
            this.off(event, onceWrapper);
            listener.apply(this, args);
        };

        onceWrapper.listener = listener;
        return this.prependListener(event, onceWrapper);
    }

    // rawListenersメソッド（ラップされていないリスナーを取得）
    rawListeners(event) {
        return this._events[event] ? this._events[event].slice() : [];
    }
}

// 元のコードのmAクラス（互換性のため）
export class mA extends EventEmitter {
    constructor() {
        super();
    }

    // addListener（onのエイリアス）
    addListener(event, listener) {
        return this.on(event, listener);
    }

    // removeListener（offのエイリアス）
    removeListener(event, listener) {
        return this.off(event, listener);
    }
}

// デフォルトエクスポート
export default EventEmitter;

// 静的メソッド
EventEmitter.defaultMaxListeners = 10;

EventEmitter.listenerCount = function (emitter, event) {
    if (typeof emitter.listenerCount === 'function') {
        return emitter.listenerCount(event);
    }
    return 0;
};

// ユーティリティ関数
export function createEventEmitter() {
    return new EventEmitter();
}

// 高性能なイベント発信器（元のコードのht相当）
export class ht {
    constructor(e) {
        this.items = [];
        this.ids = [];
        this.count = 0;
        this._name = e;
        this._aliasCount = 0;
    }

    emit(e, t, A, s, r, n, o, a) {
        if (arguments.length > 8)
            throw new Error("max arguments reached");

        const { name: h, items: g } = this;
        this._aliasCount++;

        for (let l = 0, c = g.length; l < c; l++)
            g[l][h](e, t, A, s, r, n, o, a);

        if (g === this.items && this._aliasCount--, this);
        return this;
    }

    ensureNonAliasedItems() {
        this._aliasCount > 0 && this.items.length > 1 && (this._aliasCount = 0,
            this.items = this.items.slice(0));
    }

    add(e) {
        return e[this._name] && (this.ensureNonAliasedItems(),
            this.remove(e),
            this.items.push(e)),
            this;
    }

    remove(e) {
        const t = this.items.indexOf(e);
        return t !== -1 && (this.ensureNonAliasedItems(),
            this.items.splice(t, 1)),
            this;
    }

    contains(e) {
        return this.items.includes(e);
    }

    removeAll() {
        return this.ensureNonAliasedItems(),
            this.items.length = 0,
            this;
    }

    destroy() {
        this.removeAll();
        this.items = null;
        this._name = null;
    }

    get empty() {
        return this.items.length === 0;
    }

    get name() {
        return this._name;
    }
}

// プロパティエイリアス
Object.defineProperties(ht.prototype, {
    dispatch: {
        value: ht.prototype.emit
    },
    run: {
        value: ht.prototype.emit
    }
});

// 軽量なイベントプール
export class ho {
    constructor() {
        this.elements = [];
        this.ids = [];
        this.count = 0;
    }

    clear() {
        for (let e = 0; e < this.count; e++)
            this.elements[e] = null;
        this.count = 0;
    }
}

// イベントタイプ列挙
export const EventType = {
    ADDED: 'added',
    REMOVED: 'removed',
    CLICK: 'click',
    POINTER_DOWN: 'pointerdown',
    POINTER_UP: 'pointerup',
    POINTER_MOVE: 'pointermove',
    POINTER_OVER: 'pointerover',
    POINTER_OUT: 'pointerout',
    POINTER_TAP: 'pointertap',
    POINTER_UPOUTSIDE: 'pointerupoutside',
    POINTER_CANCEL: 'pointercancel',
    MOUSE_DOWN: 'mousedown',
    MOUSE_UP: 'mouseup',
    MOUSE_MOVE: 'mousemove',
    MOUSE_OVER: 'mouseover',
    MOUSE_OUT: 'mouseout',
    TOUCH_START: 'touchstart',
    TOUCH_END: 'touchend',
    TOUCH_MOVE: 'touchmove',
    TOUCH_CANCEL: 'touchcancel',
    COMPLETE: 'complete',
    LOADED: 'loaded',
    ERROR: 'error',
    PROGRESS: 'progress',
    UPDATE: 'update',
    RESIZE: 'resize',
    DESTROYED: 'destroyed'
};

// イベントミックスイン（既存のオブジェクトにイベント機能を追加）
export function addEventMixin(target) {
    const emitter = new EventEmitter();

    target.on = emitter.on.bind(emitter);
    target.off = emitter.off.bind(emitter);
    target.once = emitter.once.bind(emitter);
    target.emit = emitter.emit.bind(emitter);
    target.removeAllListeners = emitter.removeAllListeners.bind(emitter);
    target.listenerCount = emitter.listenerCount.bind(emitter);
    target.listeners = emitter.listeners.bind(emitter);
    target.eventNames = emitter.eventNames.bind(emitter);

    return target;
}

// グローバルイベントバス
export const globalEventBus = new EventEmitter();

// イベントデバッグ用ユーティリティ
export class EventDebugger {
    constructor(emitter, options = {}) {
        this.emitter = emitter;
        this.options = {
            logEvents: true,
            logListeners: false,
            maxLogEntries: 100,
            ...options
        };
        this.eventLog = [];
        this.originalEmit = emitter.emit.bind(emitter);

        if (this.options.logEvents) {
            this.enableEventLogging();
        }
    }

    enableEventLogging() {
        this.emitter.emit = (event, ...args) => {
            this.logEvent(event, args);
            return this.originalEmit(event, ...args);
        };
    }

    logEvent(event, args) {
        const entry = {
            timestamp: Date.now(),
            event,
            args: args.slice(),
            listenerCount: this.emitter.listenerCount(event)
        };

        this.eventLog.push(entry);

        if (this.eventLog.length > this.options.maxLogEntries) {
            this.eventLog.shift();
        }

        if (this.options.logEvents) {
            console.log(`[EventEmitter] ${event}`, entry);
        }
    }

    getEventLog() {
        return this.eventLog.slice();
    }

    clearEventLog() {
        this.eventLog = [];
    }

    getStats() {
        const stats = {};
        for (const entry of this.eventLog) {
            if (!stats[entry.event]) {
                stats[entry.event] = 0;
            }
            stats[entry.event]++;
        }
        return stats;
    }
}
