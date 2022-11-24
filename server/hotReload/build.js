import { altvEsbuild } from "altv-esbuild";
import esbuild from "esbuild";
import process from "process";

const [, , mode] = process.argv;

// TEST
console.log("mode:", mode);

const DEV_OPTIONS = {
    hotReloadServerPort: mode === "server" ? 8880 : 8881,
    playersReconnect: false,
    restartCommand: false,
};

esbuild.build({
    logLevel: "info",
    watch: true,
    format: "esm",
    bundle: true,
    entryPoints: [`./altv-dev-tools-hr-${mode}/src.js`],
    outfile: `./altv-dev-tools-hr-${mode}/dist.js`,
    plugins: [
        altvEsbuild({
            mode,
            dev: DEV_OPTIONS,
            // TODO: add altv-enums module support
            // altvEnums: true,
        }),
    ],
});

// if mode is client we need serverside script in client resource (altv-dev-tools-hr-client)
// for restarting resource, because we cant use alt.restartResource on clientside
if (mode === "client") {
    console.log("building server script for clientside-only resource");
    esbuild.build({
        logLevel: "info",
        platform: "node",
        format: "esm",
        watch: true,
        bundle: true,
        entryPoints: [`./client-server-restart-src.js`],
        outfile: `./altv-dev-tools-hr-client/dist-server.js`,
        plugins: [
            altvEsbuild({
                mode: "server",
                dev: DEV_OPTIONS,
            }),
        ],
    });
}
