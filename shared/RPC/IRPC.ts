import Deferred from "../Deferred";

export default interface IRPC {
  registerMethod(event: string, callback: (...args: any[]) => any): number;
  unregisterMethod(id: number): void;
  request<T>(event: string, ...args: any[]): Promise<T>;
  requestWithoutTimeout<T>(event: string, ...args: any[]): Promise<T>;
  push(promise: Deferred<any>, name?: string, disableTimeout?: boolean): number;
  pop(promiseId: number): void;
  answer(promiseId: number, ...value: any[]): void;
  on(event: string, handler: (...args: any[]) => any): void;
  off(event: string, handler: (...args: any[]) => any): void;
  emit(event: string, ...args: any[]): void;

  isValid(): boolean;

  destroy(): void;

  onError(handler: (e: any) => void): void;

  offError(handler: (e: any) => void): void;
}
