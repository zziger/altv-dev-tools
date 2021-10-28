// i didn't extend promise because of the https://github.com/microsoft/TypeScript/issues/15202 (results in "TypeError: undefined is not a promise" exception)
export default class Deferred<T> implements PromiseLike<T>, Promise<T> {
    private res!: (value?: T | PromiseLike<T>) => void;
    private rej!: (reason?: any) => void;
    public resolved: boolean = false;
    private readonly promise: Promise<T>;

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.res = resolve as any;
            this.rej = reject as any;
        });
    }

    then<TResult1 = T, TResult2 = never>(
        onFulfilled?: ((value: T) => T | PromiseLike<T> | any) | null | undefined,
        onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2> | any) | null | undefined,
    ): Promise<TResult1 | TResult2> {
        return this.promise.then(onFulfilled as any, onRejected);
    }

    catch(onRejected?: (reason: any) => PromiseLike<never> | any): Promise<T> {
        return this.promise.catch(onRejected);
    }

    resolve(value?: T | PromiseLike<T>): Deferred<T> {
        if (!this.resolved) {
            this.res(value);
            this.resolved = true;
        }
        return this;
    }

    reject(reason?: any): Deferred<T> {
        if (!this.resolved) {
            this.rej(reason);
            this.resolved = true;
        }
        return this;
    }

    finally(onFinally?: (() => void) | undefined | null): Promise<T> {
        return this.promise.finally(onFinally);
    }

    readonly [Symbol.toStringTag]: string = 'Deferred';
}