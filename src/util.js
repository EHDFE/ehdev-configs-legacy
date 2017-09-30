const path = require('path');
const glob = require('glob');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

exports.getHTML = (cwd) => glob.sync('*.html', {
  cwd,
});

/**
 * 其它文件处理
 */
exports.getOtherFileLoaderConfig = (PROJECT_CONFIG) => ({
  test: /\.(swf|xlsx?|txt|docx?|pptx?|ico|cur|webp|woff|eot|ttf)$/,
  loader: 'file-loader',
  query: {
    name: '[name].[ext]',
    outputPath: 'assets/',
    publicPath: PROJECT_CONFIG.publicPath,
  },
});

/**
 * 样式和图片配置
 * 开发环境：使用 style loader 注入页面
 * 生产环境：使用 ExtractTextPlugin 抽成独立 css 文件
 */
exports.getStyleWithImageLoaderConfig = (IS_DEV, BROWSER_SUPPORTS, PUBLIC_PATH, base64Config) => {
  const CommonStyleLoader = [
    'css-loader?minimize=' + (IS_DEV ? 'false' : 'true'),
    'postcss-loader',
    'less-loader',
  ].join('!');
  let StyleLoaderConfig;
  let ImageLoaderConfig;
  let ExtractCssPlugin;
  if (IS_DEV) {
    StyleLoaderConfig = `style-loader!${CommonStyleLoader}`;
    // 开发环境 图片不做处理
    ImageLoaderConfig = [`file-loader?name=[name].[ext]&outputPath=assets/&publicPath=${PUBLIC_PATH}`];
  } else {
    StyleLoaderConfig = ExtractTextPlugin.extract('style-loader', CommonStyleLoader);
    ExtractCssPlugin = new ExtractTextPlugin('[name].[contenthash:8].css');
    // 生产环境 图片需要优化
    const c = {
      name: '[name].[hash:8].[ext]',
      outputPath: 'assets/',
      publicPath: PUBLIC_PATH,
    };
    if (base64Config.enable) {
      Object.assign(c, {
        limit: base64Config.limit,
      });
    }
    ImageLoaderConfig = [
      (base64Config.enable ? 'url-loader' : 'file-loader') + '?' + JSON.stringify(c),
    ];
  }
  return {
    StyleLoaderConfig: {
      test: /\.(le|c)ss$/,
      loader: StyleLoaderConfig,
    },
    ImageLoaderConfig: {
      test: /\.(png|jpe?g|gif)$/,
      loaders: ImageLoaderConfig,
    },
    ExtractCssPlugin,
  }
}

exports.HtmlLoaderConfig = {
  test: /\.html$/,
  loader: 'html-loader',
  query: {
    interpolate: true,
    root: './',
  },
};

/**
 * svg 处理
 */
exports.getSVGLoaderConfig = (PROJECT_CONFIG, MODULES_PATH, BROWSER_SUPPORTS) => {
  if (PROJECT_CONFIG.framework === 'react') {
    return [
      {
        test: /\.svg\?assets$/, // foo.svg?assets
        exclude: /node_modules/,
        loader: 'file-loader',
        query: {
          name: '[name].[ext]',
          outputPath: 'assets/',
          publicPath: PROJECT_CONFIG.publicPath,
        },
      },
      {
        test: /\.svg$/,
        loader: 'babel?' + JSON.stringify({
          presets: [
            [ path.resolve(MODULES_PATH, 'babel-preset-env'), {
              targets: {
                browsers: BROWSER_SUPPORTS
              },
              // 支持老IE，启用 loose 模式
              loose: true,
            }],
            path.resolve(MODULES_PATH, 'babel-preset-react'),
            path.resolve(MODULES_PATH, 'babel-preset-stage-1'),
          ],
        }) + '!react-svg?' + JSON.stringify({
          svgo: {
            floatPrecision: 2,
            plugins: [{
              cleanupIDs: false,
            }],
          }
        }),
      },
    ];
  } else {
    return [{
      test: /\.svg$/, // foo.svg?assets
      exclude: /node_modules/,
      loader: 'file-loader',
      query: {
        name: '[name].[ext]',
        outputPath: 'assets/',
        publicPath: PROJECT_CONFIG.publicPath,
      },
    }]
  }
};

/**
 * js 处理
 */
exports.getJsLoader = (PROJECT_CONFIG, MODULES_PATH, BROWSER_SUPPORTS) => {
  const babelLoaderConfig = {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    loader: 'babel-loader',
  };
  if (PROJECT_CONFIG.framework === 'react') {
    Object.assign(babelLoaderConfig, {
      query: {
        presets: [
          [ path.resolve(MODULES_PATH, 'babel-preset-env'), {
            targets: {
              browsers: BROWSER_SUPPORTS
            },
            // 支持老IE，启用 loose 模式
            loose: true,
          }],
          path.resolve(MODULES_PATH, 'babel-preset-react'),
          path.resolve(MODULES_PATH, 'babel-preset-stage-1'),
        ],
      },
    });
  } else {
    Object.assign(babelLoaderConfig, {
      query: {
        presets: [
          [ path.resolve(MODULES_PATH, 'babel-preset-env'), {
            targets: {
              browsers: BROWSER_SUPPORTS
            },
            // 支持老IE，启用 loose 模式
            loose: true,
          }],
          path.resolve(MODULES_PATH, 'babel-preset-stage-1'),
        ],
      },
    });
  }
  return [
    babelLoaderConfig,
    {
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'es3ify-loader',
    },
  ];
};