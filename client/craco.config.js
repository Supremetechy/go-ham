module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add fallback for Node.js modules that don't exist in the browser
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        net: false,
        child_process: false,
        fs: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        util: false,
        querystring: false,
        buffer: false,
        events: false,
        string_decoder: false,
      };

      // Add externals to exclude mongodb from bundling
      webpackConfig.externals = [
        ...(webpackConfig.externals || []),
        {
          mongodb: 'mongodb',
        },
      ];

      return webpackConfig;
    },
  },
};
