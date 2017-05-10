const glob = require('glob');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

exports.getHTML = (cwd) => glob.sync('*.html', {
  cwd,
});

/**
 * 其它文件处理
 */
exports.getOtherFileLoaderConfig = () => {
  return {
    test: /\.(swf|xlsx?|txt|docx?|pptx?|ico|cur)$/,
    loader: 'file-loader',
    query: {
      name: '[name].[ext]',
      outputPath: 'assets/',
      // publicPath: '/assets/',
    },
  }
};

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
    ImageLoaderConfig = ['file-loader?name=[name].[ext]&outputPath=assets/'];
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
      'image-webpack-loader?' + JSON.stringify({
        progressive: true,
        optipng: {
          optimizationLevel: 3,
        },
        gifsicle: {
          interlaced: true,
        },
        pngquant: {
          quality: '65-80',
          speed: 5
        }
      }),
    ];
  }
  return {
    StyleLoaderConfig: {
      test: /\.(le|c)ss$/,
      loader: StyleLoaderConfig,
    },
    ImageLoaderConfig: {
      test: /\.(png|jpe?g|gif|svg)$/,
      loaders: ImageLoaderConfig,
    },
    ExtractCssPlugin,
  }
}