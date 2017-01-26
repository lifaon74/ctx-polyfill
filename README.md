### Polyfill CanvasRenderingContext2D to match last ES7 specifications

Tested on IE 10+

#### Install
```
npm i ctx-polyfill --save
```

#### Currently supported

- [currentTransform](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/currentTransform) : (set and get) return the transform matrix as array [a, b, c, d, e, f]
- [resetTransform](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/resetTransform) : resets the current transform by the identity matrix.

#### Helper
```ts
CanvasRenderingContext2D.arrayToSVGMatrix(array: number[]): SVGMatrix
```
Convert the array transform matrix into an [SVGMatrix](https://developer.mozilla.org/en-US/docs/Web/API/SVGMatrix)

