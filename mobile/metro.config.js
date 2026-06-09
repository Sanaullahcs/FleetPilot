const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const { resolveRequest } = config.resolver;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // react-native-svg has broken web subpath resolution in Metro; native logo uses .web.tsx instead.
  if (platform === 'web' && moduleName === 'react-native-svg') {
    return { type: 'empty' };
  }

  if (resolveRequest) {
    return resolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
