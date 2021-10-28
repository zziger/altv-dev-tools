import {useState} from "react";
import CodeEditor from "./windows/codeEditor/CodeEditor";
import Utils from "./Utils";

export const WindowsManager = () => {
    const [codeEditor, setCodeEditor] = useState(false);
    Utils.useAltEvent('toggle', (window: string, state: boolean) => {
        switch (window) {
            case 'codeEditor':
                setCodeEditor(v => state ?? !v);
        }
    })

    return <>
        <CodeEditor active={codeEditor} />
    </>
}