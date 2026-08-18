// Hand-written types for the vendored `svgcanvas.esm.js`.
//
// The vendored file builds `Context` with prototype assignments, which TypeScript
// cannot infer a useful shape from — checking it produced hundreds of errors while
// still leaving `Context` untyped at the call site.
//
// TypeScript resolves `import ... from "./svgcanvas.esm.js"` to this file, so the
// vendored JS never enters the program and no `allowJs` is required. That makes
// this file a promise nobody verifies: anything declared here is believed.
//
// So it declares the surface this codebase uses, and each declaration was
// checked against the vendored source. It is deliberately not a full description
// of the module — the `Element` export and the `document` option are real and
// omitted, because declaring things no caller wants is how a wrong declaration
// gets in unnoticed.

export interface ContextOptions {
  width?: number;
  height?: number;
  /** Enables canvas mirroring (get image data). Defaults to false. */
  enableMirroring?: boolean;
  /** An existing 2D context to wrap rather than creating a fresh canvas. */
  ctx?: CanvasRenderingContext2D;
}

// A partial stand-in for the 2D canvas API that records draw calls as SVG.
// Deliberately NOT declared as `extends CanvasRenderingContext2D`: the vendored
// file implements none of `roundRect`, `createConicGradient`,
// `getContextAttributes`, `isContextLost`, `letterSpacing` or `filter`, and
// claiming otherwise would let a caller reach for one and fail at runtime with
// the type checker's blessing. Konva only ever calls the older surface.
export declare class Context {
  constructor(options?: ContextOptions);
  constructor(width: number, height: number);

  readonly width: number;
  readonly height: number;

  /** Serialises everything drawn so far into an SVG document string. */
  getSerializedSvg(fixNamedEntities?: boolean): string;
}
