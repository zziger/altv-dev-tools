namespace Utils {
    export function jsonClone<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }

    export function debounce<T extends (...args: any[]) => void>(callback: T, wait: number): (...args: Parameters<T>) => void {
        let timeout: any;
        return (...args: Parameters<T>) => {
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                callback(...args);
            }, wait);
        };
    }

    export function clamp(num: number, min: number, max: number): number {
        return Math.min(Math.max(num, min), max);
    }
}

export default Utils;