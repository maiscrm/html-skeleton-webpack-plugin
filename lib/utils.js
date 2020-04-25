const { v4 } = require('uuid');
const loaderUtils = require('loader-utils');

function getScopeId() {
  return `data-skeleton-${v4().substr(0, 8)}`
}

function getCssFilename(rawFileName = 'sekeleton.[contenthash].css', source) {
  return (rawFileName || 'sekeleton.[contenthash].css')
    .replace(/\[name\]/ig, 'sekeleton')
    .replace(/\[contenthash(?::(\d+))?\]/ig, (_, maxLength = 20) => {
    return loaderUtils.getHashDigest(Buffer.from(source, 'utf8'), undefined, undefined, parseInt(maxLength, 10));
  });
}

module.exports = {
  getScopeId,
  getCssFilename,
}