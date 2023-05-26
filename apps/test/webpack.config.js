const { composePlugins, withNx } = require('@nx/webpack');
const { ProvidePlugin } = require('webpack');
const { withReact } = require('@nx/react');

module.exports = composePlugins(withNx(), withReact(), (config) => {
  config.experiments = {
    asyncWebAssembly: true,
    layers: true,
  };

  config.plugins = config.plugins ?? []
  config.resolve.fallback = config.resolve.fallback ?? {}
  config.module = config.module ?? {}
  config.module.rules = config.module.rules ?? []

  config.plugins.push(new ProvidePlugin({ Buffer: ["buffer", "Buffer"] }))
  config.resolve.fallback["stream"] = require.resolve("stream");
  config.resolve.fallback["buffer"] = require.resolve("buffer");
  config.module.rules.push({
    test: /\.(mp3|mp4|ogg|wav|eot|ttf|woff|woff2|zip|otf)$/,
    type: 'asset/resource',
  },)

  return config;
});
