import alt, {Vector3} from "alt-client";
import natives from "natives";
import ControlsController from "./ControlsController";
import Utils from "../utils/Utils";

export default class TPController {
    static readonly instance = new TPController();

    private constructor() {
        alt.on('keydown', this.onKeydown);
    }

    private static getWaypoint(sprite = 8): [number, number, number, number] | undefined {
        const waypoint = natives.getFirstBlipInfoId(sprite);
        if (natives.doesBlipExist(waypoint)) {
            const coords = natives.getBlipInfoIdCoord(waypoint);
            return [coords.x, coords.y, coords.z, waypoint];
        }
    }

    onKeydown = async (key: number) => {
        if (key !== 120) return;
        const point = TPController.getWaypoint();
        if (!point) return;
        let [found, z] = natives.getGroundZFor3dCoord(point[0], point[1], 9999999, 0, false, false);
        if (!found) {
            let i = 0;
            ControlsController.instance.block('tp');
            natives.setFocusPosAndVel(point[0], point[1], point[2], 0, 0, 0);
            while (!found && i < 100) {
                await Utils.asyncTimeout(50);
                [found, z] = natives.getGroundZFor3dCoord(point[0], point[1], 9999999, 0, false, false);
                i++;
            }
            natives.clearFocus();
            ControlsController.instance.unblock('tp');
        }
        const dimensions = natives.getModelDimensions(alt.Player.local.model);
        alt.emitServer('qaTools:spawn', new Vector3(point[0], point[1], z + (dimensions[2].z - dimensions[1].z) / 2));
        return true;
    }
}