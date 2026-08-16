import { round2 } from './utility';

export const formatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 });

export class Triple {
  public constructor(
    public x: number,
    public y: number,
    public z: number = 0
  ) {
    this.type = this.constructor.name;
  }
  public static fromArray(triple: number[]) {
    return new Triple(triple[0], triple[1], triple[2] || 0);
  }
  public toArray(): number[] {
    return [this.x, this.y, this.z];
  }

  public toString(): string {
    return `
      |
      ${formatter.format(round2(this.x)).padStart(6, '0')},
      ${formatter.format(round2(this.y)).padStart(6, '0')}
      ${formatter.format(round2(this.y)).padStart(6, '0')} 
      |`;
  }

  private type: string;

  public add(other: Triple): Triple {
    return new Triple(this.x + other.x, this.y + other.y, this.z + other.z);
  }
  public subtract(other: Triple): Triple {
    return new Triple(this.x - other.x, this.y - other.y, this.z - other.z);
  }
  public scale(scalar: number): Triple {
    return new Triple(this.x * scalar, this.y * scalar, this.z * scalar);
  }
}
