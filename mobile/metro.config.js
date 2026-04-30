const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Windows: during `expo run:android`, Gradle can create/remove paths under
// `@react-native/gradle-plugin` while Metro starts. Node's fs.watch then throws
// ENOENT for a missing directory. Excluding this tree from Metro's file map
// avoids watching Kotlin/Gradle outputs we never bundle.
const blockGradlePluginTree = /@react-native[\\/]gradle-plugin[\\/].*/;
const existing = config.resolver.blockList;
config.resolver.blockList = Array.isArray(existing)
  ? [blockGradlePluginTree, ...existing]
  : existing
    ? [blockGradlePluginTree, existing]
    : [blockGradlePluginTree];

module.exports = config;
