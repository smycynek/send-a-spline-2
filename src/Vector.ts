import { Triple } from './Triple';
import { round2 } from './utility';

const formatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 });

/*
This class is simple enough that we barely need it, and we could enhance it further,
but it's mostly just to conveniently accept, display, and extract point data.
*/
export class Vector extends Triple {
  public toString(): string {
    return `
    <
    ${formatter.format(round2(this.x)).padStart(6, '0')},
    ${formatter.format(round2(this.y)).padStart(6, '0')}
    ${formatter.format(round2(this.y)).padStart(6, '0')} 
    >`;
  }

  public static fromTriple(triple: Triple): Vector {
    return new Vector(triple.x, triple.y, triple.z);
  }

  public dot(other: Vector): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  public cross(other: Vector): Vector {
    return new Vector(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x
    );
  }

  public magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  public normalize(): Vector {
    if (!(this instanceof Vector)) {
      throw new Error('Object is not an instance of Vector');
    }
    const mag = this.magnitude();
    if (mag === 0) {
      throw new Error('Cannot normalize a zero vector');
    }
    return new Vector(this.x / mag, this.y / mag, this.z / mag);
  }
}
