import alt from "alt-server";
import process from "process";
import childProcess from "child_process";
import path from "path";
import fs from "fs";

type ScriptType = "client" | "server";
type KillProcess = () => void;

interface IResource {
    readonly name: string;
    readonly srcPath: string;
    killBuildProcess: KillProcess | null;
}

export default class HotReloadController {
    public static readonly instance = new HotReloadController();

    public readonly PLAYER_HOT_RELOAD_ENABLED = Symbol("PLAYER_HOT_RELOAD_ENABLED");
    private readonly BUILD_SCRIPT_PATH: string;
    private readonly BUILD_SCRIPT_DIRNAME: string;
    private readonly resources: Record<ScriptType, IResource>;

    private constructor() {
        const resourcePath = (alt.Resource.current as alt.Resource).path;
        this.BUILD_SCRIPT_PATH = path.join(resourcePath, "server/hotReload/build.js");
        this.BUILD_SCRIPT_DIRNAME = path.dirname(this.BUILD_SCRIPT_PATH);

        const resourceBase = path
            .join(path.basename(resourcePath), "server/hotReload/altv-dev-tools-hr-")
            .replaceAll("\\", "/");

        this.resources = {
            client: {
                name: resourceBase + "client",
                srcPath: path.join(this.BUILD_SCRIPT_DIRNAME, "altv-dev-tools-hr-client/src.js"),
                killBuildProcess: null
            },
            server: {
                name: resourceBase + "server",
                srcPath: path.join(this.BUILD_SCRIPT_DIRNAME, "altv-dev-tools-hr-server/src.js"),
                killBuildProcess: null
            },
        };

        console.log("this.resources", this.resources);
    }

    public toggleForPlayer(player: alt.Player, toggle: boolean) {
        (player as unknown as Record<symbol, boolean>)[this.PLAYER_HOT_RELOAD_ENABLED] = toggle;

        if (toggle) {
            for(const scriptType of Object.keys(this.resources) as ScriptType[]) {
                fs.writeFileSync(this.resources[scriptType].srcPath, "");
                this.createBuildProcess(scriptType);
            }
        }
        else {
            for(const scriptType of Object.keys(this.resources) as ScriptType[]) {
                this.deleteBuildProcess(scriptType);
            }
        }

        setTimeout(() => {
            for(const scriptType of Object.keys(this.resources) as ScriptType[]) {
                this.toggleResource(scriptType, toggle);
            }
        }, 1000);
    }

    
    public evalForPlayer(player: alt.Player, scriptType: ScriptType, code: string): boolean {
        if (!this.isEnabledForPlayer(player)) return false;

        console.log("evalForPlayer", player.name, scriptType, "code:", code.slice(0, 20));

        // TEST
        const banner = scriptType === "server"
            ? "import alt from 'alt-server';\n"
            : "import alt from 'alt-client'; import native from 'natives';\n"

        fs.writeFileSync(this.resources[scriptType].srcPath, banner + code);

        return true;
    }

    private isEnabledForPlayer(player: alt.Player): boolean {
        return (player as unknown as Record<symbol, boolean>)[this.PLAYER_HOT_RELOAD_ENABLED];
    }

    private createBuildProcess(scriptType: ScriptType) {
        this.deleteBuildProcess(scriptType);

        console.log("createBuildProcess", scriptType);
        console.log("BUILD_SCRIPT_PATH:", this.BUILD_SCRIPT_PATH);

        const proc = this.forkChildProcess(
            this.BUILD_SCRIPT_PATH,
            [scriptType],
            {
                cwd: this.BUILD_SCRIPT_DIRNAME,
            },
        );

        proc.stdout?.on("data", (data) => {
            console.log("proc", scriptType, "stdout", data.toString().slice(0, -1));
        });

        proc.stderr?.on("data", (data) => {
            console.log("proc", scriptType, "stderr", data.toString());
        });

        proc.on("exit", () => {
            console.log("proc", scriptType, "exit");
        });

        const resourceStopHandler = () => {
            console.log("resourceStopHandler kill proc", scriptType);
            proc.kill();
        };

        alt.on("resourceStop", resourceStopHandler);

        this.resources[scriptType].killBuildProcess = () => {
            proc.kill();
            // TODO: should be fixed in altv types
            (alt as unknown as typeof import("alt-shared")).off("resourceStop", resourceStopHandler);
        };
    }

    private deleteBuildProcess(scriptType: ScriptType) {
        console.log("deleteBuildProcess", scriptType);

        this.resources[scriptType].killBuildProcess?.();
        this.resources[scriptType].killBuildProcess = null;
    }

    // thanks to vadzz we have working child_process.fork
    private forkChildProcess(
        modulePath: string,
        args: string[] = [],
        options: childProcess.SpawnOptions = {}
    ): childProcess.ChildProcess {
        if (options.stdio === undefined) {
            options.stdio = ['pipe', 'pipe', 'pipe', 'ipc'];
        }

        return childProcess.spawn('node', [modulePath, ...args], options);
    }

    private isResourceStarted(name: string) {
        // temp workaround
        // TODO: use resource.valid after 13.0 release
        let started = true;
        try {
            alt.Resource.getByName(name)?.isStarted;
        }
        catch {
            started = false;
        }
        return started;
    }

    private toggleResource(scriptType: ScriptType, toggle: boolean) {
        console.log("toggleResource", scriptType);

        const { name } = this.resources[scriptType];

        if (this.isResourceStarted(name) !== toggle) {
            console.log("resource started !==", toggle);
            alt[`${toggle ? "start" : "stop"}Resource`](name);
        }
    }
}
