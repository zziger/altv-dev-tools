import Deferred from "../Deferred";
import { IEventEmitterLike } from "./IEventEmitterLike";
import IRPC from "./IRPC";

export type GenericRPCOptions = Partial<{
    replKeyword: string;
    errorKeyword: string;
    chunkKeyword: string;
    chunkedReplKeyword: string;
    timeout: number;
    name: string;
}>;

declare const console: any;

export default class GenericRPC implements IRPC {
    private waitingPromises = new Map<
        number,
        [number, string, Deferred<any>, boolean?]
        >();
    private chunks = new Map<number, [chunkSubId: number, data: string][]>();
    private errorHandlers: ((e: any) => void)[] = [];
    private promiseId = 0;

    constructor(
        private readonly eventEmitter: IEventEmitterLike, //
        private options?: GenericRPCOptions
    ) {
        eventEmitter.on(options?.replKeyword ?? "$repl", this.replHandler);
        eventEmitter.on(options?.errorKeyword ?? "$err", this.errorHandler);
        eventEmitter.on(options?.chunkKeyword ?? "$chunk", this.chunkHandler);
        eventEmitter.on(
            options?.chunkedReplKeyword ?? "$chunkedRepl",
            this.chunkedReplHandler
        );
        this.timeoutId = setInterval(
            this.timeoutHandler,
            options?.timeout ? options.timeout / 5 : 6000
        );
    }

    destroy() {
        console.log("RPC " + this.options?.name + " was destroyed!");
        clearInterval(this.timeoutId);
        if (!this.eventEmitter.valid) return;
        this.eventEmitter.off(
            this.options?.replKeyword ?? "$repl",
            this.replHandler
        );
        this.eventEmitter.off(
            this.options?.errorKeyword ?? "$err",
            this.errorHandler
        );
        this.eventEmitter.off(
            this.options?.chunkKeyword ?? "$chunk",
            this.chunkHandler
        );
        this.eventEmitter.off(
            this.options?.chunkedReplKeyword ?? "$chunkedRepl",
            this.chunkedReplHandler
        );
    }

    static waitFor<T>(
        eventEmitter: IEventEmitterLike,
        event: string
    ): Promise<T> {
        return new Promise((resolve) => {
            function handler(...args: any[]) {
                resolve(args.length === 1 ? args[0] : args);
                eventEmitter.off(event, handler);
            }

            eventEmitter.on(event, handler);
        });
    }

    isValid(): boolean {
        return this.eventEmitter.valid ?? true;
    }

    log(msg: string, ...args: any[]) {
        // console.log(`${this.options?.name}: ${msg}`, ...args);
    }

    private timeoutId: any;
    private timeoutHandler = () => {
        for (const index of Array.from(this.waitingPromises.keys())) {
            const value = this.waitingPromises.get(index);
            if (!value || value[3]) continue;
            if (Date.now() - value[0] > (this.options?.timeout ?? 30000)) {
                value[2].reject("Timeout " + value[1]);
                this.waitingPromises.delete(index);
            }
        }
    };

    private registeredMethods = new Map<
        number,
        [string, (...args: any[]) => any]
        >();
    private lastRegisteredMethod = 0;

    registerMethod(event: string, callback: (...args: any[]) => any): number {
        if (!this.eventEmitter.valid) return -1;
        const handler = async (promiseId: number, ...args: any[]) => {
            try {
                const res = await callback(...args);
                this.answer(promiseId, res);
            } catch (e) {
                this.error(promiseId, String((e as any)?.stack ?? e));
            }
        };

        const id = this.lastRegisteredMethod++;
        this.registeredMethods.set(id, [event, handler]);
        this.eventEmitter.on(event, handler);
        return id;
    }

    unregisterMethod(id: number): void {
        if (!this.eventEmitter.valid) return;
        const method = this.registeredMethods.get(id);
        if (!method) return;
        this.eventEmitter.off(method[0], method[1]);
        this.registeredMethods.delete(id);
    }

    request<T>(event: string, ...args: any[]): Promise<T> {
        this.log("requested " + event, this.eventEmitter);
        const promise = new Deferred<T>();
        const id = this.push(promise, event);
        this.eventEmitter.emit(event, id, ...args);
        return promise;
    }

    requestWithoutTimeout<T>(event: string, ...args: any[]): Promise<T> {
        this.log("requested " + event, this.eventEmitter);
        const promise = new Deferred<T>();
        const id = this.push(promise, event, true);
        this.eventEmitter.emit(event, id, ...args);
        return promise;
    }

    private replHandler = (promiseId: number, ...args: any[]): void => {
        this.log("repl accepted " + promiseId + " " + JSON.stringify(args));
        const promise = this.waitingPromises.get(promiseId);
        if (!promise) return;
        promise[2]?.resolve(args.length > 1 ? args : args[0]);
        this.pop(promiseId);
    };

    private chunkHandler = (
        chunkId: number,
        subId: number,
        data: string
    ): void => {
        if (!this.chunks.has(chunkId)) this.chunks.set(chunkId, []);
        const chunks = this.chunks.get(chunkId)!;
        chunks.push([subId, data]);
    };

    private chunkedReplHandler = (
        promiseId: number,
        chunkId: number,
        total: number
    ): void => {
        if (!this.chunks.has(chunkId))
            throw new Error("Unknown chunked message received");
        const chunks = this.chunks.get(chunkId)!;
        if (chunks.length !== total)
            throw new Error("Invalid chunked message length received");
        const data = chunks
            .sort((a, b) => a[0] - b[0])
            .reduce((prev, curr) => prev + curr[1], "");
        this.chunks.delete(chunkId);
        this.replHandler(promiseId, data);
    };

    private errorHandler = (promiseId: number, error?: string): void => {
        this.log("error repl accepted " + promiseId + " " + error);
        const promise = this.waitingPromises.get(promiseId);
        if (!promise) return;
        this.errorHandlers.forEach((h) => h(error));
        promise[2]?.reject(
            error ? "RPC error: " + error : "RPC method execution failed"
        );
        this.pop(promiseId);
    };

    push(promise: Deferred<any>, name = "", disableTimeout?: boolean): number {
        this.waitingPromises.set(this.promiseId, [
            Date.now(),
            name,
            promise,
            disableTimeout,
        ]);
        return this.promiseId++;
    }

    pop(promiseId: number): void {
        this.waitingPromises.delete(promiseId);
    }

    answer(promiseId: number, ...value: any[]): void {
        this.log("answer called " + promiseId);
        Promise.all(value).then((values) =>
            this.eventEmitter.emit(
                this.options?.replKeyword ?? "$repl",
                promiseId,
                ...values
            )
        );
    }

    error(promiseId: number, error?: string): void {
        this.log("error called " + promiseId);
        this.eventEmitter.emit(
            this.options?.errorKeyword ?? "$err",
            promiseId,
            error
        );
    }

    on(event: string, handler: (...args: any[]) => any): void {
        if (!this.eventEmitter.valid) return;
        this.eventEmitter.on(event, handler);
    }

    off(event: string, handler: (...args: any[]) => any): void {
        if (!this.eventEmitter.valid) return;
        this.eventEmitter.off(event, handler);
    }

    onError(handler: (e: any) => void): void {
        this.errorHandlers.push(handler);
    }

    offError(handler: (e: any) => void): void {
        this.errorHandlers = this.errorHandlers.filter((e) => e !== handler);
    }

    emit(event: string, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }
}
