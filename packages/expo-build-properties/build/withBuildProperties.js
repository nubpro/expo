"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withBuildProperties = void 0;
const android_1 = require("./android");
const ios_1 = require("./ios");
const pluginConfig_1 = require("./pluginConfig");
/**
 * Config plugin to customize native Android or iOS build properties for managed apps
 *
 * @param config ExpoConfig
 * @param props Configuration for the config plugin
 */
const withBuildProperties = (config, props) => {
    const pluginConfig = (0, pluginConfig_1.validateConfig)(props || {});
    config = (0, android_1.withAndroidBuildProperties)(config, pluginConfig);
    // Assuming `withBuildProperties` could be called multiple times from different config-plugins,
    // the `withAndroidProguardRules` always appends new rules by default.
    // That is not ideal if we leave generated contents from previous prebuilding there.
    // The `withAndroidPurgeProguardRulesOnce` is for this purpose and it would only run once in prebuilding phase.
    config = (0, android_1.withAndroidProguardRules)(config, pluginConfig);
    config = (0, android_1.withAndroidPurgeProguardRulesOnce)(config); // plugins order matter: the later one would run first
    config = (0, ios_1.withIosBuildProperties)(config, pluginConfig);
    config = (0, ios_1.withIosDeploymentTarget)(config, pluginConfig);
    return config;
};
exports.withBuildProperties = withBuildProperties;
exports.default = exports.withBuildProperties;
