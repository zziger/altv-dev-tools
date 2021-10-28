import React from 'react';
import './styles/App.sass';

// noinspection TypeScriptCheckImport
// @ts-ignore
// eslint-disable-next-line
import clientTypes from '!!raw-loader!../../node_modules/@altv/types-client/index.d.ts';
// noinspection TypeScriptCheckImport
// @ts-ignore
// eslint-disable-next-line
import serverTypes from '!!raw-loader!../../node_modules/@altv/types-server/index.d.ts';
// noinspection TypeScriptCheckImport
// @ts-ignore
// eslint-disable-next-line
import sharedTypes from '!!raw-loader!../../node_modules/@altv/types-shared/index.d.ts';
// noinspection TypeScriptCheckImport
// @ts-ignore
// eslint-disable-next-line
import nativesTypes from '!!raw-loader!../../node_modules/@altv/types-natives/index.d.ts';
import Utils from "./Utils";
import {ResizableWindow, Vector2, WindowSize} from "./components/ResizableWindow";
import {start} from "repl";
import CodeIcon from '@mui/icons-material/Code';
import DeleteIcon from '@mui/icons-material/Delete';
import RenameIcon from '@mui/icons-material/Edit';
import './styles/codeEditor.sass'
import MonacoEditor from "react-monaco-editor";


interface CodeEditorState {
    resultHeight: number;
    code: string;
}

class CodeEditor extends React.Component<{}, CodeEditorState> {
    private startMousePos?: Vector2;

    state: CodeEditorState = {
        resultHeight: 30,
        code: '//test'
    }

    private _mainBlockRef = React.createRef<HTMLDivElement>();

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

    setCode = (code: string) => {
        this.setState({ code });
    }

    render() {
        return <ResizableWindow name="codeEditor">
            {startMove => <>
                <div className="header" onMouseDown={startMove}>
                    <div className="name">Code editor</div>
                    <div className="actions">
                        <div className="button">
                            Execute&nbsp;<CodeIcon/>
                        </div>
                    </div>
                </div>
                <div className="innerContent">
                    <div className="files">
                        <div className="file">
                            <div className="name">testtestsetsetsetsetset.js</div>
                            <div className="actions">
                                <div className="action">
                                    <DeleteIcon/>
                                </div>
                                <div className="action">
                                    <RenameIcon/>
                                </div>
                            </div>
                        </div>
                        <div className="file">
                            <div className="name">testtestsetsetsetsetset.js</div>
                            <div className="actions">
                                <div className="action">
                                    <DeleteIcon/>
                                </div>
                                <div className="action">
                                    <RenameIcon/>
                                </div>
                            </div>
                        </div>
                        <div className="file">
                            <div className="name">testtestsetsetsetsetset.js</div>
                            <div className="actions">
                                <div className="action">
                                    <DeleteIcon/>
                                </div>
                                <div className="action">
                                    <RenameIcon/>
                                </div>
                            </div>
                        </div>
                        <div className="file">
                            <div className="name">testtestsetsetsetsetset.js</div>
                            <div className="actions">
                                <div className="action">
                                    <DeleteIcon/>
                                </div>
                                <div className="action">
                                    <RenameIcon/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mainBlock" ref={this._mainBlockRef}>
                        <div className="code">
                            <MonacoEditor
                                width="800"
                                height="600"
                                language="javascript"
                                theme="vs-dark"
                                value={this.state.code}
                                onChange={this.setCode}
                            />
                        </div>
                        <div className="border" onMouseDown={e => this.startResultResize({x: e.clientX, y: e.clientY})}></div>
                        <div className="result" style={{height: this.state.resultHeight + '%'}}>
                            Press "Execute" button to execute the code
                            <br/>
                        </div>
                    </div>
                </div>
            </>}
        </ResizableWindow>;
    }
}

export default CodeEditor;
