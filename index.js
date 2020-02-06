function HtmlReplaceWebpackPlugin(options) {
  options = Array.isArray(options) ? options : [options]

  options.forEach(option => {
    if (typeof option.pattern == 'undefined' || typeof option.replacement == 'undefined') {
      throw new Error('Both `pattern` and `replacement` options must be defined!')
    }
  })

  this.replace = function(compilation, htmlPluginData, callback) {
    options.forEach(option => {
      if (typeof option.replacement === 'function') {
        var matches = null
        var isPatternValid = true
        try {
          new RegExp(option.pattern)
        } catch (e) {
          isPatternValid = false
        }

        if (!isPatternValid) throw new Error('Invalid `pattern` option provided, it must be a valid regex.')
        while ((matches = option.pattern.exec(htmlPluginData.html)) != null) {
          var replacement = option.replacement.apply(null, [compilation, ...matches])

          // matches[0]: matching content string
          htmlPluginData.html = htmlPluginData.html.replace(matches[0], replacement)
        }
      } else {
        if (option.pattern instanceof RegExp)
            htmlPluginData.html = htmlPluginData.html.replace(option.pattern, option.replacement)
        else htmlPluginData.html = htmlPluginData.html.split(option.pattern).join(option.replacement)
      }
    })

    callback(null, htmlPluginData)
  }
}

HtmlReplaceWebpackPlugin.prototype.apply = function(compiler) {
  if (compiler.hooks) {
    compiler.hooks.compilation.tap('HtmlReplaceWebpackPlugin', compilation => {
      if (compilation.hooks.htmlWebpackPluginAfterHtmlProcessing) {
        compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync('HtmlReplaceWebpackPlugin', this.replace.bind(null, compilation))
      } else {
        var HtmlWebpackPlugin = require('html-webpack-plugin')

        if (!HtmlWebpackPlugin) {
          throw new Error('Please ensure that `html-webpack-plugin` was placed before `html-replace-webpack-plugin` in your Webpack config if you were working with Webpack 4.x!')
        }

        HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync('HtmlReplaceWebpackPlugin', this.replace.bind(null, compilation))
      }
    })
  } else {
    compiler.plugin('compilation', compilation => {
      compilation.plugin('html-webpack-plugin-beforeEmit', this.replace.bind(null, compilation))
    })
  }
}

module.exports = HtmlReplaceWebpackPlugin
