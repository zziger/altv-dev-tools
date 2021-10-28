import GenericRPC from "../../shared/RPC/RPC";

const registeredEvents = new Map<string, ((...args: any[]) => any)[]>();
const registeredClientEvents = new Map<string, ((...args: any[]) => any)[]>();

const alt = window.alt ?? {
    on: (eventName: string, listener: any) => {
        if (!registeredEvents.has(eventName)) registeredEvents.set(eventName, []);
        registeredEvents.get(eventName)?.push(listener);
        console.info('ℹ️ %c Event ' + eventName + ' was registered', 'color: #aaa');
    },
    off: (eventName: string, listener: any) => {
        if (!registeredEvents.has(eventName)) return console.warn('Event ' + eventName + ' wast registered, but tried to unregister');
        registeredEvents.set(
            eventName,
            registeredEvents.get(eventName)!.filter((e) => e !== listener),
        );
        console.info('Event ' + eventName + ' was unregistered');
    },
    emit: (eventName: string, ...args: any[]) => {
        console.log(
            `ℹ️ %c Emit called. Event: %c${eventName}%c, Arguments: %c`,
            'color: #aaa',
            'color: white',
            'color: #aaa',
            'color: white',
            args,
        );
        for (const e of registeredClientEvents.get(eventName) ?? []) {
            e(...args);
        }
    },
} as any;

const clientRPC = new GenericRPC(alt, {
    name: 'webview-client',
});

export default clientRPC;