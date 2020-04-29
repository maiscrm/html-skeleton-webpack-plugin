const { compileStyle } = require('@vue/component-compiler-utils');
const { getScopeId, getCssFilename } = require('./utils');
const templateCompiler = require('vue-template-compiler');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { Buffer } = require('buffer');
const path = require('path');
const fs = require('fs');

const DEFAULT_TEMPLATE_PATH = '../templates/loading.vue';
const PLUGIN_NAME = 'HtmlSkeletonWebpackPlugin';

class HtmlSkeletonWebpackPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    if (compiler.hooks) {
      compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
        if (compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing) {
          // webpack-html-plugin 3.x
          compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing.tapAsync(PLUGIN_NAME, (data, cb) => {
            if (this.shouldInjectSkeleton(data.html)) {
              this.handleSkeletonTemlpate(compilation, data);
            }
            return cb(null, data);
          });
        } else if (HtmlWebpackPlugin && HtmlWebpackPlugin['getHooks']) {
          // webpack-html-plugin 4.x
          HtmlWebpackPlugin.getHooks(compilation).beforeAssetTagGeneration.tapAsync(PLUGIN_NAME, (data, cb) => {
            this.publicPath = data.assets.publicPath;
            return cb(null, data);
          });
          HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tapAsync(PLUGIN_NAME, (data, cb) => {
            if (this.shouldInjectSkeleton(data.html)) {
              this.handleSkeletonTemlpate(compilation, data);
            }
            return cb(null, data);
          });
        }
      });
    }
  }

  shouldInjectSkeleton(htmlData) {
    return /<!-- inject-skeleton -->/.test(htmlData);
  }

  handleSkeletonTemlpate(compilation, htmlData) {
    this.vueTemplateStr = this.getSkeletonTemplateStr();
    const parseResult = templateCompiler.parseComponent(this.vueTemplateStr);

    this.scopeId = getScopeId();
    this.cssFilename = getCssFilename(this.options.cssFilename, this.vueTemplateStr);
    this.injectSkeletonHtml(htmlData, parseResult);
    this.addSkeletonCSSToAssets(compilation, parseResult);
    this.addHtmlDependency(htmlData);
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
      htmlPluginData.assets.css.push(`${this.getPublicPath(htmlPluginData)}${this.cssFilename}`);
    } else {
      htmlPluginData.headTags.push({
        tagName: 'link',
        voidTag: true,
        attributes: {
          href: `${this.getPublicPath(htmlPluginData)}${this.cssFilename}`,
          rel: 'stylesheet'
        }
      });
    }
  }

  addScopeIdToTemplate(template) {
    return template.content.replace(/(class="[\w-\s]+")/g, word => `${word} ${this.scopeId}`)
  }

  getPublicPath(htmlPluginData) {
    let publicPath = htmlPluginData.assets ? htmlPluginData.assets.publicPath : this.publicPath;
    if (publicPath.length && publicPath.substr(-1, 1) !== '/') {
      publicPath += '/';
    }

    return publicPath;
  }

  getSkeletonTemplateStr() {
    if (fs.existsSync(this.options.template)) {
      return fs.readFileSync(this.options.template).toString();
    }
    
    return fs.readFileSync(path.resolve(__dirname, DEFAULT_TEMPLATE_PATH)).toString();
  }

  injectSkeletonHtml(htmlData, parseResult) {
    const templateWithScope = this.addScopeIdToTemplate(parseResult.template, this.scopeId);
    htmlData.html = htmlData.html.replace(/<!-- inject-skeleton -->/, templateWithScope);
  }
}

module.exports = HtmlSkeletonWebpackPlugin;
