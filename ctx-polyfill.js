(function() {
  /**
   * Polyfill CanvasRenderingContext2D
   */


  /**
   * Polyfill currentTranform
   */

  // inspired form https://github.com/mozilla/pdf.js/blob/master/src/display/canvas.js

  var CanvasRenderingContext2DHelper = {};

  CanvasRenderingContext2DHelper.createSVGMatrix = function() {
    return document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGMatrix();
  };

  CanvasRenderingContext2DHelper.arrayToSVGMatrix = function(array) {
    var matrix = CanvasRenderingContext2DHelper.createSVGMatrix();
    matrix.a = array[0];
    matrix.b = array[1];
    matrix.c = array[2];
    matrix.d = array[3];
    matrix.e = array[4];
    matrix.f = array[5];
    return matrix;
  };

  CanvasRenderingContext2DHelper.svgMatrixToArray = function(matrix) {
    return [
      matrix.a,
      matrix.b,
      matrix.c,
      matrix.d,
      matrix.e,
      matrix.f
    ];
  };
  
  CanvasRenderingContext2DHelper.createIdentityMatrix = function() {
    return [ 1, 0, 0, 1, 0, 0 ];
  };

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


      CanvasRenderingContext2DHelper.getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
        var context = CanvasRenderingContext2DHelper.getContext.call(this, contextType, contextAttributes);
        switch(contextType) {
          case '2d':
            context._transformStack = [];
            context._transformMatrix = CanvasRenderingContext2DHelper.createIdentityMatrix();
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


      CanvasRenderingContext2DHelper.translate = CanvasRenderingContext2D.prototype.translate;
      CanvasRenderingContext2D.prototype.translate = function(x, y) {
        var matrix = this._transformMatrix;
        matrix[4] = matrix[0] * x + matrix[2] * y + matrix[4];
        matrix[5] = matrix[1] * x + matrix[3] * y + matrix[5];
        CanvasRenderingContext2DHelper.translate.call(this, x, y);
      };

      CanvasRenderingContext2DHelper.scale = CanvasRenderingContext2D.prototype.scale;
      CanvasRenderingContext2D.prototype.scale = function(x, y) {
        var matrix = this._transformMatrix;
        matrix[0] *= x;
        matrix[1] *= x;
        matrix[2] *= y;
        matrix[3] *= y;
        CanvasRenderingContext2DHelper.scale.call(this, x, y);
      };

      CanvasRenderingContext2DHelper.rotate = CanvasRenderingContext2D.prototype.rotate;
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

        CanvasRenderingContext2DHelper.rotate.call(this, angle);
      };

      CanvasRenderingContext2DHelper.transform = CanvasRenderingContext2D.prototype.transform;
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
        CanvasRenderingContext2DHelper.transform.call(this, a, b, c, d, e, f);
      };

      CanvasRenderingContext2DHelper.setTransform = CanvasRenderingContext2D.prototype.setTransform ;
      CanvasRenderingContext2D.prototype.setTransform  = function(a, b, c, d, e, f) {
        this._transformMatrix = [a, b, c, d, e, f];
        CanvasRenderingContext2DHelper.transform.setTransform(this, a, b, c, d, e, f);
      };

      CanvasRenderingContext2DHelper.save = CanvasRenderingContext2D.prototype.save;
      CanvasRenderingContext2D.prototype.save = function() {
        this._transformStack.push(this._transformMatrix);
        this._transformMatrix =  this._transformMatrix.slice(0, 6); // copy
        CanvasRenderingContext2DHelper.save.call(this);
      };

      CanvasRenderingContext2DHelper.restore = CanvasRenderingContext2D.prototype.restore;
      CanvasRenderingContext2D.prototype.restore = function() {
        var matrix = this._transformStack.pop();
        if(matrix) {
          this._transformMatrix = matrix;
        }
        CanvasRenderingContext2DHelper.restore.call(this);
      };
      
    }

      // document.body.innerHTML = '';
    // canvas = document.createElement('canvas');
    // document.body.appendChild(canvas);
    // canvas.width = 200;
    // canvas.height = 200;
    // ctx = canvas.getContext('2d');
    //
    // // ctx.fillRect(0, 0, 100, 100);
    //
    // ctx.save();
    // ctx.translate(10, 10);
    // console.log(ctx.currentTransform); // [ 1, 0, 0, 1, 10, 10 ]
    //
    // ctx.scale(2, 2);
    // console.log(ctx.currentTransform); // [ 2, 0, 0, 2, 10, 10 ]
    //
    // ctx.rotate(90 * Math.PI / 180);
    // ctx.translate(5, 5);
    // console.log(ctx.currentTransform); // [ -8.742277657347586e-8, 2, -2, -8.742277657347586e-8, 0, 20 ]
    //
    // ctx.transform(1, 2, 3, 4, 5, 6);
    // console.log(ctx.currentTransform); // [ -4, 1.9999998807907104, -8, 5.999999523162842, -12, 30 ]
    //
    // ctx.restore();
    // console.log(ctx.currentTransform); // [ 1, 0, 0, 1, 0, 0 ]
  }

  if(!('resetTransform' in CanvasRenderingContext2D.prototype)) {
    CanvasRenderingContext2D.prototype.resetTransform  = function() {
      this.setTransform(1, 0, 0, 1, 0, 0);
    };
  }

  CanvasRenderingContext2D.arrayToSVGMatrix = CanvasRenderingContext2DHelper.arrayToSVGMatrix;
})();