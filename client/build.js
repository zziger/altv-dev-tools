import { altvEsbuild } from "altv-esbuild";
import esbuild from "esbuild";
import { SHARED_BUILD_OPTIONS } from "../shared/build";

esbuild.build({
  ...SHARED_BUILD_OPTIONS.esbuild,
  entryPoints: ["./index.ts"],
  outfile: "../dist/client.js",
  plugins: [
    altvEsbuild({
      mode: "client",
      ...SHARED_BUILD_OPTIONS.altvEsbuild,
    }),
  ],
});
