module.exports = {
  transpileDependencies: ['vuetify'],
  chainWebpack: (config) => {
    // Add project name as alias
    config.resolve.alias.set('@', __dirname);
  },
  devServer: {
    port: 8081,
  },
};
