const Tester = require('./Tester.class');

const assert = require('assert'),
  test = require('selenium-webdriver/testing'),
  webdriver = require('selenium-webdriver'),
  By = webdriver.By,
  until = webdriver.until,
  Button = webdriver.Button
;

const config = require('./config.json');
const tester = new Tester(config.testServer);


test.describe('CTX polyfill', function() {
  this.timeout(30000);

  tester.testWith([
    Tester.EDGE,
    Tester.CHROME,
    // Tester.FIREFOX,
    // Tester.OPERA,
    Tester.IE
  ], (driver, done) => {
    driver.manage().timeouts().setScriptTimeout(15000);

    test.before(() => {
      driver.manage().timeouts().pageLoadTimeout(1000);
       driver.navigate().to(config.testHost);
      return tester.sleep(2000);
    });

    const testCurrentTransForm = `
      var testCurrentTransForm = function(ctx, expectedValue) {
        if(!('currentTransform' in ctx)) throw new Error('currentTransform not present in ctx');
        
        var currentTransform = ctx.currentTransform;
        if(!expectedValue.every(function(value, index) {
            return Math.abs(currentTransform[index] - value) < 1e-6;
          })) {
          throw new Error('currentTransform value incorrect : ' + JSON.stringify(currentTransform) + ', expected : ' + JSON.stringify(expectedValue));
        }
      };
    `;

    const getPixel = `
      var getPixel = function(ctx, x, y) {
        return ctx.getImageData(x, y, 1, 1).data;
      };
    `;

    const prepareCanvas = `
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext('2d');
        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    `;


    test.it('Test currentTransform', () => {
      driver.wait(until.elementLocated(By.css('#canvas')));

      return tester.executeScript(driver, `
        ${prepareCanvas}
        ${testCurrentTransForm}

        ctx.translate(250, 250);
        ctx.rotate(Math.PI / 4);
        ctx.scale(2, 2);
        ctx.strokeRect(-5, -5, 10, 10);

        ctx.save();
        ctx.scale(0.5, 0.5);
        ctx.restore();

        testCurrentTransForm(ctx, [1.4142135623730951, 1.414213562373095, -1.414213562373095, 1.4142135623730951, 250, 250]);
      `);
    });

    test.it('Test resetTransform', () => {
      driver.wait(until.elementLocated(By.css('#canvas')));

      return tester.executeScript(driver, `
        ${prepareCanvas}
        ${testCurrentTransForm}

        ctx.translate(250, 250);
        ctx.rotate(Math.PI / 4);
        ctx.scale(2, 2);

        if(!('resetTransform' in ctx)) throw new Error('resetTransform not present in ctx');
        ctx.resetTransform();

        testCurrentTransForm(ctx, [1, 0, 0, 1, 0, 0]);
      `);
    });

    test.it('Test all transforms', () => {
      driver.wait(until.elementLocated(By.css('#canvas')));

      return tester.executeScript(driver, `
        ${prepareCanvas}
        ${testCurrentTransForm}

        ctx.save();
        ctx.translate(10, 10);
        testCurrentTransForm(ctx, [ 1, 0, 0, 1, 10, 10 ]);

        ctx.scale(2, 2);
        testCurrentTransForm(ctx, [ 2, 0, 0, 2, 10, 10 ]);

        ctx.rotate(90 * Math.PI / 180);
        ctx.translate(5, 5);
        testCurrentTransForm(ctx, [ -8.742277657347586e-8, 2, -2, -8.742277657347586e-8, 0, 20 ]);

        ctx.transform(1, 2, 3, 4, 5, 6);
        testCurrentTransForm(ctx, [ -4, 1.9999998807907104, -8, 5.999999523162842, -12, 30 ]);

        ctx.restore();
        testCurrentTransForm(ctx, [ 1, 0, 0, 1, 0, 0 ]);
      `);
    });

    test.it('Test imageSmoothingEnabled', () => {
      driver.wait(until.elementLocated(By.css('#canvas')));

      return tester.executeScript(driver, `
        ${prepareCanvas}

        if(!('imageSmoothingEnabled' in ctx)) throw new Error('imageSmoothingEnabled not present in ctx');
        ctx.imageSmoothingEnabled = true;
      `);
    });

    test.it('Test ellipse', () => {
      driver.wait(until.elementLocated(By.css('#canvas')));

      return tester.executeScript(driver, `
        ${prepareCanvas}
        ${getPixel}

        if(!('ellipse' in ctx)) throw new Error('Ellipse not present in ctx');
        // ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.ellipse(100, 100, 50, 75, 45 * Math.PI/180, 0, 2 * Math.PI);
        ctx.stroke();
        if(getPixel(ctx, 122, 36)[3] === 0) throw new Error('Ellipse draw failed');
      `);
    });

    test.it('Test Path2D methods', () => {
      driver.wait(until.elementLocated(By.css('#canvas')));

      return tester.executeScript(driver, `
        ${prepareCanvas}
        ${getPixel}

        ctx.translate(0.5, 0.5);
        var path2D = new Path2D();
        path2D.rect(10, 10, 10, 10);
        path2D.moveTo(150, 20);
        path2D.arcTo(150, 100, 50, 20, 30);
        var path2DCopy = new Path2D(path2D);
        ctx.stroke(path2DCopy);
        
        if(getPixel(ctx, 10, 10)[3] === 0) throw new Error('Path2D draw failed');
      `);
    });

    test.it('Test Path2D addPath', () => {
      driver.wait(until.elementLocated(By.css('#canvas')));

      return tester.executeScript(driver, `
        ${prepareCanvas}
        ${getPixel}

        ctx.translate(0.5, 0.5);
        var path2D = new Path2D();
        path2D.rect(10, 10, 10, 10);
        var path2DCopy = new Path2D();
        path2DCopy.addPath(path2D);
        ctx.stroke(path2DCopy);
        
        if(getPixel(ctx, 10, 10)[3] === 0) throw new Error('Path2D addPath draw failed');
      `);
    });

    test.after(() => {
      driver.quit();
      done();
    });
  });
});


