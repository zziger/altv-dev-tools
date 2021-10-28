import alt from 'alt-client';
import natives from 'natives';
import GenericRPC from "../shared/RPC/RPC";
import * as util from "util";

const webview = new alt.WebView(process.env.NODE_ENV === 'production' ? 'http://resource/dist/frontend/index.html' : 'http://localhost:3000');

const webviewRPC = new GenericRPC(webview, {
    name: 'client-webview'
});

webviewRPC.registerMethod('get', (key) => {
    return alt.LocalStorage.get(key)
});

webview.on('save', (key, value) => {
    alt.LocalStorage.set(key, value);
    alt.LocalStorage.save();
});

const serverRPC = new GenericRPC({
    emit: alt.emitServer,
    on: alt.onServer,
    off: alt.offServer
}, {
    name: 'client-server'
});

const AsyncFunction = Object.getPrototypeOf(async function () { /**/ }).constructor;

const colorizeError = (text: string) => '\x1b[31;1m[Error] ' + text + '\x1b[0m';
const colorizeWarning = (text: string) => '\x1b[33;1m[Warning] ' + text + '\x1b[0m';
const colorizeInfo = (text: string) => '\x1b[36;1m[Info] ' + text + '\x1b[0m';
const formatAltLog = (text: string) => text
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
    .replace(/~lw~/g, '\x1b[37;1m') + '\x1b[0m'

const inspectSettings = {
    colors: true,
    breakLength: 80
}

const formatArgs = (args: any[], colors: boolean = true) => args.map(e => typeof e === 'string' ? e : util.inspect(e, {
    ...inspectSettings,
    colors
})).join(' ') + '\x1b[0m';

const patchAlt = (id: number) => {
    return {
        ...alt,
        log: (...args: any[]) => {
            alt.log(...args);
            webview.emit('log', id, formatAltLog(formatArgs(args)));
        },
        logWarning: (...args: any[]) => {
            alt.logWarning(...args);
            webview.emit('log', id, colorizeWarning(formatArgs(args, false)));
        },
        logError: (...args: any[]) => {
            alt.logError(...args);
            webview.emit('log', id, colorizeError(formatArgs(args, false)));
        }
    }
}

const patchConsole = (id: number) => {
    return {
        ...console,
        log: (...args: any[]) => {
            console.log(...args);
            webview.emit('log', id, formatAltLog(formatArgs(args)));
        },
        warn: (...args: any[]) => {
            console.warn(...args);
            webview.emit('log', id, colorizeWarning(formatArgs(args, false)));
        },
        error: (...args: any[]) => {
            console.error(...args);
            webview.emit('log', id, colorizeError(formatArgs(args, false)));
        },
        info: (...args: any[]) => {
            console.info(...args);
            webview.emit('log', id, colorizeInfo(formatArgs(args, false)));
        }
    }
}

webviewRPC.registerMethod('eval', async (type, id, code) => {
    if (type === 0) {
        try {
            const res = await new AsyncFunction('alt', 'console', 'native', 'natives', 'game', code)(patchAlt(id), patchConsole(id), natives, natives, natives);
            return util.inspect(res, inspectSettings);
        } catch (e) {
            if (e instanceof Error) {
                return colorizeError(String(e.stack));
            }
            return colorizeError(util.inspect(e, {...inspectSettings, colors: false}));
        }
    } else if (type === 1) {
        return await serverRPC.request('codeEditor:eval', code, id);
    }
});

let state = false;
webview.on('load', () => {
    alt.on('keydown', (key) => {
        if (key === 117) {
            state = !state;
            alt.showCursor(state);
            alt.toggleGameControls(!state);
            if (state) webview.focus();
            else webview.unfocus();
            webview.emit('toggle', 'codeEditor', state);
        }
    });
});

alt.on('consoleCommand', (cmd, ...args: string[]) => {
    if (cmd != 'eval') return;
    alt.log(JSON.stringify([eval][0](args.join(' '))));
})

alt.onServer('codeEditor:log', (id: number, data: string) => {
    webview.emit('log', id, data);
})