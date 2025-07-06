// Assets Module - アセット管理とリソースローディング
// ファイル読み込み、キャッシュ、解決を統合管理

import { EventEmitter } from './display.js';
import { Texture, BaseTexture } from './texture.js';

// 優先度定数
export const LoaderPriority = {
    Low: 0,
    Normal: 1,
    High: 2
};

// ローダーパーサーの基底クラス
export class LoadParser {
    constructor() {
        this.extension = null;
        this.name = '';
        this.priority = LoaderPriority.Normal;
    }

    test(url) {
        return false;
    }

    async load(url, options, loader) {
        throw new Error('LoadParser.load must be implemented');
    }

    async unload(asset, options, loader) {
        // オプショナル
    }
}

// テキストローダー
export class TextLoader extends LoadParser {
    constructor() {
        super();
        this.name = 'loadTxt';
        this.extension = ['.txt'];
    }

    test(url) {
        return url.endsWith('.txt') || url.startsWith('data:text/plain');
    }

    async load(url) {
        const response = await fetch(url);
        return await response.text();
    }
}

// JSONローダー
export class JSONLoader extends LoadParser {
    constructor() {
        super();
        this.name = 'loadJson';
        this.extension = ['.json'];
    }

    test(url) {
        return url.endsWith('.json') || url.startsWith('data:application/json');
    }

    async load(url) {
        const response = await fetch(url);
        return await response.json();
    }
}

// テクスチャローダー
export class TextureLoader extends LoadParser {
    constructor() {
        super();
        this.name = 'loadTextures';
        this.extension = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];
        this.priority = LoaderPriority.High;
        this.config = {
            preferWorkers: true,
            preferCreateImageBitmap: true,
            crossOrigin: 'anonymous'
        };
    }

    test(url) {
        return this.extension.some(ext => url.includes(ext)) ||
            url.startsWith('data:image/');
    }

    async load(url, options, loader) {
        const useImageBitmap = globalThis.createImageBitmap && this.config.preferCreateImageBitmap;
        let resource;

        if (useImageBitmap) {
            resource = await this.loadImageBitmap(url);
        } else {
            resource = await this.loadImage(url);
        }

        const textureOptions = {
            ...options.data,
            resolution: this.getResolution(url)
        };

        if (useImageBitmap && textureOptions.resourceOptions?.ownsImageBitmap === undefined) {
            textureOptions.resourceOptions = {
                ...textureOptions.resourceOptions,
                ownsImageBitmap: true
            };
        }

        const baseTexture = new BaseTexture(resource, textureOptions);
        baseTexture.resource.src = url;

        const texture = new Texture(baseTexture);
        return this.createTextureAsset(texture, loader, url);
    }

    async loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = this.config.crossOrigin;
            img.src = url;

            if (img.complete) {
                resolve(img);
            } else {
                img.onload = () => resolve(img);
                img.onerror = reject;
            }
        });
    }

    async loadImageBitmap(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        return await createImageBitmap(blob);
    }

    getResolution(url) {
        const match = url.match(/@(\d+(?:\.\d+)?)x/);
        return match ? parseFloat(match[1]) : 1;
    }

    createTextureAsset(texture, loader, url) {
        texture.baseTexture.internal = true;

        const cleanup = () => {
            delete loader.promiseCache[url];
        };

        texture.baseTexture.once('destroyed', cleanup);
        texture.once('destroyed', cleanup);

        return texture;
    }

    unload(texture) {
        texture.destroy(true);
    }
}

// フォントローダー
export class FontLoader extends LoadParser {
    constructor() {
        super();
        this.name = 'loadWebFont';
        this.extension = ['.ttf', '.otf', '.woff', '.woff2'];
    }

    test(url) {
        return this.extension.some(ext => url.includes(ext)) ||
            url.startsWith('data:font/');
    }

    async load(url, options) {
        const fontFaceSet = document.fonts;

        if (fontFaceSet) {
            const fonts = [];
            const family = options.data?.family ?? this.extractFontFamily(url);
            const weights = options.data?.weights?.filter(w => this.isValidWeight(w)) ?? ['normal'];
            const fontData = options.data ?? {};

            for (const weight of weights) {
                const fontFace = new FontFace(family, `url(${encodeURI(url)})`, {
                    ...fontData,
                    weight: weight
                });

                await fontFace.load();
                fontFaceSet.add(fontFace);
                fonts.push(fontFace);
            }

            return fonts.length === 1 ? fonts[0] : fonts;
        }

        console.warn('[FontLoader] FontFace API is not supported');
        return null;
    }

    extractFontFamily(url) {
        const path = url.split('/').pop();
        const name = path.split('.')[0];
        return name.replace(/[-_]/g, ' ')
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    isValidWeight(weight) {
        const validWeights = ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
        return validWeights.includes(weight);
    }

    unload(fonts) {
        const fontArray = Array.isArray(fonts) ? fonts : [fonts];
        fontArray.forEach(font => document.fonts.delete(font));
    }
}

// キャッシュシステム
export class Cache {
    constructor() {
        this._cache = new Map();
        this._cacheMap = new Map();
        this._parsers = [];
    }

    reset() {
        this._cacheMap.clear();
        this._cache.clear();
    }

    has(key) {
        return this._cache.has(key);
    }

    get(key) {
        const asset = this._cache.get(key);
        if (!asset) {
            console.warn(`[Cache] Asset id ${key} was not found`);
        }
        return asset;
    }

    set(keys, asset) {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        let cacheableAssets;

        // パーサーで処理可能なアセットを探す
        for (const parser of this._parsers) {
            if (parser.test(asset)) {
                cacheableAssets = parser.getCacheableAssets(keyArray, asset);
                break;
            }
        }

        if (!cacheableAssets) {
            cacheableAssets = {};
            keyArray.forEach(key => {
                cacheableAssets[key] = asset;
            });
        }

        const cacheKeys = Object.keys(cacheableAssets);
        const cacheData = {
            cacheKeys,
            keys: keyArray
        };

        keyArray.forEach(key => {
            this._cacheMap.set(key, cacheData);
        });

        cacheKeys.forEach(key => {
            if (this._cache.has(key) && this._cache.get(key) !== asset) {
                console.warn(`[Cache] Key ${key} already exists`);
            }
            this._cache.set(key, cacheableAssets[key]);
        });

        // テクスチャの場合は追加処理
        if (asset instanceof Texture) {
            keyArray.forEach(key => {
                if (asset.baseTexture !== Texture.EMPTY.baseTexture) {
                    BaseTexture.addToCache(asset.baseTexture, key);
                }
                Texture.addToCache(asset, key);
            });
        }
    }

    remove(key) {
        if (!this._cacheMap.has(key)) {
            console.warn(`[Cache] Asset id ${key} was not found`);
            return;
        }

        const cacheData = this._cacheMap.get(key);

        cacheData.cacheKeys.forEach(cacheKey => {
            this._cache.delete(cacheKey);
        });

        cacheData.keys.forEach(dataKey => {
            this._cacheMap.delete(dataKey);
        });
    }

    get parsers() {
        return this._parsers;
    }
}

// ローダーシステム
export class Loader {
    constructor() {
        this._parsers = [];
        this._parsersValidated = false;
        this.parsers = new Proxy(this._parsers, {
            set: (target, property, value) => {
                this._parsersValidated = false;
                target[property] = value;
                return true;
            }
        });
        this.promiseCache = {};
    }

    reset() {
        this._parsersValidated = false;
        this.promiseCache = {};
    }

    async load(urls, onProgress) {
        this._validateParsers();

        let progressCount = 0;
        const results = {};
        const isString = typeof urls === 'string';
        const urlArray = Array.isArray(urls) ? urls : [urls];
        const totalCount = urlArray.length;

        const promises = urlArray.map(async (urlData) => {
            const url = typeof urlData === 'string' ? urlData : urlData.src;
            const absoluteUrl = this.toAbsolute(url);

            if (!results[url]) {
                try {
                    if (!this.promiseCache[absoluteUrl]) {
                        this.promiseCache[absoluteUrl] = this._getLoadPromiseAndParser(absoluteUrl, urlData);
                    }

                    results[url] = await this.promiseCache[absoluteUrl].promise;

                    if (onProgress) {
                        onProgress(++progressCount / totalCount);
                    }
                } catch (error) {
                    delete this.promiseCache[absoluteUrl];
                    delete results[url];
                    throw new Error(`[Loader.load] Failed to load ${absoluteUrl}.\n${error}`);
                }
            }
        });

        await Promise.all(promises);
        return isString ? results[urlArray[0]] : results;
    }

    async unload(urls) {
        const urlArray = Array.isArray(urls) ? urls : [urls];

        const promises = urlArray.map(async (urlData) => {
            const url = typeof urlData === 'string' ? urlData : urlData.src;
            const absoluteUrl = this.toAbsolute(url);
            const cached = this.promiseCache[absoluteUrl];

            if (cached) {
                const asset = await cached.promise;
                delete this.promiseCache[absoluteUrl];

                if (cached.parser?.unload) {
                    cached.parser.unload(asset, urlData, this);
                }
            }
        });

        await Promise.all(promises);
    }

    _getLoadPromiseAndParser(url, options) {
        const result = {
            promise: null,
            parser: null
        };

        result.promise = (async () => {
            let asset = null;
            let parser = null;

            // 指定されたパーサーを使用
            if (options.loadParser) {
                parser = this._parserHash[options.loadParser];
                if (!parser) {
                    console.warn(`[Loader] Parser "${options.loadParser}" not found for ${url}`);
                }
            }

            // パーサーを自動検出
            if (!parser) {
                for (const p of this.parsers) {
                    if (p.load && p.test?.(url, options, this)) {
                        parser = p;
                        break;
                    }
                }

                if (!parser) {
                    console.warn(`[Loader] No parser found for ${url}`);
                    return null;
                }
            }

            // アセットをロード
            asset = await parser.load(url, options, this);
            result.parser = parser;

            // パース処理
            for (const p of this.parsers) {
                if (p.parse && await p.testParse?.(asset, options, this)) {
                    asset = await p.parse(asset, options, this) || asset;
                    result.parser = p;
                }
            }

            return asset;
        })();

        return result;
    }

    _validateParsers() {
        if (this._parsersValidated) return;

        this._parsersValidated = true;
        this._parserHash = this._parsers
            .filter(parser => parser.name)
            .reduce((hash, parser) => {
                if (hash[parser.name]) {
                    console.warn(`[Loader] Parser name conflict "${parser.name}"`);
                }
                return { ...hash, [parser.name]: parser };
            }, {});
    }

    toAbsolute(url) {
        // 簡易的な絶対URL変換
        if (url.startsWith('http') || url.startsWith('data:')) {
            return url;
        }
        return new URL(url, window.location.href).href;
    }

    get parsers() {
        return this._parsers;
    }
}

// リゾルバーシステム
export class Resolver {
    constructor() {
        this._defaultBundleIdentifierOptions = {
            connector: '-',
            createBundleAssetId: (bundleId, assetId) => `${bundleId}${this._bundleIdConnector}${assetId}`,
            extractAssetIdFromBundle: (bundleId, bundleAssetId) => bundleAssetId.replace(`${bundleId}${this._bundleIdConnector}`, '')
        };

        this._bundleIdConnector = this._defaultBundleIdentifierOptions.connector;
        this._createBundleAssetId = this._defaultBundleIdentifierOptions.createBundleAssetId;
        this._extractAssetIdFromBundle = this._defaultBundleIdentifierOptions.extractAssetIdFromBundle;

        this._assetMap = {};
        this._preferredOrder = [];
        this._parsers = [];
        this._resolverHash = {};
        this._bundles = {};
        this._basePath = null;
        this._rootPath = null;
        this._manifest = null;
        this._defaultSearchParams = null;
    }

    reset() {
        this.setBundleIdentifier(this._defaultBundleIdentifierOptions);
        this._assetMap = {};
        this._preferredOrder = [];
        this._resolverHash = {};
        this._rootPath = null;
        this._basePath = null;
        this._manifest = null;
        this._bundles = {};
        this._defaultSearchParams = null;
    }

    setBundleIdentifier(options) {
        this._bundleIdConnector = options.connector ?? this._bundleIdConnector;
        this._createBundleAssetId = options.createBundleAssetId ?? this._createBundleAssetId;
        this._extractAssetIdFromBundle = options.extractAssetIdFromBundle ?? this._extractAssetIdFromBundle;

        // 検証
        const testBundle = 'foo';
        const testAsset = 'bar';
        const bundleAssetId = this._createBundleAssetId(testBundle, testAsset);
        const extractedAsset = this._extractAssetIdFromBundle(testBundle, bundleAssetId);

        if (extractedAsset !== testAsset) {
            throw new Error('[Resolver] Bundle identifier functions are not working correctly');
        }
    }

    prefer(...preferences) {
        preferences.forEach(preference => {
            this._preferredOrder.push(preference);
            if (!preference.priority) {
                preference.priority = Object.keys(preference.params);
            }
        });
        this._resolverHash = {};
    }

    set basePath(path) {
        this._basePath = path;
    }

    get basePath() {
        return this._basePath;
    }

    set rootPath(path) {
        this._rootPath = path;
    }

    get rootPath() {
        return this._rootPath;
    }

    setDefaultSearchParams(params) {
        if (typeof params === 'string') {
            this._defaultSearchParams = params;
        } else {
            this._defaultSearchParams = Object.keys(params)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                .join('&');
        }
    }

    addManifest(manifest) {
        if (this._manifest) {
            console.warn('[Resolver] Manifest already exists, will be overwritten');
        }
        this._manifest = manifest;

        manifest.bundles.forEach(bundle => {
            this.addBundle(bundle.name, bundle.assets);
        });
    }

    addBundle(bundleName, assets) {
        const bundleAssetIds = [];

        if (Array.isArray(assets)) {
            assets.forEach(asset => {
                const src = asset.src ?? asset.srcs;
                const alias = asset.alias ?? asset.name;
                let resolvedAlias;

                if (typeof alias === 'string') {
                    const bundleAssetId = this._createBundleAssetId(bundleName, alias);
                    bundleAssetIds.push(bundleAssetId);
                    resolvedAlias = [alias, bundleAssetId];
                } else {
                    const bundleAssetIds = alias.map(a => this._createBundleAssetId(bundleName, a));
                    bundleAssetIds.push(...bundleAssetIds);
                    resolvedAlias = [...alias, ...bundleAssetIds];
                }

                this.add({
                    ...asset,
                    alias: resolvedAlias,
                    src
                });
            });
        } else {
            Object.keys(assets).forEach(assetId => {
                const resolvedAlias = [assetId, this._createBundleAssetId(bundleName, assetId)];
                const assetData = assets[assetId];

                if (typeof assetData === 'string') {
                    this.add({
                        alias: resolvedAlias,
                        src: assetData
                    });
                } else if (Array.isArray(assetData)) {
                    this.add({
                        alias: resolvedAlias,
                        src: assetData
                    });
                } else {
                    const src = assetData.src ?? assetData.srcs;
                    this.add({
                        ...assetData,
                        alias: resolvedAlias,
                        src: Array.isArray(src) ? src : [src]
                    });
                }

                bundleAssetIds.push(...resolvedAlias);
            });
        }

        this._bundles[bundleName] = bundleAssetIds;
    }

    add(assets) {
        const assetArray = Array.isArray(assets) ? assets : [assets];

        assetArray.forEach(asset => {
            const { alias, name, src, srcs } = asset;
            let { data, format, loadParser } = asset;

            const sources = this.normalizeArray(src || srcs).map(s =>
                typeof s === 'string' ? this.expandGlob(s) : Array.isArray(s) ? s : [s]
            );

            const aliases = this.normalizeArray(alias || name);

            // 重複チェック
            aliases.forEach(a => {
                if (this.hasKey(a)) {
                    console.warn(`[Resolver] Key ${a} already exists, overwriting`);
                }
            });

            const resolvedAssets = [];

            sources.forEach(sourceGroup => {
                sourceGroup.forEach(source => {
                    let resolvedAsset = {};

                    if (typeof source !== 'object') {
                        resolvedAsset.src = source;

                        // パーサーで解析
                        for (const parser of this._parsers) {
                            if (parser.test(source)) {
                                resolvedAsset = parser.parse(source);
                                break;
                            }
                        }
                    } else {
                        data = source.data ?? data;
                        format = source.format ?? format;
                        loadParser = source.loadParser ?? loadParser;
                        resolvedAsset = { ...resolvedAsset, ...source };
                    }

                    resolvedAsset = this.buildResolvedAsset(resolvedAsset, {
                        aliases,
                        data,
                        format,
                        loadParser
                    });

                    resolvedAssets.push(resolvedAsset);
                });
            });

            aliases.forEach(alias => {
                this._assetMap[alias] = resolvedAssets;
            });
        });
    }

    resolve(keys) {
        const isString = typeof keys === 'string';
        const keyArray = Array.isArray(keys) ? keys : [keys];
        const results = {};

        keyArray.forEach(key => {
            if (!this._resolverHash[key]) {
                if (this._assetMap[key]) {
                    let assets = this._assetMap[key];
                    const firstAsset = assets[0];
                    const preferredOrder = this._getPreferredOrder(assets);

                    if (preferredOrder) {
                        preferredOrder.priority.forEach(priority => {
                            preferredOrder.params[priority].forEach(param => {
                                const filtered = assets.filter(asset =>
                                    asset[priority] ? asset[priority] === param : false
                                );
                                if (filtered.length) {
                                    assets = filtered;
                                }
                            });
                        });
                    }

                    this._resolverHash[key] = assets[0] ?? firstAsset;
                } else {
                    this._resolverHash[key] = this.buildResolvedAsset({
                        alias: [key],
                        src: key
                    }, {});
                }
            }

            results[key] = this._resolverHash[key];
        });

        return isString ? results[keyArray[0]] : results;
    }

    resolveUrl(keys) {
        const resolved = this.resolve(keys);

        if (typeof keys !== 'string') {
            const urls = {};
            for (const key in resolved) {
                urls[key] = resolved[key].src;
            }
            return urls;
        }

        return resolved.src;
    }

    resolveBundle(bundleIds) {
        const isString = typeof bundleIds === 'string';
        const bundleArray = Array.isArray(bundleIds) ? bundleIds : [bundleIds];
        const results = {};

        bundleArray.forEach(bundleId => {
            const bundleAssetIds = this._bundles[bundleId];

            if (bundleAssetIds) {
                const resolved = this.resolve(bundleAssetIds);
                const bundle = {};

                for (const assetId in resolved) {
                    const extractedId = this._extractAssetIdFromBundle(bundleId, assetId);
                    bundle[extractedId] = resolved[assetId];
                }

                results[bundleId] = bundle;
            }
        });

        return isString ? results[bundleArray[0]] : results;
    }

    hasKey(key) {
        return !!this._assetMap[key];
    }

    hasBundle(bundleId) {
        return !!this._bundles[bundleId];
    }

    buildResolvedAsset(asset, options) {
        const { aliases, data, loadParser, format } = options;

        // パスの解決
        if (this._basePath || this._rootPath) {
            asset.src = this.toAbsolute(asset.src, this._basePath, this._rootPath);
        }

        // エイリアスの設定
        asset.alias = aliases ?? asset.alias ?? [asset.src];

        // 検索パラメータの追加
        asset.src = this._appendDefaultSearchParams(asset.src);

        // データの設定
        asset.data = { ...data || {}, ...asset.data };
        asset.loadParser = loadParser ?? asset.loadParser;
        asset.format = format ?? asset.src.split('.').pop();

        // 互換性のためのプロパティ
        asset.srcs = asset.src;
        asset.name = asset.alias;

        return asset;
    }

    _getPreferredOrder(assets) {
        for (const asset of assets) {
            const preference = this._preferredOrder.find(pref =>
                pref.params.format.includes(asset.format)
            );
            if (preference) {
                return preference;
            }
        }
        return this._preferredOrder[0];
    }

    _appendDefaultSearchParams(url) {
        if (!this._defaultSearchParams) return url;

        const separator = /\?/.test(url) ? '&' : '?';
        return `${url}${separator}${this._defaultSearchParams}`;
    }

    normalizeArray(input) {
        return Array.isArray(input) ? input : [input];
    }

    expandGlob(pattern) {
        // 簡易的なグロブ展開（実際の実装ではより複雑）
        const regex = /\{(.*?)\}/g;
        const matches = pattern.match(regex);
        const results = [];

        if (matches) {
            const groups = [];
            matches.forEach(match => {
                const options = match.substring(1, match.length - 1).split(',');
                groups.push(options);
            });

            this._expandGroups(pattern, groups, 0, matches, results);
        } else {
            results.push(pattern);
        }

        return results;
    }

    _expandGroups(pattern, groups, index, matches, results) {
        if (index >= groups.length) {
            results.push(pattern);
            return;
        }

        const group = groups[index];
        for (const option of group) {
            const newPattern = pattern.replace(matches[index], option);
            this._expandGroups(newPattern, groups, index + 1, matches, results);
        }
    }

    toAbsolute(url, basePath, rootPath) {
        // 簡易的な絶対パス変換
        if (url.startsWith('http') || url.startsWith('data:')) {
            return url;
        }

        if (basePath && !url.startsWith('/')) {
            url = basePath + '/' + url;
        }

        if (rootPath) {
            url = rootPath + '/' + url.replace(/^\//, '');
        }

        return url;
    }

    get parsers() {
        return this._parsers;
    }
}

// バックグラウンドローダー
export class BackgroundLoader {
    constructor(loader, verbose = false) {
        this._loader = loader;
        this._assetList = [];
        this._isLoading = false;
        this._maxConcurrent = 1;
        this.verbose = verbose;
        this._isActive = false;
    }

    add(assets) {
        assets.forEach(asset => {
            this._assetList.push(asset);
        });

        if (this.verbose) {
            console.log('[BackgroundLoader] assets:', this._assetList);
        }

        if (this._isActive && !this._isLoading) {
            this._next();
        }
    }

    async _next() {
        if (this._assetList.length && this._isActive) {
            this._isLoading = true;

            const toLoad = [];
            const count = Math.min(this._assetList.length, this._maxConcurrent);

            for (let i = 0; i < count; i++) {
                toLoad.push(this._assetList.pop());
            }

            await this._loader.load(toLoad);
            this._isLoading = false;
            this._next();
        }
    }

    get active() {
        return this._isActive;
    }

    set active(value) {
        if (this._isActive !== value) {
            this._isActive = value;
            if (value && !this._isLoading) {
                this._next();
            }
        }
    }
}

// メインのアセットマネージャー
export class AssetManager extends EventEmitter {
    constructor() {
        super();
        this._detections = [];
        this._initialized = false;

        this.resolver = new Resolver();
        this.loader = new Loader();
        this.cache = new Cache();
        this._backgroundLoader = new BackgroundLoader(this.loader);
        this._backgroundLoader.active = true;

        this.reset();
    }

    async init(options = {}) {
        if (this._initialized) {
            console.warn('[AssetManager] Already initialized');
            return;
        }

        this._initialized = true;

        // デフォルト検索パラメータ
        if (options.defaultSearchParams) {
            this.resolver.setDefaultSearchParams(options.defaultSearchParams);
        }

        // ベースパス
        if (options.basePath) {
            this.resolver.basePath = options.basePath;
        }

        // バンドル識別子
        if (options.bundleIdentifier) {
            this.resolver.setBundleIdentifier(options.bundleIdentifier);
        }

        // マニフェスト
        if (options.manifest) {
            let manifest = options.manifest;
            if (typeof manifest === 'string') {
                manifest = await this.load(manifest);
            }
            this.resolver.addManifest(manifest);
        }

        // テクスチャ設定
        const resolution = options.texturePreference?.resolution ?? 1;
        const resolutions = typeof resolution === 'number' ? [resolution] : resolution;

        const formats = await this._detectFormats({
            preferredFormats: options.texturePreference?.format,
            skipDetections: options.skipDetections,
            detections: this._detections
        });

        this.resolver.prefer({
            params: {
                format: formats,
                resolution: resolutions
            }
        });

        // 設定
        if (options.preferences) {
            this.setPreferences(options.preferences);
        }
    }

    add(assets) {
        this.resolver.add(assets);
    }

    async load(assets, onProgress) {
        if (!this._initialized) {
            await this.init();
        }

        const isString = typeof assets === 'string';
        const assetArray = Array.isArray(assets) ? assets : [assets];

        const processedAssets = assetArray.map(asset => {
            if (typeof asset !== 'string') {
                this.add(asset);
                const src = asset.src || asset.srcs;
                const alias = asset.alias || asset.name;
                return (alias && Array.isArray(alias)) ? alias[0] : (src && Array.isArray(src)) ? src[0] : alias || src;
            }

            if (!this.resolver.hasKey(asset)) {
                this.add({ alias: asset, src: asset });
            }
            return asset;
        });

        const resolved = this.resolver.resolve(processedAssets);
        const loaded = await this._mapLoadToResolve(resolved, onProgress);

        return isString ? loaded[processedAssets[0]] : loaded;
    }

    addBundle(bundleName, assets) {
        this.resolver.addBundle(bundleName, assets);
    }

    async loadBundle(bundleIds, onProgress) {
        if (!this._initialized) {
            await this.init();
        }

        let isString = false;
        if (typeof bundleIds === 'string') {
            isString = true;
            bundleIds = [bundleIds];
        }

        const bundles = this.resolver.resolveBundle(bundleIds);
        const results = {};
        const bundleNames = Object.keys(bundles);

        let loadedCount = 0;
        let totalCount = 0;

        const updateProgress = () => {
            if (onProgress) {
                onProgress(++loadedCount / totalCount);
            }
        };

        const promises = bundleNames.map(bundleName => {
            const bundle = bundles[bundleName];
            totalCount += Object.keys(bundle).length;

            return this._mapLoadToResolve(bundle, updateProgress).then(loaded => {
                results[bundleName] = loaded;
            });
        });

        await Promise.all(promises);
        return isString ? results[bundleIds[0]] : results;
    }

    async backgroundLoad(assets) {
        if (!this._initialized) {
            await this.init();
        }

        if (typeof assets === 'string') {
            assets = [assets];
        }

        const resolved = this.resolver.resolve(assets);
        this._backgroundLoader.add(Object.values(resolved));
    }

    async backgroundLoadBundle(bundleIds) {
        if (!this._initialized) {
            await this.init();
        }

        if (typeof bundleIds === 'string') {
            bundleIds = [bundleIds];
        }

        const bundles = this.resolver.resolveBundle(bundleIds);
        Object.values(bundles).forEach(bundle => {
            this._backgroundLoader.add(Object.values(bundle));
        });
    }

    get(keys) {
        if (typeof keys === 'string') {
            return this.cache.get(keys);
        }

        const results = {};
        for (let i = 0; i < keys.length; i++) {
            results[i] = this.cache.get(keys[i]);
        }
        return results;
    }

    async unload(assets) {
        if (!this._initialized) {
            await this.init();
        }

        const assetArray = Array.isArray(assets) ? assets : [assets];
        const urls = assetArray.map(asset => typeof asset !== 'string' ? asset.src : asset);
        const resolved = this.resolver.resolve(urls);

        await this._unloadFromResolved(resolved);
    }

    async unloadBundle(bundleIds) {
        if (!this._initialized) {
            await this.init();
        }

        const bundleArray = Array.isArray(bundleIds) ? bundleIds : [bundleIds];
        const bundles = this.resolver.resolveBundle(bundleArray);
        const promises = Object.keys(bundles).map(bundleId =>
            this._unloadFromResolved(bundles[bundleId])
        );

        await Promise.all(promises);
    }

    reset() {
        this.resolver.reset();
        this.loader.reset();
        this.cache.reset();
        this._initialized = false;
    }

    setPreferences(preferences) {
        this.loader.parsers.forEach(parser => {
            if (parser.config) {
                Object.keys(parser.config)
                    .filter(key => key in preferences)
                    .forEach(key => {
                        parser.config[key] = preferences[key];
                    });
            }
        });
    }

    async _mapLoadToResolve(resolved, onProgress) {
        const assets = Object.values(resolved);
        const keys = Object.keys(resolved);

        this._backgroundLoader.active = false;
        const loaded = await this.loader.load(assets, onProgress);
        this._backgroundLoader.active = true;

        const results = {};
        assets.forEach((asset, index) => {
            const loadedAsset = loaded[asset.src];
            const aliases = [asset.src];

            if (asset.alias) {
                aliases.push(...asset.alias);
            }

            results[keys[index]] = loadedAsset;
            this.cache.set(aliases, loadedAsset);
        });

        return results;
    }

    async _unloadFromResolved(resolved) {
        const assets = Object.values(resolved);

        assets.forEach(asset => {
            this.cache.remove(asset.src);
        });

        await this.loader.unload(assets);
    }

    async _detectFormats(options) {
        let formats = [];

        if (options.preferredFormats) {
            formats = Array.isArray(options.preferredFormats) ?
                options.preferredFormats : [options.preferredFormats];
        }

        for (const detection of options.detections) {
            if (options.skipDetections || await detection.test()) {
                formats = await detection.add(formats);
            } else if (!options.skipDetections) {
                formats = await detection.remove(formats);
            }
        }

        // 重複を除去
        return formats.filter((format, index) => formats.indexOf(format) === index);
    }

    get detections() {
        return this._detections;
    }
}

// デフォルトのアセットマネージャーインスタンス
export const Assets = new AssetManager();

// パーサーの登録
Assets.loader.parsers.push(new TextLoader());
Assets.loader.parsers.push(new JSONLoader());
Assets.loader.parsers.push(new TextureLoader());
Assets.loader.parsers.push(new FontLoader());

// デフォルトエクスポート
export default {
    AssetManager,
    Assets,
    Loader,
    Cache,
    Resolver,
    BackgroundLoader,
    LoadParser,
    TextLoader,
    JSONLoader,
    TextureLoader,
    FontLoader,
    LoaderPriority
};
