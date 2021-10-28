import Deferred from "../../../../../shared/Deferred";
import {CodeEditorModalProps} from "../CodeEditor";
import {useState} from "react";
import Utils from "../../../Utils";

export const editFileModal = (file: string, promise: Deferred<string | null>, type?: number) => {
    return (props: CodeEditorModalProps) => {
        const [value, setValue] = useState(file);

        function resolve(value: string | null = null) {
            promise.resolve(value);
            props.close();
        }

        Utils.useEvent('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') resolve();
            if (e.key === 'Enter') setValue(v => {
                resolve(v);
                return v;
            });

            if (e.key === 'Escape' || e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        return <div className="modal">
            <div className="title">{file ? `Renaming ${file}` : `Creating a new ${type === 1 ? 'server ' : type === 0 ? 'client ' : ''}file`}</div>
            <input type="text" autoFocus placeholder="New file name" value={value} onChange={e => setValue(e.currentTarget.value)} />
            <div className="buttons">
                <div className="button" onClick={() => resolve()}>
                    Cancel
                </div>
                <div className="button" onClick={() => resolve(value)}>
                    Confirm
                </div>
            </div>
        </div>;
    }
}