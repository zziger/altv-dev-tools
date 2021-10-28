import {useEffect, useState} from "react";

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

    export function lazy<T>(resolver: () => T): () => T {
        let value: T | void;
        return () => {
            if (value) return value;
            value = resolver();
            return value;
        }
    }

    export function useEvent(event: string, listener: (e: any) => void) {
        useEffect(() => {
            window.addEventListener(event, listener);
            return () => {
                window.removeEventListener(event, listener);
            };
        }, []);
    }

    export function useAltEvent(event: string, listener: (...args: any[]) => void) {
        useEffect(() => {
            window.alt.on(event, listener);
            return () => {
                window.alt.off(event, listener);
            };
        }, []);
    }

    export function hexToRgb(hex: string): [number, number, number] | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
        ] : null;
    }
}

export default Utils;