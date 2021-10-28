import Deferred from "../../../../../shared/Deferred";
import {CodeEditorModalProps} from "../CodeEditor";
import {useState} from "react";
import Utils from "../../../Utils";

export const questionModal = (text: string, promise: Deferred<boolean>) => {
    return (props: CodeEditorModalProps) => {
        function resolve(value: boolean) {
            promise.resolve(value);
            props.close();
        }

        Utils.useEvent('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') resolve(false);
            if (e.key === 'Enter') resolve(true);
            if (e.key === 'Escape' || e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        return <div className="modal">
            {text}
            <div className="buttons">
                <div className="button" onClick={() => resolve(false)}>
                    No
                </div>
                <div className="button" onClick={() => resolve(true)}>
                    Yes
                </div>
            </div>
        </div>;
    }
}