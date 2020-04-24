const { compileStyle } = require('@vue/component-compiler-utils');
const templateCompiler = require('vue-template-compiler');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { v4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const PLUGIN_NAME = 'HtmlSkeletonWebpackPlugin';

class HtmlSkeletonWebpackPlugin {
  constructor() {
    this.scopeId = this.getScopeId();
  }

  apply(compiler) {
    if (compiler.hooks) {
      compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
        if (compilation.hooks.htmlWebpackPluginAlterAssetTags) {
          compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing.tapAsync(PLUGIN_NAME, (data, cb) => {
            const parseResult = templateCompiler.parseComponent(this.getSkeletonTemplateStr());
            this.injectSkeletonHtml(data, parseResult);
            console.warn(data);
            return cb(null, data);
          })
        } else if (HtmlWebpackPlugin && HtmlWebpackPlugin['getHooks']) {
          HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapAsync(PLUGIN_NAME, (data, cb) => {
            console.warn('webpack 4', data);
            return cb(null, data);
          });
        }
        // HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tapAsync(
        //   'HtmlSkeletonWebpackPlugin',
        //   (data, cb) => {
        //     const vueStr = fs.readFileSync(path.resolve(__dirname, '../templates/loading.vue')).toString();
        //     const parseResult = templateCompiler.parseComponent(vueStr);
        //     const scopeId = this.getScopeId();
        //     this.injectSkeletonHtml(data, parseResult.template, scopeId);
        //     this.getSkeletonStyleTag(data, parseResult.styles[0], scopeId);
        //     cb(null, data);
        //   },
        // );
      });
    }
  }

  getSkeletonTemplateStr() {
    return fs.readFileSync(path.resolve(__dirname, '../templates/loading.vue')).toString();
  }

  injectSkeletonHtml(htmlData, parseResult) {
    const templateWithScope = this.addScopeIdToTemplate(parseResult.template, this.scopeId);
    const skeletonStyleTag = this.getSkeletonStyleTag(parseResult.styles[0])
    htmlData.html = htmlData.html.replace(/<!-- inject-skeleton -->/, `${templateWithScope}${skeletonStyleTag}`);
  }

  getSkeletonStyleTag (style) {
    const styleWithScope = compileStyle({
      source: style.content,
      id: this.scopeId,
      scoped: true,
      trim: true,
    });
    return `<style type: 'text/css'>${styleWithScope.code.replace(/\n/g, '')}</style>`;
  }

  addScopeIdToTemplate(template) {
    return template.content.replace(/(class="[\w-\s]+")/g, word => `${word} ${this.scopeId}`)
  }

  getScopeId() {
    return `data-v-${v4().substr(0, 8)}`
  }
}

module.exports = HtmlSkeletonWebpackPlugin;
