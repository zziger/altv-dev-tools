const registeredEvents = new Map<string, ((...args: any[]) => any)[]>();
const registeredClientEvents = new Map<string, ((...args: any[]) => any)[]>();

window.alt = window.alt ?? {
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


const client = {
    emit: (event: string, ...args: any[]): void => {
        for (const e of registeredEvents.get(event) ?? []) {
            e(...args);
        }
    },
    on: (eventName: string, listener: (...args: any[]) => any): void => {
        if (!registeredClientEvents.has(eventName)) registeredClientEvents.set(eventName, []);
        registeredClientEvents.get(eventName)?.push(listener);
    },
    off: (eventName: string, listener: (...args: any[]) => any): void => {
        if (!registeredEvents.has(eventName)) return;
        registeredEvents.set(
            eventName,
            registeredEvents.get(eventName)!.filter((e) => e !== listener),
        );
    },
    once: (eventName: string, listener: (...args: any[]) => any): void => {
        const handler = (...args: any[]) => {
            (window as any).client.off(eventName, handler);
            listener(...args);
        };
        (window as any).client.on(eventName, handler);
    },
};

(window as any).client = client;

export {};