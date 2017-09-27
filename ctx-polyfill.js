(function() {
  /**
   * Helper to be compatible with future standard (because current standards are not yet properly defined)
   */

  if(CanvasRenderingContext2D.useSVGMatrix === void 0) {
    CanvasRenderingContext2D.useSVGMatrix = false;
  }

  CanvasRenderingContext2D.arrayToSVGMatrix = function(matrix) {
    if(matrix instanceof SVGMatrix) {
      return matrix;
    } else if(matrix instanceof Array) {
      var _matrix = document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGMatrix();
      _matrix.a = array[0];
      _matrix.b = array[1];
      _matrix.c = array[2];
      _matrix.d = array[3];
      _matrix.e = array[4];
      _matrix.f = array[5];
      return _matrix;
    } else {
      throw new Error('Matrix is not an Array');
    }
  };

  CanvasRenderingContext2D.svgMatrixToArray = function(matrix) {
    if(matrix instanceof Array) {
      return matrix;
    } else if(matrix instanceof SVGMatrix) {
      return [
        matrix.a,
        matrix.b,
        matrix.c,
        matrix.d,
        matrix.e,
        matrix.f
      ];
    } else {
      throw new Error('Matrix is not a SVGMatrix');
    }
  };


})();

(function() {
  /**
   * Polyfill CanvasRenderingContext2D
   */

    // inspired form https://github.com/mozilla/pdf.js/blob/master/src/display/canvas.js

  var canvasRenderingContext2DPrototype = CanvasRenderingContext2D.prototype;
  var HTMLCanvasElementPrototype = HTMLCanvasElement.prototype;

  if(!('resetTransform' in canvasRenderingContext2DPrototype)) {
    canvasRenderingContext2DPrototype.resetTransform = function() {
      this.setTransform(1, 0, 0, 1, 0, 0);
    };
  }

  if(!('currentTransform' in canvasRenderingContext2DPrototype)) {
    if('mozCurrentTransform' in canvasRenderingContext2DPrototype) {
      Object.defineProperty(canvasRenderingContext2DPrototype, 'currentTransform', {
        get: function() {
          return this.mozCurrentTransform;
        },
        set: function(matrix) {
          this.mozCurrentTransform = matrix;
        },
        enumerable: true,
        configurable: true
      });
    } else {
      var getContext = HTMLCanvasElementPrototype.getContext;
      HTMLCanvasElementPrototype.getContext = function(contextType, contextAttributes) {
        var context = getContext.call(this, contextType, contextAttributes);
        switch(contextType) {
          case '2d':
            Object.defineProperties(context, {
              '_transformStack': { value: [], configurable: true, writable: true },
              '_transformMatrix': { value: [1, 0, 0, 1, 0, 0], configurable: true, writable: true }
            });
            break;
        }
        return context;
      };

      Object.defineProperty(canvasRenderingContext2DPrototype, 'currentTransform', {
        get: function() {
          return this._transformMatrix;
        },
        set: function(matrix) {
          this._transformMatrix = matrix;
          this.setTransform(
            matrix[0],
            matrix[1],
            matrix[2],
            matrix[3],
            matrix[4],
            matrix[5]
          );
        },
        enumerable: true,
        configurable: true
      });


      var translate = canvasRenderingContext2DPrototype.translate;
      canvasRenderingContext2DPrototype.translate = function(x, y) {
        var matrix = this._transformMatrix;
        matrix[4] = matrix[0] * x + matrix[2] * y + matrix[4];
        matrix[5] = matrix[1] * x + matrix[3] * y + matrix[5];
        translate.call(this, x, y);
      };

      var scale = canvasRenderingContext2DPrototype.scale;
      canvasRenderingContext2DPrototype.scale = function(x, y) {
        var matrix = this._transformMatrix;
        matrix[0] *= x;
        matrix[1] *= x;
        matrix[2] *= y;
        matrix[3] *= y;
        scale.call(this, x, y);
      };

      var rotate = canvasRenderingContext2DPrototype.rotate;
      canvasRenderingContext2DPrototype.rotate = function(angle) {
        var cosValue = Math.cos(angle);
        var sinValue = Math.sin(angle);

        var matrix = this._transformMatrix;
        this._transformMatrix = [
          matrix[0] * cosValue + matrix[2] * sinValue,
          matrix[1] * cosValue + matrix[3] * sinValue,
          matrix[0] * (-sinValue) + matrix[2] * cosValue,
          matrix[1] * (-sinValue) + matrix[3] * cosValue,
          matrix[4],
          matrix[5]
        ];

        rotate.call(this, angle);
      };

      var transform = canvasRenderingContext2DPrototype.transform;
      canvasRenderingContext2DPrototype.transform = function(a, b, c, d, e, f) {
        var matrix = this._transformMatrix;
        this._transformMatrix = [
          matrix[0] * a + matrix[2] * b,
          matrix[1] * a + matrix[3] * b,
          matrix[0] * c + matrix[2] * d,
          matrix[1] * c + matrix[3] * d,
          matrix[0] * e + matrix[2] * f + matrix[4],
          matrix[1] * e + matrix[3] * f + matrix[5]
        ];
        transform.call(this, a, b, c, d, e, f);
      };

      var setTransform = canvasRenderingContext2DPrototype.setTransform;
      canvasRenderingContext2DPrototype.setTransform = function(a, b, c, d, e, f) {
        this._transformMatrix = [a, b, c, d, e, f];
        setTransform.call(this, a, b, c, d, e, f);
      };

      var resetTransform = canvasRenderingContext2DPrototype.resetTransform;
      canvasRenderingContext2DPrototype.resetTransform = function() {
        this._transformMatrix = [1, 0, 0, 1, 0, 0];
        resetTransform.call(this);
      };

      var save = canvasRenderingContext2DPrototype.save;
      canvasRenderingContext2DPrototype.save = function() {
        this._transformStack.push(this._transformMatrix);
        this._transformMatrix = this._transformMatrix.slice(0, 6); // copy
        save.call(this);
      };

      var restore = canvasRenderingContext2DPrototype.restore;
      canvasRenderingContext2DPrototype.restore = function() {
        var matrix = this._transformStack.pop();
        if(matrix) {
          this._transformMatrix = matrix;
        }
        restore.call(this);
      };

    }
  }

  // allow conversion from arrayToSVGMatrix or svgMatrixToArray according to useSVGMatrix
  var currentTransform = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'currentTransform');
  var currentTransformIsSVGMatrix = (document.createElement('canvas').getContext('2d').currentTransform instanceof SVGMatrix);
  Object.defineProperty(canvasRenderingContext2DPrototype, 'currentTransform', {
    get: function() {
      var value = currentTransform.get.call(this);
      return CanvasRenderingContext2D.useSVGMatrix ?
        CanvasRenderingContext2D.arrayToSVGMatrix(value) : CanvasRenderingContext2D.svgMatrixToArray(value);
    },
    set: function(matrix) {
      currentTransform.set.call(this, currentTransformIsSVGMatrix ?
        CanvasRenderingContext2D.svgMatrixToArray(matrix) : CanvasRenderingContext2D.svgMatrixToArray(matrix));
    },
    enumerable: true,
    configurable: true
  });


  if(!('imageSmoothingEnabled' in canvasRenderingContext2DPrototype)) {
    Object.defineProperty(canvasRenderingContext2DPrototype, 'imageSmoothingEnabled', {
      get: function() {
        if(this.mozImageSmoothingEnabled !== void 0) {
          return this.mozImageSmoothingEnabled;
        } else if(this.webkitImageSmoothingEnabled !== void 0) {
          return this.webkitImageSmoothingEnabled;
        } else if(this.msImageSmoothingEnabled !== void 0) {
          return this.msImageSmoothingEnabled;
        } else {
          return true;
        }
      },
      set: function(enable) {
        if(this.mozImageSmoothingEnabled !== void 0) {
          this.mozImageSmoothingEnabled = enable;
        } else if(this.webkitImageSmoothingEnabled !== void 0) {
          this.webkitImageSmoothingEnabled = enable;
        } else if(this.msImageSmoothingEnabled !== void 0) {
          this.msImageSmoothingEnabled = enable;
        }
      },
      enumerable: true,
      configurable: true
    });

    // document.body.innerHTML = '';
    // canvas = document.createElement('canvas');
    // document.body.appendChild(canvas);
    // canvas.width = 200;
    // canvas.height = 200;
    // ctx = canvas.getContext('2d');
    //
    // console.log(ctx.imageSmoothingEnabled);
  }

  if(!('ellipse' in canvasRenderingContext2DPrototype)) {
    canvasRenderingContext2DPrototype.ellipse = function(x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
      this.save();
      this.translate(x, y);
      this.rotate(rotation);
      this.scale(radiusX, radiusY);
      this.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
      this.restore();
    }
  }

  // if(!('addHitRegion' in canvasRenderingContext2DPrototype)) {
  //   var getContext = HTMLCanvasElementPrototype.getContext;
  //   HTMLCanvasElementPrototype.getContext = function(contextType, contextAttributes) {
  //     var context = getContext.call(this, contextType, contextAttributes);
  //     switch(contextType) {
  //       case '2d':
  //         Object.defineProperties(context, {
  //           '_hitRegions': { value: [], configurable: true, writable: true }
  //         });
  //         break;
  //     }
  //     return context;
  //   };
  //
  //   HTMLCanvasElementPrototype.addEventListener = function() {
  //
  //   };
  //
  //   canvasRenderingContext2DPrototype.addHitRegion = function(options) {
  //
  //   }
  // }

})();

(function() {
  /**
   * Polyfill Path2D
   */
  if(!('Path2D' in window) || !('addPath' in window.Path2D.prototype)) {

    var _Path2D = window.Path2D;

    // polyfill Path2D class
    var Path2D = function(path2D) {
      Object.defineProperty(this, '_operations', {
        value: [],
        configurable: true,
        writable: true
      });

      if(path2D instanceof Path2D) {
        if(path2D._original && _Path2D) {
          Object.defineProperty(this, '_original', {
            // value: new (_Path2D.bind.apply(_Path2D, [path2D._original].concat(Array.prototype.slice.call(arguments, 1)))),
            // value: new (Function.prototype.bind.apply(_Path2D, [path2D._original].concat(Array.prototype.slice.call(arguments, 1)))),
            value: new _Path2D(path2D._original),
            configurable: true,
            writable: true
          });
          this._operations = path2D._operations.slice(0);
        } else {
          this.addPath(path2D);
        }
      } else if(_Path2D) {
        Object.defineProperty(this, '_original', {
          value: new _Path2D(path2D),
          configurable: true,
          writable: true
        });
      }
    };

    window.Path2D = Path2D;
    var path2DPrototype = Path2D.prototype;

    ['arc', 'arcTo', 'bezierCurveTo', 'closePath', 'ellipse', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect']
      .forEach(function(attributeName) {
        path2DPrototype[attributeName] = function() {
          this._operations.push({ type: attributeName, arguments: Array.prototype.slice.call(arguments, 0) });
          if(this._original) _Path2D.prototype[attributeName].apply(this._original, arguments);
        };
      });

    // polyfill CanvasRenderingContext2D drawing Path2D
    var canvasRenderingContext2DPrototype = CanvasRenderingContext2D.prototype;
    ['fill', 'stroke', 'clip', 'isPointInPath', 'isPointInStroke']
      .forEach(function(attributeName) {
        var original = canvasRenderingContext2DPrototype[attributeName];
        canvasRenderingContext2DPrototype[attributeName] = function(path2D) {
          if(path2D instanceof Path2D) {
            if(path2D._original) {
              return original.apply(this, [path2D._original].concat(Array.prototype.slice.call(arguments, 1)));
            } else {
              this.beginPath();
              var operation;
              for(var i = 0, l = path2D._operations.length; i < l; i++) {
                operation = path2D._operations[i];
                canvasRenderingContext2DPrototype[operation.type].apply(this, operation.arguments);
              }
              return original.apply(this, Array.prototype.slice.call(arguments, 1));
            }
          } else {
            return original.apply(this, arguments);
          }
        };
      });


    // polyfill addPath
    if(!('addPath' in path2DPrototype)) {
      path2DPrototype.addPath = function(path2D, transform) {
        if(transform !== void 0) {
          if(path2D._original) delete path2D._original;
          this._operations.push({ type: 'save', arguments: [] });
          this._operations.push({
            type: 'transform',
            arguments: CanvasRenderingContext2D.svgMatrixToArray(transform)
          });
        }

        var operation;
        for(var i = 0, l = path2D._operations.length; i < l; i++) {
          operation = path2D._operations[i];
          path2DPrototype[operation.type].apply(this, operation.arguments);
        }

        if(transform !== void 0) {
          this._operations.push({ type: 'restore', arguments: [] });
        }
      };
    }

  }
})();

// (function() {
//   window.addEventListener('load', function() {
//     var canvas = document.getElementById('canvas');
//     var ctx = canvas.getContext('2d');
//
//     canvas.addEventListener('mousemove', function(event) {
//       if(event.region) {
//         console.log(event.region);
//       }
//     });
//
//     ctx.beginPath();
//     ctx.arc(100, 100, 75, 0, 2 * Math.PI, false);
//     ctx.lineWidth = 5;
//     ctx.stroke();
//
//     // eyes
//     ctx.beginPath();
//     ctx.arc(70, 80, 10, 0, 2 * Math.PI, false);
//     ctx.arc(130, 80, 10, 0, 2 * Math.PI, false);
//     ctx.fill();
//     ctx.addHitRegion({id: "eyes"});
//
//     // mouth
//     ctx.beginPath();
//     ctx.arc(100, 110, 50, 0, Math.PI, false);
//     ctx.stroke();
//   });
// })();
