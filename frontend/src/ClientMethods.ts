import clientRPC from "./ClientRPC";
import {WindowSize} from "./components/ResizableWindow";

namespace ClientMethods {
    export async function save(key: string, value: any): Promise<void> {
        return clientRPC.emit('save', key, value);
    }

    export async function get(key: string): Promise<any> {
        return clientRPC.request<any>('get', key);
    }
}

export default ClientMethods;