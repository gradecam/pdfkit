// Generated by CoffeeScript 1.12.4

/*
PDFImage - embeds images in PDF documents
By Devon Govett
 */

(function() {
  var Data, JPEG, PDFImage, PNG, fs;

  fs = require('fs');

  Data = require('./data');

  JPEG = require('./image/jpeg');

  PNG = require('./image/png');

  PDFImage = (function() {
    function PDFImage() {}

    PDFImage.open = function(src, label) {
      var data, match;
      if (Buffer.isBuffer(src)) {
        data = src;
      } else if (src instanceof ArrayBuffer) {
        data = new Buffer(new Uint8Array(src));
      } else {
        if (match = /^data:.+;base64,(.*)$/.exec(src)) {
          data = new Buffer(match[1], 'base64');
        } else {
          data = fs.readFileSync(src);
          if (!data) {
            return;
          }
        }
      }
      if (data[0] === 0xff && data[1] === 0xd8) {
        return new JPEG(data, label);
      } else if (data[0] === 0x89 && data.toString('ascii', 1, 4) === 'PNG') {
        return new PNG(data, label);
      } else {
        throw new Error('Unknown image format.');
      }
    };

    return PDFImage;

  })();

  module.exports = PDFImage;

}).call(this);
