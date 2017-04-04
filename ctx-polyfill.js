(function() {
  /**
   * Polyfill CanvasRenderingContext2D
   */


  /**
   * Polyfill currentTranform
   */

  // inspired form https://github.com/mozilla/pdf.js/blob/master/src/display/canvas.js

  var arrayToSVGMatrix = function(array) {
    var matrix = document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGMatrix();
    matrix.a = array[0];
    matrix.b = array[1];
    matrix.c = array[2];
    matrix.d = array[3];
    matrix.e = array[4];
    matrix.f = array[5];
    return matrix;
  };

  // var svgMatrixToArray = function(matrix) {
  //   return [
  //     matrix.a,
  //     matrix.b,
  //     matrix.c,
  //     matrix.d,
  //     matrix.e,
  //     matrix.f
  //   ];
  // };

  if(!('resetTransform' in CanvasRenderingContext2D.prototype)) {
    CanvasRenderingContext2D.prototype.resetTransform = function() {
      this.setTransform(1, 0, 0, 1, 0, 0);
    };
  }

  if(!('currentTransform' in CanvasRenderingContext2D.prototype)) {
    if('mozCurrentTransform' in CanvasRenderingContext2D.prototype) {
      Object.defineProperty(CanvasRenderingContext2D.prototype, 'currentTransform', {
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


      Object.defineProperty(CanvasRenderingContext2D.prototype, 'currentTransform', {
        get: function () {
          return this._transformMatrix;
        },
        set: function(matrix) {
          this._transformMatrix = matrix;
          this.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
        },
        enumerable: true,
        configurable: true
      });


      var translate = CanvasRenderingContext2D.prototype.translate;
      CanvasRenderingContext2D.prototype.translate = function(x, y) {
        var matrix = this._transformMatrix;
        matrix[4] = matrix[0] * x + matrix[2] * y + matrix[4];
        matrix[5] = matrix[1] * x + matrix[3] * y + matrix[5];
        translate.call(this, x, y);
      };

      var scale = CanvasRenderingContext2D.prototype.scale;
      CanvasRenderingContext2D.prototype.scale = function(x, y) {
        var matrix = this._transformMatrix;
        matrix[0] *= x;
        matrix[1] *= x;
        matrix[2] *= y;
        matrix[3] *= y;
        scale.call(this, x, y);
      };

      var rotate = CanvasRenderingContext2D.prototype.rotate;
      CanvasRenderingContext2D.prototype.rotate = function(angle) {
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

      var transform = CanvasRenderingContext2D.prototype.transform;
      CanvasRenderingContext2D.prototype.transform = function(a, b, c, d, e, f) {
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

      var setTransform = CanvasRenderingContext2D.prototype.setTransform;
      CanvasRenderingContext2D.prototype.setTransform  = function(a, b, c, d, e, f) {
        this._transformMatrix = [a, b, c, d, e, f];
        setTransform.call(this, a, b, c, d, e, f);
      };

      var resetTransform = CanvasRenderingContext2D.prototype.resetTransform;
      CanvasRenderingContext2D.prototype.resetTransform  = function() {
        this._transformMatrix = [1, 0, 0, 1, 0, 0];
        resetTransform.call(this);
      };

      var save = CanvasRenderingContext2D.prototype.save;
      CanvasRenderingContext2D.prototype.save = function() {
        this._transformStack.push(this._transformMatrix);
        this._transformMatrix =  this._transformMatrix.slice(0, 6); // copy
        save.call(this);
      };

      var restore = CanvasRenderingContext2D.prototype.restore;
      CanvasRenderingContext2D.prototype.restore = function() {
        var matrix = this._transformStack.pop();
        if(matrix) {
          this._transformMatrix = matrix;
        }
        restore.call(this);
      };
      
    }
  }


  if(!('imageSmoothingEnabled' in CanvasRenderingContext2D.prototype)) {
    Object.defineProperty(CanvasRenderingContext2D.prototype, 'imageSmoothingEnabled', {
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

  CanvasRenderingContext2D.arrayToSVGMatrix = arrayToSVGMatrix;


})();