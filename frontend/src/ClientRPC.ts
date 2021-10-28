import GenericRPC from "../../shared/RPC/RPC";


const clientRPC = new GenericRPC(window.alt, {
    name: 'webview-client',
});

export default clientRPC;