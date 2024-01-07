import React from 'react';
import { createRoot } from 'react-dom/client';
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
    const container = document.getElementById('root');
    const root = createRoot(container!);

    root.render(
        <React.StrictMode>
            <div id="app">
                <WindowsManager />
            </div>
        </React.StrictMode>
    );
});
