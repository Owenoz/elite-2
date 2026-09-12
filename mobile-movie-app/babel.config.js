module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            // Removed jsxImportSource: "nativewind" — was causing
            // "undefined is not a function" crash on Android APK
            // className props are now ignored (no-op) on RN elements
            ["babel-preset-expo"],
        ],
    };
};
