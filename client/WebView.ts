import alt from "alt-client";
import GenericRPC from "../shared/RPC/RPC";

const webview = new alt.WebView(process.env.NODE_ENV === 'production' ? 'http://resource/dist/frontend/index.html' : 'http://192.168.192.1:3000');

const webviewRPC = new GenericRPC(webview, {
    name: 'client-webview'
});

webview.on('load', () => {
    webviewRPC.registerMethod('get', (key) => {
        return alt.LocalStorage.get(key)
    });

    webview.on('save', (key, value) => {
        alt.LocalStorage.set(key, value);
        alt.LocalStorage.save();
    });

    webview.emit('ready');
})

export { webview, webviewRPC };