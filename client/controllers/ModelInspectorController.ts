import alt, {IVector3, Vector3} from "alt-client";
import natives from "natives";
import Utils from "../utils/Utils";
import MouseController from "./MouseController";
import {screenToWorld} from "../utils/ScreenToWorld";

type Vertexes = [IVector3, IVector3, IVector3, IVector3, IVector3, IVector3, IVector3, IVector3];

interface ObjectInfo {
    id: number;
    model: number;
    vertexes: Vertexes | undefined;
    coord: IVector3;
    rot: IVector3;
    coordHit: IVector3;
    textureVariation: number;
}

export default class ModelInspectorController {
    static readonly instance = new ModelInspectorController();

    private constructor() {
        alt.everyTick(this.onEveryTick);
        alt.setInterval(this.cast, 50);
        alt.on('keydown', this.onKeydown);
    }

    private _state: boolean = false;
    private _currentObject?: ObjectInfo;

    onKeydown = (key: number) => {
        if (key === 114) {
            this._state = !this._state;
        } else if (this._state && key === 69) {
            const str = this.getString();
            if (str) alt.log(str);
        }
    }

    getString() {
        if (!this._currentObject) return null;
        const obj = this._currentObject;
        const entity = alt.Entity.getByScriptID(+obj.id);
        let str = `ScriptID: ${obj.id}~n~` +
            `Model: ${obj.model}~n~` +
            `Texture: ${obj.textureVariation}~n~` +
            `Coord: ${obj.coord.x.toFixed(3)} ${obj.coord.y.toFixed(3)} ${obj.coord.z.toFixed(3)}~n~` +
            `Rot: ${obj.rot.x.toFixed(3)} ${obj.rot.y.toFixed(3)} ${obj.rot.z.toFixed(3)}~n~`;
        if (entity) str += `Entity: ${entity.constructor.name}~n~Entity ID: ${entity.id}~n~`;

        return str;
    }

    onEveryTick = () => {
        if (!this._state) return;

        const resolution = natives.getActiveScreenResolution(0, 0);
        const height = 3 / resolution[2];
        const width = (height * resolution[2]) / resolution[1];
        natives.drawRect(0.5, 0.5, width, height, 255, 255, 255, 255, true);

        if (!this._currentObject) {
            natives.beginTextCommandDisplayHelp("STRING");
            natives.addTextComponentSubstringPlayerName(`Use the crosshair or mouse pointer (F2) to select the target object`);
            natives.endTextCommandDisplayHelp(0, false, false, 0);
            return;
        }

        const obj = this._currentObject;
        if (obj.vertexes) {
            Utils.drawBoxWithLines(...obj.vertexes, 255, 255, 255, 255);
            Utils.drawBoxWithPolygons(...obj.vertexes, 255, 0, 0, 128);
        }
        natives.beginTextCommandDisplayHelp("STRING");
        natives.addTextComponentSubstringTextLabel('modelHelp')
        alt.addGxtText('modelHelp', this.getString()!);
        natives.endTextCommandDisplayHelp(0, false, false, 0);
    };

    cast = () => {
        const start = natives.getGameplayCamCoord();
        const end = MouseController.instance.state ?
            screenToWorld() :
            start.add(Utils.rotationToForward(natives.getGameplayCamRot(2)).mul(300));

        const raycast = natives.startExpensiveSynchronousShapeTestLosProbe(start.x, start.y, start.z, end.x, end.y, end.z, -1, alt.Player.local.scriptID, 4);
        const [, hit, endCoords, , entityHit] = natives.getShapeTestResult(raycast);

        if (!hit) return this._currentObject = undefined;
        const hasDrawable = natives.doesEntityHaveDrawable(entityHit);
        const model = hasDrawable ? natives.getEntityModel(entityHit) : -1;

        let vertexes: Vertexes | undefined = undefined;
        if (hasDrawable) {
            const [, minVR, maxVR] = natives.getModelDimensions(model);
            // prevents clipping
            const [minV, maxV] = [new Vector3(-0.001, -0.001, -0.001).add(minVR), new Vector3(0.001, 0.001, 0.001).add(maxVR)];
            vertexes = [
                natives.getOffsetFromEntityInWorldCoords(entityHit, minV.x, minV.y, maxV.z),
                natives.getOffsetFromEntityInWorldCoords(entityHit, minV.x, maxV.y, maxV.z),
                natives.getOffsetFromEntityInWorldCoords(entityHit, maxV.x, minV.y, maxV.z),
                natives.getOffsetFromEntityInWorldCoords(entityHit, maxV.x, maxV.y, maxV.z),
                natives.getOffsetFromEntityInWorldCoords(entityHit, minV.x, minV.y, minV.z),
                natives.getOffsetFromEntityInWorldCoords(entityHit, minV.x, maxV.y, minV.z),
                natives.getOffsetFromEntityInWorldCoords(entityHit, maxV.x, maxV.y, minV.z),
                natives.getOffsetFromEntityInWorldCoords(entityHit, maxV.x, minV.y, minV.z),
            ];
        }

        this._currentObject = {
            id: entityHit,
            model,
            coord: natives.getEntityCoords(entityHit, !natives.isEntityDead(entityHit, false)),
            rot: natives.getEntityRotation(entityHit, 2),
            coordHit: endCoords,
            textureVariation: natives.getObjectTintIndex(entityHit),
            vertexes
        }
    };
}
