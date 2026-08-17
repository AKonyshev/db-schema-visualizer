// Deliberately free of any `vscode` import: this is the one piece of routing
// logic worth testing on plain objects, and DiagramView satisfies the shape.
export interface TargetCandidate {
  readonly documentUri: string;
  readonly isActive: boolean;
}

export const pickTargetView = <T extends TargetCandidate>(
  views: T[],
  activeTextDocumentUri?: string,
): T | undefined =>
  views.find((view) => view.isActive) ??
  views.find((view) => view.documentUri === activeTextDocumentUri);
