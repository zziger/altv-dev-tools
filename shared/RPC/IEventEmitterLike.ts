export interface IEventEmitterLike {
    on(event: string, callback: (...args: any[]) => any): void;

    off(event: string, callback: (...args: any[]) => any): void;

    emit(event: string, ...args: any[]): void;

    valid?: boolean;
}