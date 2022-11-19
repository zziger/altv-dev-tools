import { altvEsbuild } from "altv-esbuild";
import esbuild from "esbuild";
import { SHARED_BUILD_OPTIONS } from "../shared/build";

esbuild.build({
  ...SHARED_BUILD_OPTIONS.esbuild,
  platform: "node",
  entryPoints: ["./index.ts"],
  outfile: "../dist/server.js",
  plugins: [
    altvEsbuild({
      ...SHARED_BUILD_OPTIONS.altvEsbuild,
      mode: "server",
    }),
  ],
});
