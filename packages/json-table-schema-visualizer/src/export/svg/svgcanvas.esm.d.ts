// Hand-written types for the vendored `svgcanvas.esm.js`.
//
// The vendored file builds `Context` with prototype assignments, which TypeScript
// cannot infer a useful shape from — checking it produced hundreds of errors while
// still leaving `Context` untyped at the call site. Declaring the surface we
// actually use is both quieter and more accurate.
//
// TypeScript resolves `import ... from "./svgcanvas.esm.js"` to this file, so the
// vendored JS never enters the program and no `allowJs` is required.

export interface ContextOptions {
  width?: number;
  height?: number;
  /** Enables canvas mirroring (get image data). Defaults to false. */
  enableMirroring?: boolean;
  document?: Document;
  /** An existing 2D context to wrap rather than creating a fresh canvas. */
  ctx?: CanvasRenderingContext2D;
}

// `Context` is a drop-in shim for the 2D canvas API that records draw calls as
// SVG, so it carries the whole `CanvasRenderingContext2D` surface. Merging the
// interface into the class declaration expresses that without restating all ~70
// members here.
export interface Context extends CanvasRenderingContext2D {}

export declare class Context {
  constructor(options?: ContextOptions);
  constructor(width: number, height: number);

  readonly width: number;
  readonly height: number;

  /** Serialises everything drawn so far into an SVG document string. */
  getSerializedSvg(fixNamedEntities?: boolean): string;
}

export declare class Element {
  constructor(options?: ContextOptions);
  getContext(type: string): Context | null;
}
