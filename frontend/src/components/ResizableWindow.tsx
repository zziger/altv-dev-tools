import React from "react";
import Utils from "../Utils";
import ClientMethods from "../ClientMethods";

export interface Vector2 {
    x: number;
    y: number;
}

export interface WindowSize extends Vector2 {
    width: number;
    height: number;
}

interface ResizableWindowProps {
    children: (startMove: (e: React.MouseEvent) => void) => JSX.Element;
    name: string;
}

interface ResizableWindowState {
    windowSize: WindowSize;
}

export class ResizableWindow extends React.Component<ResizableWindowProps, ResizableWindowState> {
    state: ResizableWindowState = {
        windowSize: {
            x: 0,
            y: 0,
            width: 500,
            height: 500,
        }
    }

    private startWindowSize?: WindowSize;
    private startCursorPos?: Vector2;

    async componentDidMount() {
        this.setState({
            windowSize: (await ClientMethods.get(`windows:${this.props.name}:size`)) ?? {
                x: 0,
                y: 0,
                width: 500,
                height: 500
            }
        });
    }

    private save = Utils.debounce(async () => {
        await ClientMethods.save(`windows:${this.props.name}:size`, this.state.windowSize);
    }, 1000);

    // region Resize
    private resize: { horizontal?: boolean; vertical?: boolean } | undefined;

    startResize(cursor: Vector2, horizontal?: boolean, vertical?: boolean) {
        this.startCursorPos = cursor;
        this.startWindowSize = this.state.windowSize;
        this.resize = {horizontal, vertical};
        document.addEventListener('mousemove', this.processResize);
        document.addEventListener('mouseup', this.stopResize);
    }

    stopResize = () => {
        this.startWindowSize = undefined;
        this.startCursorPos = undefined;
        this.resize = undefined;
        document.removeEventListener('mousemove', this.processResize);
        document.removeEventListener('mouseup', this.stopResize);
    };

    processResize = (e: MouseEvent) => {
        if (!this.resize) return;
        const newSize = Utils.jsonClone(this.startWindowSize)!;
        const deltaX = e.clientX - this.startCursorPos!.x;
        const deltaY = this.startCursorPos!.y - e.clientY;

        if (this.resize.horizontal != null) {
            if (this.resize.horizontal) {
                newSize.width += deltaX;
            } else {
                newSize.x += deltaX;
                newSize.width -= deltaX;
            }
        }

        if (this.resize.vertical != null) {
            if (this.resize.vertical) {
                newSize.height -= deltaY;
            } else {
                newSize.y -= deltaY;
                newSize.height += deltaY;
            }
        }
        this.setState({windowSize: newSize}, this.save)
    };

    getResize(horizontal?: boolean, vertical?: boolean) {
        return (e: React.MouseEvent) => {
            return this.startResize({x: e.clientX, y: e.clientY}, horizontal, vertical);
        }
    }

    // endregion

    // region Move
    private move: boolean = false;

    startMove(cursor: Vector2) {
        this.move = true;
        this.startWindowSize = this.state.windowSize;
        this.startCursorPos = cursor;
        document.addEventListener('mousemove', this.processMove);
        document.addEventListener('mouseup', this.stopMove);
    }

    stopMove = () => {
        document.removeEventListener('mousemove', this.processMove);
        document.removeEventListener('mouseup', this.stopMove);
    };

    processMove = (cursor: MouseEvent) => {
        if (!this.move) return;
        const newSize = Utils.jsonClone(this.startWindowSize)!;
        const deltaX = cursor.clientX - this.startCursorPos!.x;
        const deltaY = cursor.clientY - this.startCursorPos!.y;

        newSize.x += deltaX;
        newSize.y += deltaY;

        this.setState({windowSize: newSize}, this.save)
    };

    // endregion

    render() {
        return (
            <div className={"window " + this.props.name} style={{
                top: this.state.windowSize.y,
                left: this.state.windowSize.x,
                width: this.state.windowSize.width,
                height: this.state.windowSize.height
            }}>
                <div className="corner left" onMouseDown={this.getResize(false, false)}/>
                <div className="edge horizontal" onMouseDown={this.getResize(undefined, false)}/>
                <div className="corner right" onMouseDown={this.getResize(true, false)}/>
                <div className="edge vertical" onMouseDown={this.getResize(false, undefined)}/>
                <div className="content">
                    {this.props.children((e: React.MouseEvent) => e.target == e.currentTarget && this.startMove({
                        x: e.clientX,
                        y: e.clientY
                    }))}
                </div>
                <div className="edge vertical" onMouseDown={this.getResize(true, undefined)}/>
                <div className="corner right" onMouseDown={this.getResize(false, true)}/>
                <div className="edge horizontal" onMouseDown={this.getResize(undefined, true)}/>
                <div className="corner left" onMouseDown={this.getResize(true, true)}/>
            </div>
        );
    }
}
