const webpack = require('webpack');

module.exports = function override(config, env) {
  // Disable node polyfills for fs and other Node.js modules, but enable buffer
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "buffer": require.resolve("buffer/"),
    "fs": false,
    "fs/promises": false,
    "path": false,
    "crypto": false,
    "http": false,
    "https": false,
    "stream": false,
    "os": false,
    "net": false,
    "tls": false,
    "zlib": false,
  };

  // Provide Buffer global
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ];

  return config;
};
