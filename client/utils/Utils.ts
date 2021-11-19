import {IVector2, IVector3, RGBA, Vector3} from "alt-client";
import natives from 'natives';

namespace Utils {
    export const AsyncFunction = Object.getPrototypeOf(async function () { /**/
    }).constructor;
    export const Rad2Deg = 180 / Math.PI;

    export const asyncTimeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    export function clamp(num: number, min: number, max: number): number {
        return Math.min(Math.max(num, min), max);
    }

    export function rotationToForward(rot: Vector3): Vector3 {
        const adjustedRotation = rot.mul(Math.PI / 180);
        return new Vector3(
            -Math.sin(adjustedRotation.z) * Math.abs(Math.cos(adjustedRotation.x)),
            Math.cos(adjustedRotation.z) * Math.abs(Math.cos(adjustedRotation.x)),
            Math.sin(adjustedRotation.x),
        );
    }


    export function render2DText(
        text: string,
        pos: IVector2,
        textScale: number,
        color: RGBA = new RGBA(255, 255, 255, 255),
        font = 0,
        outline = true,
    ): void {
        natives.beginTextCommandDisplayText('STRING');
        natives.addTextComponentSubstringPlayerName(text);
        natives.setTextFont(font);
        natives.setTextScale(0, textScale);
        natives.setTextWrap(0, 1);
        natives.setTextCentre(true);
        natives.setTextColour(color.r, color.g, color.b, color.a);
        if (outline) natives.setTextOutline();
        natives.setTextProportional(true);
        natives.endTextCommandDisplayText(pos.x, pos.y, 0);
    }

    // region Boxes
    /*
   Drawn boxes vertexes alignment:
       v3------v4
      /|      /|
     / |     / |
    v1-|----v2 |
    |  v8---|-v7
    | /     | /
    v5------v6

    v1 = --+
    v2 = -++
    v3 = +-+
    v4 = +++
    v5 = ---
    v6 = -+-
    v7 = ++-
    v8 = +--

   */

    /**
     Draws box using polygons from set of vertexes.
     See source for vertex order.
     */
    export function drawBoxWithPolygons(
        v1: IVector3,
        v2: IVector3,
        v3: IVector3,
        v4: IVector3,
        v5: IVector3,
        v6: IVector3,
        v7: IVector3,
        v8: IVector3,
        red: number,
        green: number,
        blue: number,
        alpha: number,
    ): void {
        natives.drawPoly(v6.x, v6.y, v6.z, v5.x, v5.y, v5.z, v1.x, v1.y, v1.z, red, green, blue, alpha);
        natives.drawPoly(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v6.x, v6.y, v6.z, red, green, blue, alpha);
        natives.drawPoly(v7.x, v7.y, v7.z, v3.x, v3.y, v3.z, v8.x, v8.y, v8.z, red, green, blue, alpha);
        natives.drawPoly(v4.x, v4.y, v4.z, v3.x, v3.y, v3.z, v7.x, v7.y, v7.z, red, green, blue, alpha);
        natives.drawPoly(v6.x, v6.y, v6.z, v2.x, v2.y, v2.z, v4.x, v4.y, v4.z, red, green, blue, alpha);
        natives.drawPoly(v4.x, v4.y, v4.z, v7.x, v7.y, v7.z, v6.x, v6.y, v6.z, red, green, blue, alpha);
        natives.drawPoly(v6.x, v6.y, v6.z, v8.x, v8.y, v8.z, v5.x, v5.y, v5.z, red, green, blue, alpha);
        natives.drawPoly(v7.x, v7.y, v7.z, v8.x, v8.y, v8.z, v6.x, v6.y, v6.z, red, green, blue, alpha);
        natives.drawPoly(v5.x, v5.y, v5.z, v3.x, v3.y, v3.z, v1.x, v1.y, v1.z, red, green, blue, alpha);
        natives.drawPoly(v8.x, v8.y, v8.z, v3.x, v3.y, v3.z, v5.x, v5.y, v5.z, red, green, blue, alpha);
        natives.drawPoly(v1.x, v1.y, v1.z, v3.x, v3.y, v3.z, v2.x, v2.y, v2.z, red, green, blue, alpha);
        natives.drawPoly(v2.x, v2.y, v2.z, v3.x, v3.y, v3.z, v4.x, v4.y, v4.z, red, green, blue, alpha);
    }

    /**
     Draws box using lines from set of vertexes.
     See source for vertex order.
     */
    export function drawBoxWithLines(
        v1: IVector3,
        v2: IVector3,
        v3: IVector3,
        v4: IVector3,
        v5: IVector3,
        v6: IVector3,
        v7: IVector3,
        v8: IVector3,
        red: number,
        green: number,
        blue: number,
        alpha: number,
    ): void {
        natives.drawLine(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, red, green, blue, alpha);
        natives.drawLine(v1.x, v1.y, v1.z, v3.x, v3.y, v3.z, red, green, blue, alpha);
        natives.drawLine(v3.x, v3.y, v3.z, v4.x, v4.y, v4.z, red, green, blue, alpha);
        natives.drawLine(v4.x, v4.y, v4.z, v2.x, v2.y, v2.z, red, green, blue, alpha);
        natives.drawLine(v5.x, v5.y, v5.z, v8.x, v8.y, v8.z, red, green, blue, alpha);
        natives.drawLine(v8.x, v8.y, v8.z, v7.x, v7.y, v7.z, red, green, blue, alpha);
        natives.drawLine(v7.x, v7.y, v7.z, v6.x, v6.y, v6.z, red, green, blue, alpha);
        natives.drawLine(v5.x, v5.y, v5.z, v6.x, v6.y, v6.z, red, green, blue, alpha);
        natives.drawLine(v5.x, v5.y, v5.z, v1.x, v1.y, v1.z, red, green, blue, alpha);
        natives.drawLine(v6.x, v6.y, v6.z, v2.x, v2.y, v2.z, red, green, blue, alpha);
        natives.drawLine(v7.x, v7.y, v7.z, v4.x, v4.y, v4.z, red, green, blue, alpha);
        natives.drawLine(v8.x, v8.y, v8.z, v3.x, v3.y, v3.z, red, green, blue, alpha);
    }

    // endregion
}

export default Utils;