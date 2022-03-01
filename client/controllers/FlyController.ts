import alt, {IVector3, Vector3} from "alt-client";
import natives from "natives";
import ControlsController from "./ControlsController";
import Utils from "../utils/Utils";

export default class FlyController {
    static readonly instance = new FlyController();
    static readonly blockedKeys = [
        30,
        31,
        21,
        36,
        22,
        44,
        38,
        71,
        72,
        59,
        60,
        42,
        43,
    ];

    private constructor() {
        alt.on('keydown', this.onKeydown);
        alt.on('gameEntityCreate', this.onGameEntityCreate);
        alt.on('streamSyncedMetaChange', this.onStreamSyncedMetaChange);
    }

    onGameEntityCreate = (entity: alt.Entity) => {
        if (!(entity instanceof alt.Player)) return;
        natives.freezeEntityPosition(entity.id, entity.getStreamSyncedMeta('fly'));
    }

    onStreamSyncedMetaChange = (entity: alt.Entity, key: string, value: any) => {
        if (!(entity instanceof alt.Player)) return;
        if (key !== 'fly') return;
        natives.freezeEntityPosition(entity.id, value);
    }

    onKeydown = (key: number) => {
        if (key !== 115) return;
        if (this._state) this.stop();
        else this.start(alt.isKeyDown(16));
    }

    private _state = false;
    private _everyTick?: number;
    private _speed = 1;
    private _cam?: number;

    start(freecam = false) {
        if (this._state) return;
        const player = alt.Player.local;
        if (!freecam && player.vehicle)
            natives.taskLeaveVehicle(player.scriptID, player.vehicle.scriptID, 16);
        this._state = true;
        if (freecam) {
            this._cam = natives.createCamWithParams('DEFAULT_SCRIPTED_CAMERA',
                player.pos.x, player.pos.y, player.pos.z + 1,
                player.rot.x * Utils.Rad2Deg, player.rot.y * Utils.Rad2Deg, player.rot.z * Utils.Rad2Deg,
                50, false, 2
            );
            natives.setCamActive(this._cam, true);
            natives.renderScriptCams(true, false, 0, true, false, 0);
        } else {
            alt.emitServer('qaTools:fly', true);
            natives.setEntityCompletelyDisableCollision(alt.Player.local.scriptID, false, false);
        }
        this._everyTick = alt.everyTick(freecam ? this.handleFreecam : this.handle);
    }

    stop() {
        if (!this._state) return;
        this._state = false;

        if (this._everyTick) {
            alt.clearEveryTick(this._everyTick)
            this._everyTick = undefined;
        }

        natives.setFocusEntity(alt.Player.local);

        if (this._cam) {
            natives.renderScriptCams(false, false, 0, true, false, 0);
            natives.setCamActive(this._cam, false);
            natives.destroyCam(this._cam, false);
            this._cam = undefined;
        } else {
            const coord = alt.Player.local.pos;
            natives.setEntityCompletelyDisableCollision(alt.Player.local.scriptID, true, true);
            alt.emitServer('qaTools:fly', false);

            if (!natives.isDisabledControlPressed(0, 22)) { // INPUT_JUMP
                natives.setEntityCoordsNoOffset(alt.Player.local.scriptID,
                    coord.x,
                    coord.y,
                    natives.getGroundZFor3dCoord(coord.x, coord.y, coord.z, 0, false, false)[1],
                    false,
                    false,
                    false,
                );
            }
        }
    }

    getNewPos(pos: IVector3) {
        natives.blockWeaponWheelThisFrame();

        for (let blockedKey of FlyController.blockedKeys) {
            natives.disableControlAction(0, blockedKey, true);
        }

        let vertSpeed = 0;
        let speed = this._speed;

        if (natives.isDisabledControlPressed(0, 241)) { // INPUT_CURSOR_SCROLL_UP
            this._speed = Utils.clamp(this._speed + 0.1, 0.1, 10);
        }

        if (natives.isDisabledControlPressed(0, 242)) { // INPUT_CURSOR_SCROLL_DOWN
            this._speed = Utils.clamp(this._speed - 0.1, 0.1, 10);
        }
        // pos movement
        const posMovementX = natives.getDisabledControlNormal(0, 218);
        const posMovementY = natives.getDisabledControlNormal(0, 219);

        // 38 - E
        if (natives.isDisabledControlPressed(0, 38)) {
            vertSpeed += this._speed;
        }

        // 44 - Q
        if (natives.isDisabledControlPressed(0, 44)) {
            vertSpeed -= this._speed;
        }

        // 21 - shift
        if (natives.isDisabledControlPressed(0, 21)) {
            speed *= 2;
            vertSpeed *= 2;
        }

        // 36 - ctrl
        if (natives.isDisabledControlPressed(0, 36)) {
            speed *= 0.5;
            vertSpeed *= 0.5;
        }

        if (ControlsController.instance.count) {
            speed = 0;
            vertSpeed = 0;
        }

        const upVector = {x: 0, y: 0, z: 1};
        const rot = natives.getGameplayCamRot(2);
        const rr = new Vector3(rot).toRadians().radiansToDirection();
        const preRightVector = new Vector3(rr.normalize()).cross(upVector);

        const movementVector = {
            x: rr.x * posMovementY * speed,
            y: rr.y * posMovementY * speed,
            z: rr.z * posMovementY * speed,
        };

        const rightVector = {
            x: preRightVector.x * posMovementX * speed,
            y: preRightVector.y * posMovementX * speed,
            z: preRightVector.z * posMovementX * speed,
        };

        return [rot, new alt.Vector3(
            pos.x - movementVector.x + rightVector.x,
            pos.y - movementVector.y + rightVector.y,
            pos.z - movementVector.z + vertSpeed,
        )];
    }

    handle = () => {
        if (!this._state) return;

        Utils.render2DText('Fly: ' + this._speed.toFixed(1), new alt.Vector2(0.95, 0.05), 0.4);

        const entity = alt.Player.local;
        const [rot, newPos] = this.getNewPos(entity.pos);

        natives.setEntityCoordsNoOffset(entity.scriptID, newPos.x, newPos.y, newPos.z, true, true, true);
        if (natives.getFollowPedCamZoomLevel() !== 4) natives.setEntityHeading(entity.scriptID, rot.z);
    }

    handleFreecam = () => {
        if (!this._state || !this._cam) return;

        Utils.render2DText('Freecam: ' + this._speed.toFixed(1), new alt.Vector2(0.95, 0.05), 0.4);

        const [rot, newPos] = this.getNewPos(natives.getCamCoord(this._cam));
        natives.setCamCoord(this._cam, newPos.x, newPos.y, newPos.z);
        natives.setCamRot(this._cam, rot.x, rot.y, rot.z, 2);

        natives.setFocusPosAndVel(newPos.x, newPos.y, newPos.z,0,0,0);
    }
}
