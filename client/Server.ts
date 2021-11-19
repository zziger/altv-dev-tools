import alt from "alt-client";
import GenericRPC from "../shared/RPC/RPC";

const serverRPC = new GenericRPC({
    emit: alt.emitServer,
    on: alt.onServer,
    off: alt.offServer
}, {
    name: 'client-server'
});

export { serverRPC };