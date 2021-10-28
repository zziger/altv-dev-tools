import React from 'react';
import '../../styles/App.sass';

import Utils from "../../Utils";
import {ResizableWindow, Vector2, WindowSize} from "../../components/ResizableWindow";
import {start} from "repl";
import CodeIcon from '@mui/icons-material/Code';
import DeleteIcon from '@mui/icons-material/Delete';
import RenameIcon from '@mui/icons-material/Edit';
import ClientIcon from '@mui/icons-material/Computer';
import ServerIcon from '@mui/icons-material/Storage';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import '../../styles/codeEditor.sass'
import {Editor, getMainColors} from "../../components/Editor";
import ClientMethods from "../../ClientMethods";
import Deferred from "../../../../shared/Deferred";
import {editFileModal} from "./modals/EditFileModal";
import {alertModal} from "./modals/AlertModal";
import {questionModal} from "./modals/QuestionModal";
import Convert from 'ansi-to-html';
import {settingsModal} from "./modals/SettingsModal";

interface FileDefinition {
    type: number;
    name: string;
}

interface File {
    type: number;
    contents: string;
    name: string;
}

export interface CodeEditorModalProps {
    close: () => void;
    setSetting: (key: string, value: any) => void;
    getSettings: () => Record<string, any>;
}

interface CodeEditorProps {
    active: boolean;
}

interface CodeEditorState {
    resultHeight: number;
    fileList: FileDefinition[];
    activeFile: string;
    modal?: React.ComponentType<CodeEditorModalProps>;
    result: string;
    settings: Record<string, any>;
}

class CodeEditor extends React.Component<CodeEditorProps, CodeEditorState> {
    private startMousePos?: Vector2;

    state: CodeEditorState = {
        resultHeight: 30,
        fileList: [],
        activeFile: '',
        result: '<span style="color:#555">Press Execute (or F7) to start</span>',
        settings: {
            theme: 'vs-dark',
            themeInUi: false,
            themeInConsole: false,
            highlightSeparators: true
        }
    }

    private _mainBlockRef = React.createRef<HTMLDivElement>();
    private _ref = React.createRef<Editor>();
    private files: File[] = [];
    private actionId = 0;

    componentDidMount() {
        document.addEventListener('keydown', this.onKeyPress);
        window.alt.on('log', this.log);
        ClientMethods.get('codeEditor:settings').then(d => this.setState({
            settings: d ?? {
                theme: 'vs-dark',
                themeInUi: false,
                themeInConsole: false,
                highlightSeparators: true
            }
        }))
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeyPress);
        document.addEventListener('keydown', this.onKeyPress);
        window.alt.off('log', this.log);
    }

    private converter = new Convert({
        newline: false,
        escapeXML: true,
        stream: false,
    });

    log = (id: number, data: string) => {
        if (this.actionId !== id) return;
        this.setState({ result: this.state.result + this.converter.toHtml(data) + '<br>' });
    }

    execute = async () => {
        if (!this._ref.current) return;
        const id = ++this.actionId;
        this.setState({result: ''});
        const file = this.files.find(f => f.name === this.state.activeFile);
        if (!file) return this.setState({result: this.state.result + '<span style="color: red">Error executing the code</span>'});
        const res = await ClientMethods.evalCode(file.type, id, this.getCurrentCode());
        const data = res?.replace(/%FILE_NAME%/g, file.name) || 'undefined';
        if (id != this.actionId) return console.log('Ignored code editor result: ' + data);
        this.setState(
            {result: this.state.result + '<span style="color:#555">Result: </span>' + this.converter.toHtml(data)},
        );
    }

    onKeyPress = (e: KeyboardEvent) => {
        if (e.keyCode === 78 && e.ctrlKey && e.altKey) {
            e.preventDefault();
            e.stopPropagation();
            this.createFileModal(0);
        }
        if (e.keyCode === 66 && e.ctrlKey && e.altKey) {
            e.preventDefault();
            e.stopPropagation();
            this.createFileModal(1);
        }
        if (e.keyCode === 68 && e.ctrlKey && e.altKey) {
            e.preventDefault();
            e.stopPropagation();
            if (!this.state.activeFile) return;
            this.deleteFileModal(this.state.activeFile);
        }
        if (e.keyCode === 82 && e.ctrlKey && e.altKey) {
            e.preventDefault();
            e.stopPropagation();
            if (!this.state.activeFile) return;
            this.editFileModal(this.state.activeFile);
        }
        if (e.keyCode === 70 && e.ctrlKey && e.altKey) {
            e.preventDefault();
            e.stopPropagation();
            this._ref.current?.editor.focus();
        }
        if (e.keyCode === 38 && e.ctrlKey && e.altKey) {
            e.preventDefault();
            e.stopPropagation();
            this.modFile(-1);
        }
        if (e.keyCode === 40 && e.ctrlKey && e.altKey) {
            e.preventDefault();
            e.stopPropagation();
            this.modFile(1);
        }
        if (e.keyCode === 191 && e.altKey && e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();
            this.openModal(alertModal('Available keys:\n\n' +
                'Ctrl + Alt + N -> Create client file\n' +
                'Ctrl + Alt + B -> Create server file\n' +
                'Ctrl + Alt + D -> Delete current file\n' +
                'Ctrl + Alt + R -> Rename current file\n' +
                'Ctrl + Alt + F -> Focus editor\n' +
                'Ctrl + Alt + Arrow up -> Previous file\n' +
                'Ctrl + Alt + Arrow down -> Next file\n' +
                'F7 or Ctrl + Alt + E -> Execute code\n\n' +
                'Ctrl + Alt + \' -> Snippets list'));
        }
        if (e.keyCode === 222 && e.altKey && e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();
            this.openModal(alertModal('Available snippets:\n\n' +
                'p -> alt.Player.local (on server: player)\n' +
                'pid -> alt.Player.local.scriptID (client only)\n' +
                'v -> alt.Player.local.vehicle (on server: player.vehicle)\n' +
                'vid -> alt.Player.local.vehicle.scriptID (client only)\n' +
                'pgid -> alt.Player.getByID()\n' +
                'vgid -> alt.Vehicle.getByID()'));
        }
        if (e.keyCode === 118 || (e.keyCode === 69 && e.ctrlKey && e.altKey)) {
            e.preventDefault();
            e.stopPropagation();
            this.execute();
        }
    }

    createFile(name: string, type: number): boolean {
        if (this.files.find(f => f.name === name)) return false;
        this.files.push({
            type,
            name,
            contents: type === 1 ? '// server file' : '// client file'
        });
        this.updateFileList();
        this.saveFiles();
        return true;
    }

    renameFile(name: string, newName: string): boolean {
        if (this.files.find(f => f.name === newName)) return false;
        const file = this.files.find(f => f.name === name);
        if (!file) return false;
        file.name = newName;
        if (this.state.activeFile === name) this.setState({activeFile: newName});
        this.updateFileList();
        this.saveFiles();
        return true;
    }

    deleteFile(name: string): boolean {
        if (this.files.length === 1) return false;
        this.files = this.files.filter(f => f.name != name);
        if (name === this.state.activeFile)
            this.loadFile(this.files[0].name);
        this.updateFileList();
        this.saveFiles();
        return true;
    }

    async saveFiles() {
        await ClientMethods.save('files', this.files);
    }

    updateFileList() {
        this.setState({
            fileList: this.files.map(f => ({
                ...f,
                contents: undefined
            }))
        })
    }

    modFile(mod: number) {
        if (!this.state.activeFile) return;
        const index = this.files.findIndex(e => e.name === this.state.activeFile);
        if (!this.files[index + mod]) return;
        this.loadFile(this.files[index + mod].name);
    }

    loadFile(name: string) {
        if (this.state.activeFile == name) return;
        if (this.state.activeFile) this.saveFile();
        const file = this.files.find(f => f.name === name);
        if (!file) return;
        this._ref.current?.loadFile(file.type, file.contents);
        this.setState({activeFile: name});
    }

    startResultResize(cursor: Vector2) {
        this.startMousePos = cursor;
        document.addEventListener('mousemove', this.processResultResize);
        document.addEventListener('mouseup', this.stopResultResize);
    }

    processResultResize = (e: MouseEvent) => {
        const el = this._mainBlockRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const percent = 1 - Utils.clamp((e.clientY - rect.top) / rect.height, 0.2, 0.9);
        this.setState({resultHeight: percent * 100});
    };

    stopResultResize = () => {
        this.startMousePos = undefined;
        document.removeEventListener('mousemove', this.processResultResize);
        document.removeEventListener('mouseup', this.stopResultResize);
    }

    onEditorLoad = async (e: Editor) => {
        await e.loadFile(0, '// loading files...');
        this.files = (await ClientMethods.get('files')) ?? [];
        if (!this.files.length) {
            this.createFile('client', 0);
            this.createFile('server', 1);
        }
        this.updateFileList();
        this.loadFile(this.files[0].name);
    }

    getCurrentCode = () => this._ref.current?.monaco.editor.getModels()[0].getValue() ?? '';

    saveFile = () => {
        const file = this.files.find(f => f.name === this.state.activeFile);
        if (!file || !this.state.activeFile) return;
        file.contents = this.getCurrentCode();
        this.saveFiles();
    }

    openModal = (modal: React.ComponentType<CodeEditorModalProps>) => this.setState({modal});
    closeModal = () => this.setState({modal: undefined});

    createFileModal = async (type: number) => {
        const promise = new Deferred<string | null>();
        this.openModal(editFileModal('', promise, type));
        const name = await promise;
        if (!name) return;
        if (!this.createFile(name, type)) this.openModal(alertModal('File with that name already exists'));
    }

    deleteFileModal = async (file: string) => {
        const promise = new Deferred<boolean>();
        this.openModal(questionModal(`Are you sure, that you want to delete file "${file}"?`, promise));
        if (!await promise) return;
        if (!this.deleteFile(file)) this.openModal(alertModal('You should have at least one file'));
    }

    editFileModal = async (file: string) => {
        const promise = new Deferred<string | null>();
        this.openModal(editFileModal(file, promise));
        const res = await promise;
        if (!res) return;
        if (!this.renameFile(file, res)) this.openModal(alertModal('File with that name already exists'));
    }

    setSetting = (key: string, value: any) => {
        this.setState({settings: {...this.state.settings, [key]: value}});
        this.saveSettings();
    };

    saveSettings() {
        ClientMethods.save('codeEditor:settings', this.state.settings);
    }

    onUpdate = Utils.debounce(this.saveFile, 3000);

    render() {
        const Modal = this.state.modal;
        const theme = this.state.settings.theme ?? 'vs-dark';
        const colors: any = this.state.settings.themeInUi ? {
            background: '000000',
            foreground: 'ffffff', ...getMainColors(theme)
        } : {background: '2D2D2D', foreground: 'F1F2F2'};

        const styleColors = {
            '--bg': Utils.hexToRgb(colors.background)!.join(', '),
            '--fg': Utils.hexToRgb(colors.foreground)!.join(', ')
        } as any;

        styleColors['--sep'] = this.state.settings.highlightSeparators === false ? styleColors['--bg'] : styleColors['--fg'];

        return <ResizableWindow bgColor={colors.background} fgColor={colors.foreground} name="codeEditor" visible={this.props.active}>
            {startMove => <>
                <div className="header" onMouseDown={startMove}>
                    <div className="name">Code
                        editor{!!this.state.activeFile && ` - ${this.state.activeFile} [${this.files.find(f => f.name === this.state.activeFile)?.type === 0 ? 'client' : 'server'}]`}</div>
                    <div className="actions">
                        <div className="button" onClick={() => this.openModal(settingsModal())}>
                            Settings&nbsp;<SettingsIcon/>
                        </div>
                        <div className="button" onClick={() => this.execute()}>
                            Execute&nbsp;<CodeIcon/>
                        </div>
                    </div>
                </div>
                <div className="innerContent"
                     data-separators={true}
                     style={styleColors}>
                    <div className="files">
                        <div className="list">
                            {this.state.fileList.map(e => <div className="file" key={e.name} onClick={() => this.loadFile(e.name)}
                                                               data-active={this.state.activeFile === e.name} title={e.name}>
                                <div className="icon">{e.type === 0 ? <ClientIcon/> : <ServerIcon/>}</div>
                                <div className="name">{e.name}</div>
                                <div className="actions">
                                    <div className="action" onClick={() => this.deleteFileModal(e.name)}>
                                        <DeleteIcon/>
                                    </div>
                                    <div className="action" onClick={() => this.editFileModal(e.name)}>
                                        <RenameIcon/>
                                    </div>
                                </div>
                            </div>)}
                        </div>
                        <div className="create">
                            <div className="action" onClick={() => this.createFileModal(0)}>
                                <AddIcon/>
                                <div className="name">Add client</div>
                            </div>
                            <div className="action" onClick={() => this.createFileModal(1)}>
                                <AddIcon/>
                                <div className="name">Add server</div>
                            </div>
                        </div>
                    </div>
                    <div className="mainBlock" ref={this._mainBlockRef}>
                        <div className="code" style={{
                            height: (100 - this.state.resultHeight) + '%'
                        }}>
                            <Editor theme={theme} ref={this._ref} onLoaded={this.onEditorLoad} onUpdate={this.onUpdate}/>
                        </div>
                        <div className="border" onMouseDown={e => this.startResultResize({x: e.clientX, y: e.clientY})}/>
                        <div className="result"
                             style={{
                                 height: this.state.resultHeight + '%', ...(this.state.settings.themeInConsole ? styleColors : {
                                     '--bg': '0, 0, 0',
                                     '--fg': '255, 255, 255'
                                 })
                             }}
                             dangerouslySetInnerHTML={{__html: this.state.result.length ? this.state.result : '<span style="color:#555">Loading...</span>'}}/>
                    </div>
                </div>
                <div className="modalFrame" data-active={!!Modal} onMouseDown={(e) => e.target === e.currentTarget && this.closeModal()}>
                    {!!Modal && <Modal close={this.closeModal} setSetting={this.setSetting} getSettings={() => this.state.settings}/>}
                </div>
            </>}
        </ResizableWindow>;
    }
}

export default CodeEditor;
