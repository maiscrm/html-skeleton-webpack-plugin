const { compileStyle } = require('@vue/component-compiler-utils');
const templateCompiler = require('vue-template-compiler');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { v4 } = require('uuid');
const path = require('path');
const fs = require('fs');

class HtmlSkeletonWebpackPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('HtmlSkeletonWebpackPlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tapAsync(
        'HtmlSkeletonWebpackPlugin',
        (data, cb) => {
          const vueStr = fs.readFileSync(path.resolve(__dirname, '../templates/loading.vue')).toString();
          const parseResult = templateCompiler.parseComponent(vueStr);
          const scopeId = this.getScopeId();
          this.injectSkeletonHtml(data, parseResult.template, scopeId);
          this.injectSkeletonStyle(data, parseResult.styles[0], scopeId);
          cb(null, data);
        },
      );
    });
  }

  injectSkeletonHtml(htmlData, template, scopeId) {
    const templateWithScope = this.addScopeIdToTemplate(template.content, scopeId);
    htmlData.html = htmlData.html.replace('<!-- skeleton -->', templateWithScope);
  }

  injectSkeletonStyle (htmlData, style, scopeId) {
    const styleWithScope = compileStyle({
      source: style.content,
      id: scopeId,
      scoped: true,
      trim: true,
    });
    console.log(styleWithScope)
    htmlData.headTags.push({
      tagName: 'style',
      attributes: { type: 'text/css' },
      innerHTML: styleWithScope.code.replace(/\n/g, ''),
    });
  }

  addScopeIdToTemplate(template, scopeId) {
    return template.replace(/(class="[\w-\s]+")/g, word => `${word} ${scopeId}`)
  }

  getScopeId() {
    return `data-v-${v4().substr(0, 8)}`
  }
}

module.exports = HtmlSkeletonWebpackPlugin;
