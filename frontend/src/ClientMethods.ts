import clientRPC from "./ClientRPC";


namespace ClientMethods {
    export async function save(key: string, value: any): Promise<void> {
        return clientRPC.emit('save', key, value);
    }

    export async function get(key: string): Promise<any> {
        return clientRPC.request<any>('get', key);
    }

    export async function evalCode(type: number, id: number, code: string): Promise<string> {
        return clientRPC.request<any>('eval', type, id, code);
    }
}

export default ClientMethods;