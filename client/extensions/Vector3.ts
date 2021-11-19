import {IVector3, Vector3} from "alt-client";

declare module 'alt-shared' {
    export interface Vector3 {
        radiansToDirection(): Vector3;
        cross(vector: IVector3): Vector3;
    }
}

Vector3.prototype.radiansToDirection = function (): Vector3 {
    return new Vector3(
        -Math.sin(this.z) * Math.abs(Math.cos(this.x)),
        Math.cos(this.z) * Math.abs(Math.cos(this.x)),
        Math.sin(this.x),
    );
};

Vector3.prototype.cross = function (vector: IVector3 | number, y?: number, z?: number): Vector3 {
    if (typeof vector === 'number') vector = new Vector3(vector, y!, z!);
    return new Vector3(
        this.y * vector.z - this.z * vector.y,
        this.z * vector.x - this.x * vector.z,
        this.x * vector.y - this.y * vector.x,
    );
};

