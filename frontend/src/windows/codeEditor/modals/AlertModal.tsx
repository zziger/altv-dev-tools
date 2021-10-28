import Deferred from "../../../../../shared/Deferred";
import {CodeEditorModalProps} from "../CodeEditor";
import {useState} from "react";
import Utils from "../../../Utils";

export const alertModal = (text: string) => {
    return (props: CodeEditorModalProps) => {
        Utils.useEvent('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'Enter') {
                props.close();
                e.preventDefault();
                e.stopPropagation();
            }
        });

        return <div className="modal">
            <div className="text">
                {text}
            </div>
            <div className="buttons">
                <div className="button" onClick={() => props.close()}>
                    Ok
                </div>
            </div>
        </div>;
    }
}