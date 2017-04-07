(function() {
  /**
   * Helper to be compatible with future standard (because current standards are not yet properly defined)
   */

  if(CanvasRenderingContext2D.useSvgMatrix === void 0) {
    CanvasRenderingContext2D.useSvgMatrix = false;
  }

  CanvasRenderingContext2D.arrayToSVGMatrix = function(array) {
    var matrix = document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGMatrix();
    matrix.a = array[0];
    matrix.b = array[1];
    matrix.c = array[2];
    matrix.d = array[3];
    matrix.e = array[4];
    matrix.f = array[5];
    return matrix;
  };

  CanvasRenderingContext2D.svgMatrixToArray = function(matrix) {
    if(!(matrix instanceof SVGMatrix)) throw new Error('Matrix is not a SVGMatrix');
    return [
      matrix.a,
      matrix.b,
      matrix.c,
      matrix.d,
      matrix.e,
      matrix.f
    ];
  };

})();

(function() {
  /**
   * Polyfill CanvasRenderingContext2D
   */

  // inspired form https://github.com/mozilla/pdf.js/blob/master/src/display/canvas.js

  var canvasRenderingContext2DPrototype = CanvasRenderingContext2D.prototype;

  if(!('resetTransform' in canvasRenderingContext2DPrototype)) {
    canvasRenderingContext2DPrototype.resetTransform = function() {
      this.setTransform(1, 0, 0, 1, 0, 0);
    };
  }

  if(!('currentTransform' in canvasRenderingContext2DPrototype)) {
    if('mozCurrentTransform' in canvasRenderingContext2DPrototype) {
      Object.defineProperty(canvasRenderingContext2DPrototype, 'currentTransform', {
        get: function() {
          return CanvasRenderingContext2D.useSvgMatrix ?
            CanvasRenderingContext2D.arrayToSVGMatrix(this.mozCurrentTransform) : this.mozCurrentTransform;
        },
        set: function(matrix) {
          this.mozCurrentTransform = CanvasRenderingContext2D.useSvgMatrix ?
            CanvasRenderingContext2D.svgMatrixToArray(matrix) : matrix;
        },
        enumerable: true,
        configurable: true
      });
    } else {

      var getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
        var context = getContext.call(this, contextType, contextAttributes);
        switch(contextType) {
          case '2d':
            context._transformStack = [];
            context._transformMatrix = [ 1, 0, 0, 1, 0, 0 ];
            break;
        }
        return context;
      };


      Object.defineProperty(canvasRenderingContext2DPrototype, 'currentTransform', {
        get: function () {
          return CanvasRenderingContext2D.useSvgMatrix ?
            CanvasRenderingContext2D.arrayToSVGMatrix(this._transformMatrix) : this._transformMatrix;
        },
        set: function(matrix) {
          this._transformMatrix = CanvasRenderingContext2D.useSvgMatrix ?
            CanvasRenderingContext2D.svgMatrixToArray(matrix) : matrix;
          this.setTransform(
            this._transformMatrix[0],
            this._transformMatrix[1],
            this._transformMatrix[2],
            this._transformMatrix[3],
            this._transformMatrix[4],
            this._transformMatrix[5]
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
        var matrix =  this._transformMatrix;
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
      canvasRenderingContext2DPrototype.setTransform  = function(a, b, c, d, e, f) {
        this._transformMatrix = [a, b, c, d, e, f];
        setTransform.call(this, a, b, c, d, e, f);
      };

      var resetTransform = canvasRenderingContext2DPrototype.resetTransform;
      canvasRenderingContext2DPrototype.resetTransform  = function() {
        this._transformMatrix = [1, 0, 0, 1, 0, 0];
        resetTransform.call(this);
      };

      var save = canvasRenderingContext2DPrototype.save;
      canvasRenderingContext2DPrototype.save = function() {
        this._transformStack.push(this._transformMatrix);
        this._transformMatrix =  this._transformMatrix.slice(0, 6); // copy
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

  if(!('imageSmoothingEnabled' in canvasRenderingContext2DPrototype)) {
    Object.defineProperty(canvasRenderingContext2DPrototype, 'imageSmoothingEnabled', {
      get: function () {
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

})();

(function() {
  /**
   * Polyfill Path2D
   */

  if(!('Path2D' in window) || !('addPath' in window.Path2D.prototype)) {
    var supportNativePath2D = ('Path2D' in window);

    // polyfill Path2D class
    if(!supportNativePath2D) {
      Path2D = function(path2D) {
        if(path2D instanceof Path2D) {
          this.addPath(path2D);
        }
      };
      window.Path2D = Path2D;
    }

    var path2DPrototype = window.Path2D.prototype;

    // save all operations for the path
    Object.defineProperty(path2DPrototype, '_operations', { value: [] });

    ['arc', 'arcTo', 'bezierCurveTo', 'closePath', 'ellipse', 'lineTo', 'moveTo', 'quadraticCurveTo', 'rect']
      .forEach(function(attributeName) {
        var original = path2DPrototype[attributeName];
        path2DPrototype[attributeName] = function() {
          this._operations.push({ type: attributeName, arguments: Array.prototype.slice.call(arguments, 0) });
          if(supportNativePath2D) original.apply(this, arguments);
        };
      });

    // polyfill CanvasRenderingContext2D drawing Path2D
    if(!supportNativePath2D) {
      var canvasRenderingContext2DPrototype = CanvasRenderingContext2D.prototype;
      ['fill', 'stroke', 'clip', 'isPointInPath', 'isPointInStroke']
        .forEach(function(attributeName) {
          var original = canvasRenderingContext2DPrototype[attributeName];
          canvasRenderingContext2DPrototype[attributeName] = function(path2D) {
            if(path2D instanceof Path2D) {
              this.beginPath();
              var operation;
              for(var i = 0, l = path2D._operations.length; i < l; i++) {
                operation = path2D._operations[i];
                canvasRenderingContext2DPrototype[operation.type].apply(this, operation.arguments);
              }
              original.apply(this, Array.prototype.slice.call(arguments, 1));
            } else {
              original.apply(this, arguments);
            }
          };
        });
    }

    // polyfill addPath
    if(!('addPath' in path2DPrototype)) {
      path2DPrototype.addPath = function(path2D, transform) {
        if(transform !== void 0) {
          if(supportNativePath2D) throw new Error('Transform is not supported yet on native Path2D addPath.');

          this._operations.push({ type: 'save', arguments: [] });
          this._operations.push({
            type: 'transform',
            arguments: CanvasRenderingContext2D.useSvgMatrix ?
              CanvasRenderingContext2D.svgMatrixToArray(transform) : transform
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