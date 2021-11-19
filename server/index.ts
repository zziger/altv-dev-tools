import alt, { Player } from 'alt-server';
import util from "util";
import {codeHelpers} from "../shared/codeHelpers";
import {Vector3} from "alt-client";

const colorizeError = (text: string) => '\x1b[31;1m[Error] ' + text + '\x1b[0m';
const colorizeWarning = (text: string) => '\x1b[33;1m[Warning] ' + text + '\x1b[0m';
const colorizeInfo = (text: string) => '\x1b[36;1m[Info] ' + text + '\x1b[0m';

const AsyncFunction = Object.getPrototypeOf(async function () { /**/
}).constructor;

const inspectSettings = {
    colors: true,
    breakLength: 80
}

const formatArgs = (args: any[], colors: boolean = true) => args.map(e => typeof e === 'string' ? e : util.inspect(e, {
    ...inspectSettings,
    colors
})).join(' ');

const patchAlt = (player: alt.Player, id: number) => {
    return {
        ...alt,
        log: (...args: any[]) => {
            alt.log(...args);
            alt.emitClient(player, 'codeEditor:log', id, formatArgs(args));
        },
        logWarning: (...args: any[]) => {
            alt.logWarning(...args);
            alt.emitClient(player, 'codeEditor:log', id, colorizeWarning(formatArgs(args, false)));
        },
        logError: (...args: any[]) => {
            alt.logError(...args);
            alt.emitClient(player, 'codeEditor:log', id, colorizeError(formatArgs(args, false)));
        }
    }
}

const patchConsole = (player: alt.Player, id: number) => {
    return {
        ...console,
        log: (...args: any[]) => {
            console.log(...args);
            alt.emitClient(player, 'codeEditor:log', id, formatArgs(args));
        },
        warn: (...args: any[]) => {
            console.warn(...args);
            alt.emitClient(player, 'codeEditor:log', id, colorizeWarning(formatArgs(args, false)));
        },
        error: (...args: any[]) => {
            console.error(...args);
            alt.emitClient(player, 'codeEditor:log', id, colorizeError(formatArgs(args, false)));
        },
        info: (...args: any[]) => {
            console.info(...args);
            alt.emitClient(player, 'codeEditor:log', id, colorizeInfo(formatArgs(args, false)));
        }
    }
}

alt.onClient('codeEditor:eval', async (player, promiseId, code, id) => {
    try {
        const res = await new AsyncFunction('alt', 'player', 'console', ...Object.keys(codeHelpers), code)(
            patchAlt(player, id), player, patchConsole(player, id), ...Object.values(codeHelpers)
        );
        return alt.emitClient(player, "$repl", promiseId, util.inspect(res, inspectSettings));
    } catch (e) {
        if (e instanceof Error) {
            return alt.emitClient(player, "$repl", promiseId, colorizeError(String(e.stack)));
        }
        return alt.emitClient(player, "$repl", promiseId, colorizeError(util.inspect(e, {...inspectSettings, colors: false})));
    }
});

alt.onClient('qaTools:spawn', (player: Player, vector: Vector3) => {
    player.spawn(vector);
});
alt.onClient('qaTools:fly', (player: Player, state: boolean) => {
    player.setStreamSyncedMeta('fly', state);
});