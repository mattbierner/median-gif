(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[0],{

/***/ "./src/gifencoder.js":
/*!***************************!*\
  !*** ./src/gifencoder.js ***!
  \***************************/
/*! exports provided: GifEncoder */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GifEncoder", function() { return GifEncoder; });
function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// From encoder/gifencoder
// IDEA: could we speed this up with WASM?
function computeDiff(a, b, width) {
  var ua = new Uint32Array(a);
  var ub = new Uint32Array(b);
  var top = undefined;
  var bottom = undefined;
  var left = width + 1;
  var right = -1;

  for (var i = 0; i < ua.length; i++) {
    if (ua[i] !== ub[i]) {
      var y = Math.floor(i / width);
      var x = i % width;
      if (top === undefined) top = y;
      bottom = y;
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
  }

  if (top !== undefined) {
    return {
      top: top,
      left: left,
      width: right - left + 1,
      height: bottom - top + 1
    };
  }

  return undefined;
}

function cropBuffer(_from, box, width) {
  var result = new ArrayBuffer(4 * box.width * box.height);
  var arr = new Uint32Array(result);
  var from = new Uint32Array(_from);

  for (var y = 0; y < box.height; y++) {
    for (var x = 0; x < box.width; x++) {
      arr[x + y * box.width] = from[box.left + x + (box.top + y) * width];
    }
  }

  return result;
}

var GifEncoder = /*#__PURE__*/function () {
  function GifEncoder(opts) {
    var _this = this;

    _classCallCheck(this, GifEncoder);

    this.opts = opts;
    this.listeners = new Map();
    this.previousBuffer = undefined;
    this.frames = [];
    this.quantizers = [];
    this.framesSentToQuantize = 0;
    this.framesQuantized = 0;
    this.framesSentToEncode = 0;
    this.totalFrames = undefined;
    this.busyQuantizers = 0;
    this.writer = new Worker('encoder/writer.js');
    this.writer.postMessage(opts);

    var onMessage = function onMessage(msg) {
      return _this._onWriterMessage(msg);
    };

    this.writer.addEventListener('message', onMessage);

    this.disposeWriter = function () {
      return _this.writer.removeEventListener('message', onMessage);
    };

    var numberOfWorkers = navigator.hardwareConcurrency ? Math.floor(navigator.hardwareConcurrency * 0.8) : 4;

    var _loop = function _loop(i) {
      var worker = new Worker('encoder/quantizer.js');

      var onMessage = function onMessage(msg) {
        return _this._onQuantizerMessage(i, msg);
      };

      worker.addEventListener('message', onMessage);

      var dispose = function dispose() {
        return worker.removeEventListener('message', onMessage);
      };

      _this.quantizers.push({
        worker: worker,
        busy: false,
        frameIndex: undefined,
        dispose: dispose
      });
    };

    for (var i = 0; i < numberOfWorkers; i++) {
      _loop(i);
    }
  }

  _createClass(GifEncoder, [{
    key: "addFrame",
    value: function addFrame(imageData, delay) {
      if (!this.quantizers || this.totalFrames !== undefined) {
        return;
      }

      var buffer = imageData.data.buffer;

      if (!this.previousBuffer) {
        this.frames.push({
          buffer: buffer,
          top: 0,
          left: 0,
          width: this.opts.width,
          height: this.opts.height,
          paletteLength: undefined,
          delay: delay,
          quantized: false
        });
      } else {
        var box = computeDiff(buffer, this.previousBuffer, this.opts.width);

        if (!box) {
          this.frames[this.frames.length - 1].delay += delay; // no changes, let's drop the frame
        } else {
          var crop = cropBuffer(buffer, box, this.opts.width);
          this.frames.push(_objectSpread(_objectSpread({
            buffer: crop
          }, box), {}, {
            paletteLength: undefined,
            delay: delay,
            quantized: false
          }));
        }
      }

      this.previousBuffer = buffer;

      this._work();
    }
  }, {
    key: "_work",
    value: function _work() {
      if (!this.quantizers) {
        return;
      }

      while (this.framesSentToQuantize < (this.totalFrames === undefined ? this.frames.length - 1 : this.totalFrames) && this.busyQuantizers < this.quantizers.length) {
        var frameIndex = this.framesSentToQuantize++;
        var frame = this.frames[frameIndex];
        var worker = this.quantizers[this.quantizers.findIndex(function (x) {
          return !x.busy;
        })];
        worker.busy = true;
        worker.frameIndex = frameIndex;
        worker.worker.postMessage(frame, {
          transfer: [frame.buffer]
        });
        this.busyQuantizers++;
      }
    }
  }, {
    key: "_onQuantizerMessage",
    value: function _onQuantizerMessage(workerIndex, msg) {
      if (!this.quantizers) {
        return;
      }

      var worker = this.quantizers[workerIndex];
      worker.busy = false;
      this.busyQuantizers--;
      this.framesQuantized++;
      var frame = this.frames[worker.frameIndex];
      frame.buffer = msg.data.buffer;
      frame.paletteLength = msg.data.paletteLength;
      frame.quantized = true;

      while ((this.totalFrames === undefined || this.framesSentToEncode < this.totalFrames) && this.frames[this.framesSentToEncode].quantized) {
        var frameIndex = this.framesSentToEncode++;
        var _frame = this.frames[frameIndex];
        this.writer.postMessage(_frame, {
          transfer: [_frame.buffer]
        });
        this.frames[frameIndex] = undefined; // gc
      }

      if (this.framesSentToEncode === this.totalFrames) {
        this.writer.postMessage('finish', {
          transfer: []
        });
      }

      if (this.totalFrames !== undefined) {
        this._emit('progress', this.framesQuantized / this.totalFrames);
      }

      this._work();
    }
  }, {
    key: "_onWriterMessage",
    value: function _onWriterMessage(msg) {
      var blob = new Blob([msg.data], {
        type: 'image/gif'
      });

      this._emit('finished', blob);

      this.dispose();
    }
  }, {
    key: "render",
    value: function render() {
      if (!this.quantizers) {
        return;
      }

      this.totalFrames = this.frames.length;

      this._work();
    }
  }, {
    key: "abort",
    value: function abort() {
      this.dispose();
    }
  }, {
    key: "dispose",
    value: function dispose() {
      if (!this.quantizers) {
        return;
      }

      this.writer.terminate();
      this.disposeWriter();

      var _iterator = _createForOfIteratorHelper(this.quantizers),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _step$value = _step.value,
              worker = _step$value.worker,
              dispose = _step$value.dispose;
          worker.terminate();
          dispose();
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      this.quantizers = undefined;
      this.frames = undefined;
    } // event listener

  }, {
    key: "on",
    value: function on(event, fn) {
      var listeners = this.listeners.get(event);

      if (!listeners) {
        listeners = [];
        this.listeners.set(event, listeners);
      }

      listeners.push(fn);
      return function () {
        return listeners.splice(listeners.indexOf(fn), 1);
      };
    }
  }, {
    key: "once",
    value: function once(event, fn) {
      var remove = this.on(event, function (data) {
        fn(data);
        remove();
      });
    }
  }, {
    key: "_emit",
    value: function _emit(event, data) {
      var listeners = this.listeners.get(event) || [];

      var _iterator2 = _createForOfIteratorHelper(listeners),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var listener = _step2.value;
          listener(data);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
  }]);

  return GifEncoder;
}();

/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvZ2lmZW5jb2Rlci5qcyJdLCJuYW1lcyI6WyJjb21wdXRlRGlmZiIsImEiLCJiIiwid2lkdGgiLCJ1YSIsIlVpbnQzMkFycmF5IiwidWIiLCJ0b3AiLCJ1bmRlZmluZWQiLCJib3R0b20iLCJsZWZ0IiwicmlnaHQiLCJpIiwibGVuZ3RoIiwieSIsIk1hdGgiLCJmbG9vciIsIngiLCJtaW4iLCJtYXgiLCJoZWlnaHQiLCJjcm9wQnVmZmVyIiwiX2Zyb20iLCJib3giLCJyZXN1bHQiLCJBcnJheUJ1ZmZlciIsImFyciIsImZyb20iLCJHaWZFbmNvZGVyIiwib3B0cyIsImxpc3RlbmVycyIsIk1hcCIsInByZXZpb3VzQnVmZmVyIiwiZnJhbWVzIiwicXVhbnRpemVycyIsImZyYW1lc1NlbnRUb1F1YW50aXplIiwiZnJhbWVzUXVhbnRpemVkIiwiZnJhbWVzU2VudFRvRW5jb2RlIiwidG90YWxGcmFtZXMiLCJidXN5UXVhbnRpemVycyIsIndyaXRlciIsIldvcmtlciIsInBvc3RNZXNzYWdlIiwib25NZXNzYWdlIiwibXNnIiwiX29uV3JpdGVyTWVzc2FnZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJkaXNwb3NlV3JpdGVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsIm51bWJlck9mV29ya2VycyIsIm5hdmlnYXRvciIsImhhcmR3YXJlQ29uY3VycmVuY3kiLCJ3b3JrZXIiLCJfb25RdWFudGl6ZXJNZXNzYWdlIiwiZGlzcG9zZSIsInB1c2giLCJidXN5IiwiZnJhbWVJbmRleCIsImltYWdlRGF0YSIsImRlbGF5IiwiYnVmZmVyIiwiZGF0YSIsInBhbGV0dGVMZW5ndGgiLCJxdWFudGl6ZWQiLCJjcm9wIiwiX3dvcmsiLCJmcmFtZSIsImZpbmRJbmRleCIsInRyYW5zZmVyIiwid29ya2VySW5kZXgiLCJfZW1pdCIsImJsb2IiLCJCbG9iIiwidHlwZSIsInRlcm1pbmF0ZSIsImV2ZW50IiwiZm4iLCJnZXQiLCJzZXQiLCJzcGxpY2UiLCJp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QUFBQTtBQUFBLDBCQW1LUU4sS0FuS1IsRUFtS2VkLElBbktmLEVBbUtxQjtBQUNqQixVQUFNL0IsU0FBUyxHQUFHLEtBQUtBLFNBQUwsQ0FBZStDLEdBQWYsQ0FBbUJGLEtBQW5CLEtBQTZCLEVBQS9DOztBQURpQixrREFHTTdDLFNBSE47QUFBQTs7QUFBQTtBQUdqQiwrREFBa0M7QUFBQSxjQUF2QnFELFFBQXVCO0FBQ2hDQSxrQkFBUSxDQUFDdEIsSUFBRCxDQUFSO0FBQ0Q7QUFMZ0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQU1sQjtBQXpLSDs7QUFBQTtBQUFBLEkiLCJmaWxlIjoiMC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEZyb20gZW5jb2Rlci9naWZlbmNvZGVyXG5cbi8vIElERUE6IGNvdWxkIHdlIHNwZWVkIHRoaXMgdXAgd2l0aCBXQVNNP1xuZnVuY3Rpb24gY29tcHV0ZURpZmYoYSwgYiwgd2lkdGgpIHtcbiAgY29uc3QgdWEgPSBuZXcgVWludDMyQXJyYXkoYSk7XG4gIGNvbnN0IHViID0gbmV3IFVpbnQzMkFycmF5KGIpO1xuXG4gIGxldCB0b3AgPSB1bmRlZmluZWQ7XG4gIGxldCBib3R0b20gPSB1bmRlZmluZWQ7XG4gIGxldCBsZWZ0ID0gd2lkdGggKyAxO1xuICBsZXQgcmlnaHQgPSAtMTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHVhLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCh1YVtpXSAhPT0gdWJbaV0pKSB7XG4gICAgICBjb25zdCB5ID0gTWF0aC5mbG9vcihpIC8gd2lkdGgpO1xuICAgICAgY29uc3QgeCA9IGkgJSB3aWR0aDtcblxuICAgICAgaWYgKHRvcCA9PT0gdW5kZWZpbmVkKSB0b3AgPSB5O1xuICAgICAgYm90dG9tID0geTtcbiAgICAgIGxlZnQgPSBNYXRoLm1pbihsZWZ0LCB4KTtcbiAgICAgIHJpZ2h0ID0gTWF0aC5tYXgocmlnaHQsIHgpO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0b3AgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB7IHRvcCwgbGVmdCwgd2lkdGg6IHJpZ2h0IC0gbGVmdCArIDEsIGhlaWdodDogYm90dG9tIC0gdG9wICsgMSB9O1xuICB9XG5cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gY3JvcEJ1ZmZlcihfZnJvbSwgYm94LCB3aWR0aCkge1xuICBjb25zdCByZXN1bHQgPSBuZXcgQXJyYXlCdWZmZXIoNCAqIGJveC53aWR0aCAqIGJveC5oZWlnaHQpO1xuICBjb25zdCBhcnIgPSBuZXcgVWludDMyQXJyYXkocmVzdWx0KTtcbiAgY29uc3QgZnJvbSA9IG5ldyBVaW50MzJBcnJheShfZnJvbSk7XG5cbiAgZm9yIChsZXQgeSA9IDA7IHkgPCBib3guaGVpZ2h0OyB5KyspIHtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGJveC53aWR0aDsgeCsrKSB7XG4gICAgICBhcnJbeCArIHkgKiBib3gud2lkdGhdID0gZnJvbVtib3gubGVmdCArIHggKyAoYm94LnRvcCArIHkpICogd2lkdGhdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBjbGFzcyBHaWZFbmNvZGVyIHtcblxuICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgdGhpcy5vcHRzID0gb3B0cztcbiAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBNYXAoKTtcblxuICAgIHRoaXMucHJldmlvdXNCdWZmZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5mcmFtZXMgPSBbXTtcbiAgICB0aGlzLnF1YW50aXplcnMgPSBbXTtcbiAgICB0aGlzLmZyYW1lc1NlbnRUb1F1YW50aXplID0gMDtcbiAgICB0aGlzLmZyYW1lc1F1YW50aXplZCA9IDA7XG4gICAgdGhpcy5mcmFtZXNTZW50VG9FbmNvZGUgPSAwO1xuICAgIHRoaXMudG90YWxGcmFtZXMgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5idXN5UXVhbnRpemVycyA9IDA7XG5cbiAgICB0aGlzLndyaXRlciA9IG5ldyBXb3JrZXIoJ2VuY29kZXIvd3JpdGVyLmpzJyk7XG4gICAgdGhpcy53cml0ZXIucG9zdE1lc3NhZ2Uob3B0cyk7XG5cbiAgICBjb25zdCBvbk1lc3NhZ2UgPSBtc2cgPT4gdGhpcy5fb25Xcml0ZXJNZXNzYWdlKG1zZyk7XG4gICAgdGhpcy53cml0ZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG9uTWVzc2FnZSk7XG4gICAgdGhpcy5kaXNwb3NlV3JpdGVyID0gKCkgPT4gdGhpcy53cml0ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG9uTWVzc2FnZSk7XG5cbiAgICBjb25zdCBudW1iZXJPZldvcmtlcnMgPSBuYXZpZ2F0b3IuaGFyZHdhcmVDb25jdXJyZW5jeSA/IE1hdGguZmxvb3IobmF2aWdhdG9yLmhhcmR3YXJlQ29uY3VycmVuY3kgKiAwLjgpIDogNDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bWJlck9mV29ya2VyczsgaSsrKSB7XG4gICAgICBjb25zdCB3b3JrZXIgPSBuZXcgV29ya2VyKCdlbmNvZGVyL3F1YW50aXplci5qcycpO1xuICAgICAgY29uc3Qgb25NZXNzYWdlID0gbXNnID0+IHRoaXMuX29uUXVhbnRpemVyTWVzc2FnZShpLCBtc2cpO1xuICAgICAgd29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBvbk1lc3NhZ2UpO1xuICAgICAgY29uc3QgZGlzcG9zZSA9ICgpID0+IHdvcmtlci5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgb25NZXNzYWdlKTtcbiAgICAgIHRoaXMucXVhbnRpemVycy5wdXNoKHsgd29ya2VyLCBidXN5OiBmYWxzZSwgZnJhbWVJbmRleDogdW5kZWZpbmVkLCBkaXNwb3NlIH0pO1xuICAgIH1cbiAgfVxuXG4gIGFkZEZyYW1lKGltYWdlRGF0YSwgZGVsYXkpIHtcbiAgICBpZiAoIXRoaXMucXVhbnRpemVycyB8fCB0aGlzLnRvdGFsRnJhbWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBidWZmZXIgPSBpbWFnZURhdGEuZGF0YS5idWZmZXI7XG5cbiAgICBpZiAoIXRoaXMucHJldmlvdXNCdWZmZXIpIHtcbiAgICAgIHRoaXMuZnJhbWVzLnB1c2goeyBidWZmZXIsIHRvcDogMCwgbGVmdDogMCwgd2lkdGg6IHRoaXMub3B0cy53aWR0aCwgaGVpZ2h0OiB0aGlzLm9wdHMuaGVpZ2h0LCBwYWxldHRlTGVuZ3RoOiB1bmRlZmluZWQsIGRlbGF5LCBxdWFudGl6ZWQ6IGZhbHNlIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBib3ggPSBjb21wdXRlRGlmZihidWZmZXIsIHRoaXMucHJldmlvdXNCdWZmZXIsIHRoaXMub3B0cy53aWR0aCk7XG5cbiAgICAgIGlmICghYm94KSB7XG4gICAgICAgIHRoaXMuZnJhbWVzW3RoaXMuZnJhbWVzLmxlbmd0aCAtIDFdLmRlbGF5ICs9IGRlbGF5OyAvLyBubyBjaGFuZ2VzLCBsZXQncyBkcm9wIHRoZSBmcmFtZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY3JvcCA9IGNyb3BCdWZmZXIoYnVmZmVyLCBib3gsIHRoaXMub3B0cy53aWR0aCk7XG4gICAgICAgIHRoaXMuZnJhbWVzLnB1c2goeyBidWZmZXI6IGNyb3AsIC4uLmJveCwgcGFsZXR0ZUxlbmd0aDogdW5kZWZpbmVkLCBkZWxheSwgcXVhbnRpemVkOiBmYWxzZSB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnByZXZpb3VzQnVmZmVyID0gYnVmZmVyO1xuICAgIHRoaXMuX3dvcmsoKTtcbiAgfVxuXG4gIF93b3JrKCkge1xuICAgIGlmICghdGhpcy5xdWFudGl6ZXJzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgd2hpbGUgKHRoaXMuZnJhbWVzU2VudFRvUXVhbnRpemUgPCAodGhpcy50b3RhbEZyYW1lcyA9PT0gdW5kZWZpbmVkID8gdGhpcy5mcmFtZXMubGVuZ3RoIC0gMSA6IHRoaXMudG90YWxGcmFtZXMpICYmIHRoaXMuYnVzeVF1YW50aXplcnMgPCB0aGlzLnF1YW50aXplcnMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBmcmFtZUluZGV4ID0gdGhpcy5mcmFtZXNTZW50VG9RdWFudGl6ZSsrO1xuICAgICAgY29uc3QgZnJhbWUgPSB0aGlzLmZyYW1lc1tmcmFtZUluZGV4XTtcbiAgICAgIGNvbnN0IHdvcmtlciA9IHRoaXMucXVhbnRpemVyc1t0aGlzLnF1YW50aXplcnMuZmluZEluZGV4KHggPT4gIXguYnVzeSldO1xuXG4gICAgICB3b3JrZXIuYnVzeSA9IHRydWU7XG4gICAgICB3b3JrZXIuZnJhbWVJbmRleCA9IGZyYW1lSW5kZXg7XG4gICAgICB3b3JrZXIud29ya2VyLnBvc3RNZXNzYWdlKGZyYW1lLCB7IHRyYW5zZmVyOiBbZnJhbWUuYnVmZmVyXSB9KTtcbiAgICAgIHRoaXMuYnVzeVF1YW50aXplcnMrKztcbiAgICB9XG4gIH1cblxuICBfb25RdWFudGl6ZXJNZXNzYWdlKHdvcmtlckluZGV4LCBtc2cpIHtcbiAgICBpZiAoIXRoaXMucXVhbnRpemVycykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHdvcmtlciA9IHRoaXMucXVhbnRpemVyc1t3b3JrZXJJbmRleF07XG4gICAgd29ya2VyLmJ1c3kgPSBmYWxzZTtcbiAgICB0aGlzLmJ1c3lRdWFudGl6ZXJzLS07XG4gICAgdGhpcy5mcmFtZXNRdWFudGl6ZWQrKztcblxuICAgIGNvbnN0IGZyYW1lID0gdGhpcy5mcmFtZXNbd29ya2VyLmZyYW1lSW5kZXhdO1xuICAgIGZyYW1lLmJ1ZmZlciA9IG1zZy5kYXRhLmJ1ZmZlcjtcbiAgICBmcmFtZS5wYWxldHRlTGVuZ3RoID0gbXNnLmRhdGEucGFsZXR0ZUxlbmd0aDtcbiAgICBmcmFtZS5xdWFudGl6ZWQgPSB0cnVlO1xuXG4gICAgd2hpbGUgKCh0aGlzLnRvdGFsRnJhbWVzID09PSB1bmRlZmluZWQgfHwgdGhpcy5mcmFtZXNTZW50VG9FbmNvZGUgPCB0aGlzLnRvdGFsRnJhbWVzKSAmJiB0aGlzLmZyYW1lc1t0aGlzLmZyYW1lc1NlbnRUb0VuY29kZV0ucXVhbnRpemVkKSB7XG4gICAgICBjb25zdCBmcmFtZUluZGV4ID0gdGhpcy5mcmFtZXNTZW50VG9FbmNvZGUrKztcbiAgICAgIGNvbnN0IGZyYW1lID0gdGhpcy5mcmFtZXNbZnJhbWVJbmRleF07XG4gICAgICB0aGlzLndyaXRlci5wb3N0TWVzc2FnZShmcmFtZSwgeyB0cmFuc2ZlcjogW2ZyYW1lLmJ1ZmZlcl0gfSk7XG4gICAgICB0aGlzLmZyYW1lc1tmcmFtZUluZGV4XSA9IHVuZGVmaW5lZDsgLy8gZ2NcbiAgICB9XG5cbiAgICBpZiAodGhpcy5mcmFtZXNTZW50VG9FbmNvZGUgPT09IHRoaXMudG90YWxGcmFtZXMpIHtcbiAgICAgIHRoaXMud3JpdGVyLnBvc3RNZXNzYWdlKCdmaW5pc2gnLCB7IHRyYW5zZmVyOiBbXSB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy50b3RhbEZyYW1lcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9lbWl0KCdwcm9ncmVzcycsIHRoaXMuZnJhbWVzUXVhbnRpemVkIC8gdGhpcy50b3RhbEZyYW1lcyk7XG4gICAgfVxuXG4gICAgdGhpcy5fd29yaygpO1xuICB9XG5cbiAgX29uV3JpdGVyTWVzc2FnZShtc2cpIHtcbiAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW21zZy5kYXRhXSwgeyB0eXBlOiAnaW1hZ2UvZ2lmJyB9KTtcbiAgICB0aGlzLl9lbWl0KCdmaW5pc2hlZCcsIGJsb2IpO1xuICAgIHRoaXMuZGlzcG9zZSgpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIGlmICghdGhpcy5xdWFudGl6ZXJzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy50b3RhbEZyYW1lcyA9IHRoaXMuZnJhbWVzLmxlbmd0aDtcbiAgICB0aGlzLl93b3JrKCk7XG4gIH1cblxuICBhYm9ydCgpIHtcbiAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgaWYgKCF0aGlzLnF1YW50aXplcnMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLndyaXRlci50ZXJtaW5hdGUoKTtcbiAgICB0aGlzLmRpc3Bvc2VXcml0ZXIoKTtcblxuICAgIGZvciAoY29uc3QgeyB3b3JrZXIsIGRpc3Bvc2UgfSBvZiB0aGlzLnF1YW50aXplcnMpIHtcbiAgICAgIHdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICAgIGRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICB0aGlzLnF1YW50aXplcnMgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5mcmFtZXMgPSB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBldmVudCBsaXN0ZW5lclxuXG4gIG9uKGV2ZW50LCBmbikge1xuICAgIGxldCBsaXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycy5nZXQoZXZlbnQpO1xuXG4gICAgaWYgKCFsaXN0ZW5lcnMpIHtcbiAgICAgIGxpc3RlbmVycyA9IFtdO1xuICAgICAgdGhpcy5saXN0ZW5lcnMuc2V0KGV2ZW50LCBsaXN0ZW5lcnMpO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5wdXNoKGZuKTtcbiAgICByZXR1cm4gKCkgPT4gbGlzdGVuZXJzLnNwbGljZShsaXN0ZW5lcnMuaW5kZXhPZihmbiksIDEpO1xuICB9XG5cbiAgb25jZShldmVudCwgZm4pIHtcbiAgICBjb25zdCByZW1vdmUgPSB0aGlzLm9uKGV2ZW50LCBkYXRhID0+IHtcbiAgICAgIGZuKGRhdGEpO1xuICAgICAgcmVtb3ZlKCk7XG4gICAgfSk7XG4gIH1cblxuICBfZW1pdChldmVudCwgZGF0YSkge1xuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJzLmdldChldmVudCkgfHwgW107XG5cbiAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVycykge1xuICAgICAgbGlzdGVuZXIoZGF0YSk7XG4gICAgfVxuICB9XG59Il0sInNvdXJjZVJvb3QiOiIifQ==