import alt from "alt-client";

export default class ControlsController {
    static readonly instance = new ControlsController();

    private constructor() {
    }

    private _blockers: string[] = [];

    get count(): number {
        return this._blockers.length;
    }

    block(name: string) {
        this._blockers.push(name);
        alt.toggleGameControls(false);
    }

    unblock(name: string) {
        this._blockers = this._blockers.filter(b => b != name);
        if (!this._blockers.length) alt.toggleGameControls(true);
    }
}