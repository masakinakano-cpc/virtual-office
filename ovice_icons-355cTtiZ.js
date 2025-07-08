!function (e, t) { "object" == typeof exports && "undefined" != typeof module ? t(exports) : "function" == typeof define && define.amd ? define(["exports"], t) : t((e = "undefined" != typeof globalThis ? globalThis : e || self).ReactJSXRuntime = {}) }(this, (function (e) { "use strict"; var t = Symbol.for("react.element"), r = Symbol.for("react.fragment"), n = Object.prototype.hasOwnProperty, u = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, i = { key: !0, ref: !0, __self: !0, __source: !0 }; function a(e, r, a) { var o, l = {}, c = null, s = null; for (o in void 0 !== a && (c = "" + a), void 0 !== r.key && (c = "" + r.key), void 0 !== r.ref && (s = r.ref), r) n.call(r, o) && !i.hasOwnProperty(o) && (l[o] = r[o]); if (e && e.defaultProps) for (o in r = e.defaultProps) void 0 === l[o] && (l[o] = r[o]); return { $$typeof: t, type: e, key: c, ref: s, props: l, _owner: u.current } } e.Fragment = r, e.jsx = a, e.jsxs = a }));

// Hand Icon Component
const HandIcon = ({ width = 24, height = 24, color = "currentColor", className = "", style = {} }) => {
    return React.createElement("svg", {
        width,
        height,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: color,
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: `hand-icon ${className}`,
        style,
        xmlns: "http://www.w3.org/2000/svg"
    }, [
        React.createElement("path", {
            key: "hand-path",
            d: "M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"
        }),
        React.createElement("path", {
            key: "finger1",
            d: "M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6"
        }),
        React.createElement("path", {
            key: "finger2",
            d: "M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7.5"
        }),
        React.createElement("path", {
            key: "thumb",
            d: "M6 13.5l4-7.5c.5-.8 1.5-.8 2 0l4 7.5"
        }),
        React.createElement("path", {
            key: "palm",
            d: "M18 13v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4"
        })
    ]);
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HandIcon };
} else if (typeof window !== 'undefined') {
    window.OviceIcons = { HandIcon };
}
