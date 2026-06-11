/** @type {import('expo/config').ExpoConfig} */
const base = require('./app.json').expo;
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

module.exports = {
  expo: {
    ...base,
    plugins: [
      ...(base.plugins ?? []),
      [
        'react-native-maps',
        {
          googleMapsApiKey,
        },
      ],
    ],
    android: {
      ...base.android,
      config: {
        ...(base.android?.config ?? {}),
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    ios: {
      ...base.ios,
      config: {
        ...(base.ios?.config ?? {}),
        googleMapsApiKey,
      },
    },
  },
};
