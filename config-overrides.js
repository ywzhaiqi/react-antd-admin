const { injectBabelPlugin } = require('react-app-rewired');
const rewireLess = require('react-app-rewire-less');
const StringReplacePlugin = require("string-replace-webpack-plugin");

module.exports = function override(config, env) {
  // less
  config = rewireLess(config, env);

  // antd
  config = injectBabelPlugin(['import', { libraryName: 'antd', style: 'css' }], config);

  // 让 import 支持直接导入 src
  config.resolve.modules.push('./src')

  // // dynamic-import
  // config = injectBabelPlugin(['dynamic-import-node'], config);

  if (env == 'development') {
    config = rewireReactHotLoader(config, env)

    config = mReactRouterHotLoaderPatch(config, env)
  }
  return config;
};

/**
 * 添加 react-hot-loader
 */
function rewireReactHotLoader(config, env) {
  console.log('Add react-hot-loader')

  config.entry.unshift('react-hot-loader/patch')

  config = injectBabelPlugin('react-hot-loader/babel', config)
  return config
}

/**
 * hack 方式解决 react-hot-loadere 不支持 react-router 3 异步加载组件的问题
 */
function mReactRouterHotLoaderPatch(config, env) {
  const stringReplaceRule = {
    test: /App.js$/,
    use: [
      {
        loader: StringReplacePlugin.replace({
          replacements: [
            {
              pattern: new RegExp("// (import DBTable from './components/DBTable')"),
              replacement: function (match, p1, offset, string) {
                return p1;
              }
            },
            {
              pattern: /getComponent=\{DBTableContainer\}/ig,
              replacement: function (match, p1, offset, string) {
                return 'component={DBTable}';
              }
            },
          ]
        })
      }
    ]
  }
  config.module.rules.push(stringReplaceRule)

  config.plugins = (config.plugins || []).concat([
    new StringReplacePlugin()
  ])

  return config
}