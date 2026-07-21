export class MetaInfo {
  name: string;
  x: number;
  y: number;
  hidden?: boolean;

  constructor(name: string, x: number, y: number, hidden?: boolean) {
    this.name = name;
    this.x = x;
    this.y = y;
    if (hidden === true) this.hidden = true;
  }
}

export interface MetaInfoEntry {
  name: string;
  x: number;
  y: number;
  hidden?: boolean;
}
