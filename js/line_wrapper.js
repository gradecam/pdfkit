// Generated by CoffeeScript 1.12.7
(function() {
  var EventEmitter, LineBreaker, LineWrapper,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  LineBreaker = require('linebreak');

  LineWrapper = (function(superClass) {
    extend(LineWrapper, superClass);

    function LineWrapper(document, options) {
      var ref;
      this.document = document;
      this.indent = options.indent || 0;
      this.characterSpacing = options.characterSpacing || 0;
      this.wordSpacing = options.wordSpacing === 0;
      this.columns = options.columns || 1;
      this.columnGap = (ref = options.columnGap) != null ? ref : 18;
      this.lineWidth = (options.width - (this.columnGap * (this.columns - 1))) / this.columns;
      this.spaceLeft = this.lineWidth;
      this.startX = this.document.x;
      this.startY = this.document.y;
      this.column = 1;
      this.ellipsis = options.ellipsis;
      this.continuedX = 0;
      this.features = options.features;
      if (options.height != null) {
        this.height = options.height;
        this.maxY = this.startY + options.height;
      } else {
        this.maxY = this.document.page.maxY();
      }
      this.on('firstLine', (function(_this) {
        return function(options) {
          var indent;
          indent = _this.continuedX || _this.indent;
          _this.document.x += indent;
          _this.lineWidth -= indent;
          return _this.once('line', function() {
            _this.document.x -= indent;
            _this.lineWidth += indent;
            if (options.continued && !_this.continuedX) {
              _this.continuedX = _this.indent;
            }
            if (!options.continued) {
              return _this.continuedX = 0;
            }
          });
        };
      })(this));
      this.on('lastLine', (function(_this) {
        return function(options) {
          var align;
          align = options.align;
          if (align === 'justify') {
            options.align = 'left';
          }
          _this.lastLine = true;
          return _this.once('line', function() {
            _this.document.y += options.paragraphGap || 0;
            options.align = align;
            return _this.lastLine = false;
          });
        };
      })(this));
    }

    LineWrapper.prototype.wordWidth = function(word) {
      return this.document.widthOfString(word, this) + this.characterSpacing + this.wordSpacing;
    };

    LineWrapper.prototype.eachWord = function(text, fn) {
      var bk, breaker, fbk, l, last, lbk, shouldContinue, w, word, wordWidths;
      breaker = new LineBreaker(text);
      last = null;
      wordWidths = Object.create(null);
      while (bk = breaker.nextBreak()) {
        word = text.slice((last != null ? last.position : void 0) || 0, bk.position);
        w = wordWidths[word] != null ? wordWidths[word] : wordWidths[word] = this.wordWidth(word);
        if (w > this.lineWidth + this.continuedX) {
          lbk = last;
          fbk = {};
          while (word.length) {
            l = word.length;
            while (w > this.spaceLeft && l > 0) {
              w = this.wordWidth(word.slice(0, --l));
            }
            if (l === 0) {
              break;
            }
            fbk.required = l < word.length;
            shouldContinue = fn(word.slice(0, l), w, fbk, lbk);
            lbk = {
              required: false
            };
            word = word.slice(l);
            w = this.wordWidth(word);
            if (shouldContinue === false) {
              break;
            }
          }
        } else {
          shouldContinue = fn(word, w, bk, last);
        }
        if (shouldContinue === false) {
          break;
        }
        last = bk;
      }
    };

    LineWrapper.prototype.wrap = function(text, options) {
      var buffer, emitLine, lc, nextY, textWidth, wc, y;
      if (options.indent != null) {
        this.indent = options.indent;
      }
      if (options.characterSpacing != null) {
        this.characterSpacing = options.characterSpacing;
      }
      if (options.wordSpacing != null) {
        this.wordSpacing = options.wordSpacing;
      }
      if (options.ellipsis != null) {
        this.ellipsis = options.ellipsis;
      }
      nextY = this.document.y + this.document.currentLineHeight(true);
      if (this.document.y > this.maxY || nextY > this.maxY) {
        this.nextSection();
      }
      buffer = '';
      textWidth = 0;
      wc = 0;
      lc = 0;
      y = this.document.y;
      emitLine = (function(_this) {
        return function() {
          options.textWidth = textWidth + _this.wordSpacing * (wc - 1);
          options.wordCount = wc;
          options.lineWidth = _this.lineWidth;
          y = _this.document.y;
          _this.emit('line', buffer, options, _this);
          return lc++;
        };
      })(this);
      this.emit('sectionStart', options, this);
      this.eachWord(text, (function(_this) {
        return function(word, w, bk, last) {
          var lh, shouldContinue;
          if ((last == null) || last.required) {
            _this.emit('firstLine', options, _this);
            _this.spaceLeft = _this.lineWidth;
          }
          if (w <= _this.spaceLeft) {
            buffer += word;
            textWidth += w;
            wc++;
          }
          if (bk.required || w > _this.spaceLeft) {
            if (bk.required) {
              _this.emit('lastLine', options, _this);
            }
            lh = _this.document.currentLineHeight(true);
            if ((_this.height != null) && _this.ellipsis && _this.document.y + lh * 2 > _this.maxY && _this.column >= _this.columns) {
              if (_this.ellipsis === true) {
                _this.ellipsis = '…';
              }
              buffer = buffer.replace(/\s+$/, '');
              textWidth = _this.wordWidth(buffer + _this.ellipsis);
              while (textWidth > _this.lineWidth) {
                buffer = buffer.slice(0, -1).replace(/\s+$/, '');
                textWidth = _this.wordWidth(buffer + _this.ellipsis);
              }
              buffer = buffer + _this.ellipsis;
            }
            if (bk.required && w > _this.spaceLeft) {
              buffer = word;
              textWidth = w;
              wc = 1;
            }
            emitLine();
            if (_this.document.y + lh > _this.maxY) {
              shouldContinue = _this.nextSection();
              if (!shouldContinue) {
                wc = 0;
                buffer = '';
                return false;
              }
            }
            if (bk.required) {
              _this.spaceLeft = _this.lineWidth;
              buffer = '';
              textWidth = 0;
              return wc = 0;
            } else {
              _this.spaceLeft = _this.lineWidth - w;
              buffer = word;
              textWidth = w;
              return wc = 1;
            }
          } else {
            return _this.spaceLeft -= w;
          }
        };
      })(this));
      if (wc > 0) {
        this.emit('lastLine', options, this);
        emitLine();
      }
      this.emit('sectionEnd', options, this);
      if (options.continued === true) {
        if (lc > 1) {
          this.continuedX = 0;
        }
        this.continuedX += options.textWidth;
        return this.document.y = y;
      } else {
        return this.document.x = this.startX;
      }
    };

    LineWrapper.prototype.nextSection = function(options) {
      var ref;
      this.emit('sectionEnd', options, this);
      if (++this.column > this.columns) {
        if (this.height != null) {
          return false;
        }
        this.document.addPage();
        this.column = 1;
        this.startY = this.document.page.margins.top;
        this.maxY = this.document.page.maxY();
        this.document.x = this.startX;
        if (this.document._fillColor) {
          (ref = this.document).fillColor.apply(ref, this.document._fillColor);
        }
        this.emit('pageBreak', options, this);
      } else {
        this.document.x += this.lineWidth + this.columnGap;
        this.document.y = this.startY;
        this.emit('columnBreak', options, this);
      }
      this.emit('sectionStart', options, this);
      return true;
    };

    return LineWrapper;

  })(EventEmitter);

  module.exports = LineWrapper;

}).call(this);
