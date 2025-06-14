module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        unstable_transformImportMeta: true
      }]
    ],
    plugins: [
      // Add any existing plugins here
    ],
    env: {
      production: {
        plugins: ['react-native-paper/babel'],
      },
    },
    // Add the unstable_transformImportMeta option to the preset
    overrides: [
      {
        test: './node_modules/valtio',
        plugins: [
          ['@babel/plugin-transform-runtime', {
            unstable_transformImportMeta: true
          }]
        ]
      }
    ]
  };
}; 