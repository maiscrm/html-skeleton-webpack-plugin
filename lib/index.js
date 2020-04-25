const { compileStyle } = require('@vue/component-compiler-utils');
const templateCompiler = require('vue-template-compiler');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { getScopeId, getCssFilename } = require('./utils');
const { Buffer } = require('buffer');
const path = require('path');
const fs = require('fs');

const PLUGIN_NAME = 'HtmlSkeletonWebpackPlugin';
const DEFAULT_TEMPLATE_PATH = '../templates/loading.vue';

class HtmlSkeletonWebpackPlugin {
  constructor(options) {
    this.scopeId = getScopeId();
    this.options = options;
    this.vueTemplateStr = this.getSkeletonTemplateStr();
    this.cssFilename = getCssFilename(options.cssFilename, this.vueTemplateStr);
  }

  apply(compiler) {
    if (compiler.hooks) {
      compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
        if (compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing) {
          compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing.tapAsync(PLUGIN_NAME, (data, cb) => {
            const parseResult = templateCompiler.parseComponent(this.vueTemplateStr);
            this.injectSkeletonHtml(data, parseResult);
            this.addSkeletonCSSToAssets(compilation, parseResult);
            this.addHtmlDependency(data);
            return cb(null, data);
          });
        } else if (HtmlWebpackPlugin && HtmlWebpackPlugin['getHooks']) {
          HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tapAsync(PLUGIN_NAME, (data, cb) => {
            const parseResult = templateCompiler.parseComponent(this.vueTemplateStr);
            this.injectSkeletonHtml(data, parseResult);
            this.addSkeletonCSSToAssets(compilation, parseResult);
            return cb(null, data);
          });
          HtmlWebpackPlugin.getHooks(compilation).beforeAssetTagGeneration.tapAsync(PLUGIN_NAME, (data, cb) => {
            this.addHtmlDependency(data);
            return cb(null, data);
          })
        }
      });
    }
  }

  addSkeletonCSSToAssets(compilation, parseResult) {
    const styleWithScope = compileStyle({
      source: parseResult.styles[0].content,
      id: this.scopeId,
      scoped: true,
      trim: true,
    });
    const code = styleWithScope.code.replace(/\n/g, '');
    compilation.assets[this.cssFilename] = {
      source: () => code,
      size: () => Buffer.byteLength(code, 'utf-8'),
    };
  }

  addHtmlDependency(htmlPluginData) {
    if (htmlPluginData.assets) {
      let publicPath = htmlPluginData.assets.publicPath;
      if (publicPath.length && publicPath.substr(-1, 1) !== '/') {
        publicPath += '/';
      }
      
      htmlPluginData.assets.css.push(`${htmlPluginData.assets.publicPath}${this.cssFilename}`);
    }
  }

  addScopeIdToTemplate(template) {
    return template.content.replace(/(class="[\w-\s]+")/g, word => `${word} ${this.scopeId}`)
  }

  getSkeletonTemplateStr() {
    return fs.readFileSync(path.resolve(__dirname, DEFAULT_TEMPLATE_PATH)).toString();
  }

  injectSkeletonHtml(htmlData, parseResult) {
    const templateWithScope = this.addScopeIdToTemplate(parseResult.template, this.scopeId);
    htmlData.html = htmlData.html.replace(/<!-- inject-skeleton -->/, templateWithScope);
  }
}

module.exports = HtmlSkeletonWebpackPlugin;
