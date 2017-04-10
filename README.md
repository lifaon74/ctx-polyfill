### Polyfill CanvasRenderingContext2D and Path2Dto match last ES7 specifications

Tested on  EDGE, CHROME, FIREFOX, OPERA and IE 10+.

**[INFOS]** The CanvasRenderingContext2D specs are not finished for some methods and may change in future.

#### Install
```
npm i ctx-polyfill --save
```

#### Currently supported
#####  CanvasRenderingContext2D
- [currentTransform](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/currentTransform) : (set and get) return the transform matrix as array [a, b, c, d, e, f].
- [resetTransform](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/resetTransform) : resets the current transform by the identity matrix.
- [imageSmoothingEnabled](https://developer.mozilla.org/fr/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled) : enable or disable image smoothing (only if natively supported).
- [ellipse](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/ellipse) : draw an ellipse.

#####  Path2D ==> [documentation](https://developer.mozilla.org/en-US/docs/Web/API/Path2D)
Stable: arc, arcTo, bezierCurveTo, closePath, ellipse, lineTo, moveTo, quadraticCurveTo, rect.

Experimental: [addPath](https://developer.mozilla.org/en-US/docs/Web/API/Path2D/addPath).
For size reasons, Path2D polyfill does'nt support SVG path (used as argument in constructor).

#### Helper
Because the specs are not finished, the `currentTransform` or even `Path2D.addPath`originally used [SVGMatrix](https://developer.mozilla.org/en-US/docs/Web/API/SVGMatrix) which have been deprecated. Instead, use an Array[6].

If you need SVGMatrix, some hacks have been implemented :
```ts
CanvasRenderingContext2D.useSvgMatrix: boolean;
```
By setting `CanvasRenderingContext2D.useSvgMatrix` to **true**, `currentTransform` will return SVGMatrix instead of array.

```ts
CanvasRenderingContext2D.arrayToSVGMatrix(array: number[]): SVGMatrix;
```
Convert the array transform matrix into a SVGMatrix.

```ts
CanvasRenderingContext2D.svgMatrixToArray(matrix: SVGMatrix): number[];
```
Convert a SVGMatrix into a transform matrix array.