import alt from 'alt-client';
import {webview} from "../WebView";
import ControlsController from "./ControlsController";

export default class MouseController {
    public static instance = new MouseController();

    private constructor() {
        alt.on('keydown', this.onKeydown);
    }

    private _state: boolean = false;

    get state() {
        return this._state;
    }

    private onKeydown = (key: number) => {
        if (key !== 113) return;
        this.toggleMouse();
    };

    public toggleMouse(newState?: boolean): void {
        if (this._state === newState && newState != null) return;
        alt.showCursor((this._state = (newState ?? !this._state)));
        if (this._state) {
            webview.focus();
            ControlsController.instance.block('mouse');
        }
        else {
            webview.unfocus();
            ControlsController.instance.unblock('mouse');
        }
        alt.emit('cursorState', this._state);
    }
}
