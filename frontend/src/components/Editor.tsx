import MonacoEditor, {monaco} from "react-monaco-editor";
import {editor} from "monaco-editor";
import React from "react";
import Utils from "../Utils";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import themelist from '../monacoThemes/themelist.json';
import IStandaloneThemeData = editor.IStandaloneThemeData;

interface EditorProps {
    onLoaded: (editor: Editor) => void;
    onUpdate: () => void;
    theme: string;
}

interface EditorState {
    loaded: boolean;
}

const defaultThemes = {
    'vs': {
        inherit: false,
        rules: [{token: '', foreground: '000000', background: 'fffffe'}]
    },
    'vs-dark': {
        inherit: false,
        rules: [{token: '', foreground: 'D4D4D4', background: '1E1E1E'}]
    },
    'hc-black': {
        inherit: false,
        rules: [{token: '', foreground: 'FFFFFF', background: '000000'}]
    },
} as unknown as Record<string, IStandaloneThemeData>;

const themes: Record<string, IStandaloneThemeData> = Object.fromEntries(Object.entries(themelist).map(([k, v]) => [k, require('../monacoThemes/' + v + '.json')]));

export const getThemes = () => ({...defaultThemes, ...themes});
const loadThemes = (m: typeof monaco) => Object.entries(themes).forEach(([k, v]) => m.editor.defineTheme(k, v));

export const getMainColors = (theme: string): any => {
    const themes = getThemes();
    let themeObj = themes[theme];
    const token = themeObj.rules.find(r => !r.token);
    if (!themeObj.inherit) return token as any;
    const baseThemeObj = themes[themeObj.base];
    const baseToken = baseThemeObj.rules.find(r => !r.token);
    return {...baseToken, ...token} as any;
}

const helpers = 'function asyncTimeout(number): Promise<void>;';

const getTypes = Utils.lazy(async (): Promise<{ client: string; server: string; natives: string }> => {
    const [client, server, shared, natives] = await Promise.all([
        fetch('https://raw.githubusercontent.com/altmp/altv-types/master/client/index.d.ts').then(r => r.text()),
        fetch('https://raw.githubusercontent.com/altmp/altv-types/master/server/index.d.ts').then(r => r.text()),
        fetch('https://raw.githubusercontent.com/altmp/altv-types/master/shared/index.d.ts').then(r => r.text()),
        fetch('https://raw.githubusercontent.com/altmp/altv-types/master/natives/index.d.ts').then(r => r.text()),
    ])
    return {
        client: client.replace('declare module "alt-client"', 'namespace alt ') +
            shared.replace('declare module "alt-shared"', 'namespace alt ') + helpers,
        server: server.replace('declare module "alt-server"', 'namespace alt ') +
            shared.replace('declare module "alt-shared"', 'namespace alt ') +
            'let player!: alt.Player;' + helpers,
        natives: natives.replace('declare module "natives"', 'namespace native ') +
            'import game = native;' +
            'import natives = native;',
    };
});

export class Editor extends React.Component<EditorProps, EditorState> {
    monaco!: typeof monaco;
    editor!: IStandaloneCodeEditor;

    state: EditorState = {
        loaded: false
    };

    async componentDidMount() {
        await getTypes();
        this.setState({loaded: true});
    }

    componentDidUpdate(prevProps: Readonly<EditorProps>, prevState: Readonly<EditorState>, snapshot?: any) {
        if (prevProps.theme != this.props.theme) this.monaco?.editor.setTheme(this.props.theme);
        this.editor?.layout();
    }

    editorLoaded = async (_: IStandaloneCodeEditor, editor: typeof monaco) => {
        this.monaco = editor;
        this.editor = _;
        // this.editor.onContextMenu((e) => {
        //     const contextMenuElement = this.editor.getDomNode()!.querySelector(".monaco-menu-container") as HTMLElement;
        //
        //     if (contextMenuElement) {
        //         const posY = (e.event.posy + contextMenuElement.clientHeight) > window.outerHeight
        //             ? e.event.posy - contextMenuElement.clientHeight
        //             : e.event.posy;
        //
        //         const posX = (e.event.posx + contextMenuElement.clientWidth) > window.outerWidth
        //             ? e.event.posx - contextMenuElement.clientWidth
        //             : e.event.posx;
        //
        //         contextMenuElement.style.position = "fixed";
        //         contextMenuElement.style.top =  Math.max(0, Math.floor(posY)) + "px";
        //         contextMenuElement.style.left = Math.max(0, Math.floor(posX)) + "px";
        //     }
        // });
        loadThemes(editor);
        this.props.onLoaded(this);
        editor.editor.setTheme(this.props.theme);
    };

    dispose: () => void = () => null;
    private lastSide = -1;

    public async loadFile(side: number, contents: string) {
        await this.changeSide(side);
        this.monaco.editor.getModels()[0].setValue(contents);
    }

    private async changeSide(side: number): Promise<void> {
        if (this.lastSide === side) return;
        this.lastSide = side;

        this.dispose();
        const instance = this.monaco;

        const types = await getTypes();

        if (side) {
            // server
            const service = instance.languages.typescript.javascriptDefaults.addExtraLib(types.server);
            const autocompletion = instance.languages.registerCompletionItemProvider('javascript', {
                provideCompletionItems: (): any => {
                    return {
                        suggestions: [
                            {
                                label: 'p',
                                kind: instance.languages.CompletionItemKind.Snippet,
                                detail: 'Player',
                                insertText: 'player',
                            },
                            {
                                label: 'v',
                                kind: instance.languages.CompletionItemKind.Snippet,
                                detail: 'Player\'s vehicle',
                                insertText: 'player.vehicle',
                            },
                            {
                                label: 'pgid',
                                kind: instance.languages.CompletionItemKind.Snippet,
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                detail: "Get a Player by ID",
                                insertText: 'alt.Player.getByID(${1:0})',
                            },
                            {
                                label: 'vgid',
                                kind: instance.languages.CompletionItemKind.Snippet,
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                detail: "Get a Vehicle by ID",
                                insertText: 'alt.Vehicle.getByID(${1:0})',
                            },
                        ],
                    };
                },
            });
            this.dispose = (): void => {
                service.dispose();
                autocompletion.dispose();
            }
        } else {
            // client
            const altService = instance.languages.typescript.javascriptDefaults.addExtraLib(types.client);
            const nativeService = instance.languages.typescript.javascriptDefaults.addExtraLib(types.natives);
            const autocompletion = instance.languages.registerCompletionItemProvider('javascript', {
                provideCompletionItems: (): any => {
                    return {
                        suggestions: [
                            {
                                label: 'p',
                                kind: instance.languages.CompletionItemKind.Snippet,
                                detail: 'Player',
                                insertText: 'alt.Player.local',
                            },
                            {
                                label: 'pid',
                                kind: instance.languages.CompletionItemKind.Snippet,
                                detail: "Player's scriptID",
                                insertText: 'alt.Player.local.scriptID',
                            },
                            {
                                label: 'v',
                                kind: instance.languages.CompletionItemKind.Snippet,
                                detail: 'Vehicle',
                                insertText: 'alt.Player.local.vehicle',
                            },
                            {
                                label: 'vid',
                                kind: instance.languages.CompletionItemKind.Snippet,
                                detail: "Vehicle's scriptID",
                                insertText: 'alt.Player.local.vehicle.scriptID',
                            },
                            {
                                label: 'pgid',
                                kind: instance.languages.CompletionItemKind.Snippet,
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                detail: "Get a Player by ID",
                                insertText: 'alt.Player.getByID(${1:0})',
                            },
                            {
                                label: 'vgid',
                                kind: instance.languages.CompletionItemKind.Snippet,
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                detail: "Get a Vehicle by ID",
                                insertText: 'alt.Vehicle.getByID(${1:0})',
                            },
                        ],
                    };
                },
            });
            this.dispose = (): void => {
                altService.dispose();
                nativeService.dispose();
                autocompletion.dispose();
            };
        }
    }

    render() {
        return this.state.loaded
            ? <MonacoEditor
                width="100%"
                height="100%"
                editorDidMount={this.editorLoaded}
                language="javascript"
                theme={this.state.loaded ? this.props.theme : 'vs-dark'}
                defaultValue={'// loading...'}
                options={{
                    fixedOverflowWidgets: true
                }}
                onChange={() => this.props.onUpdate()}
            />
            : <div className="loading">Loading...</div>
    }

}