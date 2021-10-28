import Deferred from "../../../../../shared/Deferred";
import {CodeEditorModalProps} from "../CodeEditor";
import {useState} from "react";
import Utils from "../../../Utils";
import {getThemes} from "../../../components/Editor";

export const settingsModal = () => {
    return (props: CodeEditorModalProps) => {
        Utils.useEvent('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') props.close();
        });

        const settings = props.getSettings();

        return <div className="modal">
            <div className="title">Settings</div>
            <select name="theme" onChange={e => props.setSetting('theme', e.currentTarget.value)} value={settings.theme}>
                {Object.entries(getThemes()).map(([k, v]) => <option value={k} key={k}>{k}</option>)}
            </select>
            <br/>
            <label>
                <input type="checkbox" checked={settings.themeInUi ?? false} onChange={e => (console.log(e.currentTarget.value), props.setSetting('themeInUi', e.currentTarget.checked))}/>
                Use theme in UI
            </label>
            <br/>
            <label>
                <input type="checkbox" checked={settings.themeInConsole ?? false} onChange={e => props.setSetting('themeInConsole', e.currentTarget.checked)}/>
                Use theme in console
            </label>
            <br/>
            <label>
                <input type="checkbox" checked={settings.highlightSeparators ?? true} onChange={e => props.setSetting('highlightSeparators', e.currentTarget.checked)}/>
                Highlight separators
            </label>
        </div>;
    }
}