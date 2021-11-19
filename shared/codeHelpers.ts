export const codeHelpers = {
    asyncTimeout: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
}
