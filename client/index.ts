import alt from 'alt-client';
import './extensions/Vector3';
import CodeEditorController from "./controllers/CodeEditorController";
import ModelInspectorController from "./controllers/ModelInspectorController";
import ControlsController from "./controllers/ControlsController";
import MouseController from "./controllers/MouseController";
import Utils from "./utils/Utils";
import natives from "natives";
import FlyController from "./controllers/FlyController";
import TPController from "./controllers/TPController";

ControlsController.instance;
MouseController.instance;
CodeEditorController.instance;
ModelInspectorController.instance;
FlyController.instance;
TPController.instance;

alt.on('consoleCommand', (cmd, ...args: string[]) => {
    if (cmd != 'eval') return;
    alt.log(JSON.stringify(new Utils.AsyncFunction('alt', 'natives', 'native', 'game', args.join(' '))(alt, natives, natives, natives)));
});

alt.onServer('serverLog', (msg: string) => {
    alt.log(msg);
});

alt.onServer('resourceStop', () => FlyController.instance.stop());