import util from "util";
import alt from "alt-client";
import {webview, webviewRPC} from "../WebView";
import natives from "natives";
import {serverRPC} from "../Server";
import MouseController from "./MouseController";
import ControlsController from "./ControlsController";
import Utils from "../utils/Utils";
import AsyncFunction = Utils.AsyncFunction;
import {codeHelpers} from "../../shared/codeHelpers";
import { KeyCode } from "altv-enums";

export default class CodeEditorController {
    static readonly instance = new CodeEditorController();

    private constructor() {
        webviewRPC.registerMethod('eval', async (type, id, code) => {
            if (type === 0) {
                return await CodeEditorController.evalClientCode(id, code);
            } else if (type === 1) {
                return await CodeEditorController.evalServerCode(id, code);
            }
        });

        alt.onServer('codeEditor:log', (id: number, data: string) => {
            webview.emit('log', id, data);
        })

        alt.on('keydown', this.onKeydown);
    }

    private _state = false;
    private _opacity = false;

    private static readonly inspectSettings = {
        colors: true,
        breakLength: 80
    }

    // region Formatters
    private static readonly colorizeError = (text: string) => '\x1b[31;1m[Error] ' + text + '\x1b[0m';
    private static readonly colorizeWarning = (text: string) => '\x1b[33;1m[Warning] ' + text + '\x1b[0m';
    private static readonly colorizeInfo = (text: string) => '\x1b[36;1m[Info] ' + text + '\x1b[0m';
    private static readonly formatAltLog = (text: string) => text
        .replace(/~k~/g, '\x1b[30m')
        .replace(/~r~/g, '\x1b[31m')
        .replace(/~g~/g, '\x1b[32m')
        .replace(/~y~/g, '\x1b[33m')
        .replace(/~b~/g, '\x1b[34m')
        .replace(/~m~/g, '\x1b[35m')
        .replace(/~c~/g, '\x1b[36m')
        .replace(/~w~/g, '\x1b[37m')
        .replace(/~lk~/g, '\x1b[30;1m')
        .replace(/~lr~/g, '\x1b[31;1m')
        .replace(/~lg~/g, '\x1b[32;1m')
        .replace(/~ly~/g, '\x1b[33;1m')
        .replace(/~lb~/g, '\x1b[34;1m')
        .replace(/~lm~/g, '\x1b[35;1m')
        .replace(/~lc~/g, '\x1b[36;1m')
        .replace(/~lw~/g, '\x1b[37;1m') + '\x1b[0m';

    private static readonly formatArgs = (args: any[], colors: boolean = true) => args.map(e => typeof e === 'string' ? e : util.inspect(e, {
        ...this.inspectSettings,
        colors
    })).join(' ') + '\x1b[0m';
    // endregion

    // region Patchers
    private static readonly patchAlt = (id: number) => {
        return {
            ...alt,
            log: (...args: any[]) => {
                alt.log(...args);
                webview.emit('log', id, this.formatAltLog(this.formatArgs(args)));
            },
            logWarning: (...args: any[]) => {
                alt.logWarning(...args);
                webview.emit('log', id, this.colorizeWarning(this.formatArgs(args, false)));
            },
            logError: (...args: any[]) => {
                alt.logError(...args);
                webview.emit('log', id, this.colorizeError(this.formatArgs(args, false)));
            }
        }
    }

    private static readonly patchConsole = (id: number) => {
        return {
            ...console,
            log: (...args: any[]) => {
                console.log(...args);
                webview.emit('log', id, this.formatAltLog(this.formatArgs(args)));
            },
            warn: (...args: any[]) => {
                console.warn(...args);
                webview.emit('log', id, this.colorizeWarning(this.formatArgs(args, false)));
            },
            error: (...args: any[]) => {
                console.error(...args);
                webview.emit('log', id, this.colorizeError(this.formatArgs(args, false)));
            },
            info: (...args: any[]) => {
                console.info(...args);
                webview.emit('log', id, this.colorizeInfo(this.formatArgs(args, false)));
            }
        }
    }

    // endregion

    private static async evalClientCode(id: number, code: string) {
        try {
            const res = await new AsyncFunction('alt', 'console', 'native', 'natives', 'game', ...Object.keys(codeHelpers), code)
            (
                CodeEditorController.patchAlt(id),
                CodeEditorController.patchConsole(id),
                natives, natives, natives,
                ...Object.values(codeHelpers)
            );
            return util.inspect(res, CodeEditorController.inspectSettings);
        } catch (e) {
            if (e instanceof Error) {
                return CodeEditorController.colorizeError(String(e.stack));
            }
            return CodeEditorController.colorizeError(util.inspect(e, {...CodeEditorController.inspectSettings, colors: false}));
        }
    }

    private static async evalServerCode(id: number, code: string) {
        return await serverRPC.request('codeEditor:eval', code, id);
    }

    private onKeydown = (key: KeyCode) => {
        if (key === KeyCode.F6) {
            this._state = !this._state;
            if (this._state) {
                ControlsController.instance.block('codeEditor');
                MouseController.instance.toggleMouse(true);
            } else {
                ControlsController.instance.unblock('codeEditor');
                MouseController.instance.toggleMouse(false);
            }
            webview.emit('toggle', 'codeEditor', this._state);
        }
        if (key === KeyCode.F5) {
            webview.emit('codeEditor:halfTransparent', (this._opacity = !this._opacity));
        }
    };
}
