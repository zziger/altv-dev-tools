import alt, {Vector3} from "alt-client";
import native from "natives";
import Utils from "./Utils";

function w2s(position: Vector3): Vector3 | undefined {
    let result = native.getScreenCoordFromWorldCoord(
        position.x,
        position.y,
        position.z,
        undefined,
        undefined
    );

    if (!result[0]) return undefined;

    return new Vector3((result[1] - 0.5) * 2, (result[2] - 0.5) * 2, 0);
}

function processCoordinates(x: number, y: number) {
    const res = native.getActiveScreenResolution(0, 0);
    let screenX = res[1];
    let screenY = res[2];

    let relativeX = 1 - (x / screenX) * 2;
    let relativeY = 1 - (y / screenY) * 2;

    if (relativeX > 0.0) {
        relativeX = -relativeX;
    } else {
        relativeX = Math.abs(relativeX);
    }

    if (relativeY > 0.0) {
        relativeY = -relativeY;
    } else {
        relativeY = Math.abs(relativeY);
    }

    return {x: relativeX, y: relativeY};
}

function s2w(camPos: Vector3, relX: number, relY: number) {
    let camRot = native.getGameplayCamRot(0);
    let camForward = Utils.rotationToForward(camRot);
    let rotUp = camRot.add({x: 10, y: 0, z: 0});
    let rotDown = camRot.add({x: -10, y: 0, z: 0});
    let rotLeft = camRot.add({x: 0, y: 0, z: -10});
    let rotRight = camRot.add({x: 0, y: 0, z: 10});

    let camRight = Utils.rotationToForward(rotRight).sub(Utils.rotationToForward(rotLeft));
    let camUp = Utils.rotationToForward(rotUp).sub(Utils.rotationToForward(rotDown));

    let rollRad = -degToRad(camRot.y);

    let camRightRoll = camRight.mul(Math.cos(rollRad)).sub(camUp.mul(Math.sin(rollRad)));
    let camUpRoll = camRight.mul(Math.sin(rollRad)).add(camUp.mul(Math.cos(rollRad)))

    let point3D = camPos.add(camForward.mul(10.0)).add(camRightRoll).add(camUpRoll);

    let point2D = w2s(point3D);

    if (point2D === undefined) {
        return camPos.add(camForward.mul(10.0));
    }

    let point3DZero = camPos.add(camForward.mul(10.0));
    let point2DZero = w2s(point3DZero);

    if (point2DZero === undefined) {
        return camPos.add(camForward.mul(10.0));
    }

    let eps = 0.001;

    if (
        Math.abs(point2D.x - point2DZero.x) < eps ||
        Math.abs(point2D.y - point2DZero.y) < eps
    ) {
        return camPos.add(camForward.mul(10.0));
    }

    let scaleX = (relX - point2DZero.x) / (point2D.x - point2DZero.x);
    let scaleY = (relY - point2DZero.y) / (point2D.y - point2DZero.y);
    return camPos.add(camForward.mul(10.0)).add(camRightRoll.mul(scaleX)).add(camUpRoll.mul(scaleY));
}

function degToRad(deg: number) {
    return (deg * Math.PI) / 180.0;
}

export function screenToWorld() {
    let x = alt.getCursorPos().x;
    let y = alt.getCursorPos().y;

    let absoluteX = x;
    let absoluteY = y;

    let camPos = native.getGameplayCamCoord();
    let processedCoords = processCoordinates(absoluteX, absoluteY);
    let target = s2w(camPos, processedCoords.x, processedCoords.y);

    let dir = target.sub(camPos);
    return camPos.add(dir.mul(300));
}