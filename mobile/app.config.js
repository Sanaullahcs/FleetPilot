/** @type {import('expo/config').ExpoConfig} */
const base = require('./app.json').expo;
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';
const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() || undefined;

const baseExtra = base.extra && typeof base.extra === 'object' ? base.extra : {};
const baseEas = baseExtra.eas && typeof baseExtra.eas === 'object' ? baseExtra.eas : {};

const plugins = [...(base.plugins ?? []), 'expo-audio'];
if (googleMapsApiKey) {
  plugins.push([
    'react-native-maps',
    {
      googleMapsApiKey,
    },
  ]);
}

const googleServicesPath = './google-services.json';
const fs = require('fs');
const hasGoogleServices = fs.existsSync(require('path').join(__dirname, googleServicesPath));

module.exports = {
  expo: {
    ...base,
    extra: {
      ...baseExtra,
      eas: {
        ...baseEas,
        projectId: easProjectId || baseEas.projectId,
      },
    },
    plugins,
    android: {
      ...base.android,
      ...(hasGoogleServices ? { googleServicesFile: googleServicesPath } : {}),
      ...(googleMapsApiKey
        ? {
            config: {
              ...(base.android?.config ?? {}),
              googleMaps: {
                apiKey: googleMapsApiKey,
              },
            },
          }
        : {}),
    },
    ios: {
      ...base.ios,
      ...(googleMapsApiKey
        ? {
            config: {
              ...(base.ios?.config ?? {}),
              googleMapsApiKey,
            },
          }
        : {}),
    },
  },
};
