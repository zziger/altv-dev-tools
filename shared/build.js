import process from "process";

const dev = (process.argv[2] === "--dev");

console.log("dev mode:", dev);

export const SHARED_BUILD_OPTIONS = {
    esbuild: {
        format: "esm",
        bundle: true,
        watch: dev,
        define: {
            process: `{ "env": {} }`,
            "process.env.NODE_ENV": `"${dev ? "development" : "production"}"`,
        },
    },

    altvEsbuild: {
        dev: dev ? { hotReloadServerPort: 8878 } : false,
        altvEnums: true,
    },
};
