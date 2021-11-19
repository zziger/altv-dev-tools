import React from 'react';
import ReactDOM from 'react-dom';
import './polyfill';
import './styles/index.css';
import CodeEditor from './windows/codeEditor/CodeEditor';
import {WindowsManager} from "./WindowsManager";

if (!('alt' in window)) {
    (window as any).alt = {
        on: (event: string, action: any) => action()
    }
}

alt.on('ready', () => {
    ReactDOM.render(
        <React.StrictMode>
            <div id="app">
                <WindowsManager />
            </div>
        </React.StrictMode>,
        document.getElementById('root')
    );
});
