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
    children: (startMove: (e: React.MouseEvent) => void, dragging: boolean) => JSX.Element;
    name: string;
    visible?: boolean;
    bgColor?: string;
    fgColor?: string;
    opacity: number;
}

interface ResizableWindowState {
    windowSize: WindowSize;
    dragging: boolean;
}

export class ResizableWindow extends React.Component<ResizableWindowProps, ResizableWindowState> {
    private _windowRef = React.createRef<HTMLDivElement>();
    state: ResizableWindowState = {
        windowSize: {
            x: 0,
            y: 0,
            width: 500,
            height: 500,
        },
        dragging: false
    }

    private startWindowSize?: WindowSize;
    private startCursorPos?: Vector2;
    private lastWindowSize?: WindowSize;

    async componentDidMount() {
        this.setState({
            windowSize: (await ClientMethods.get(`windows:${this.props.name}:size`)) ?? {
                x: 0,
                y: 0,
                width: 700,
                height: 500
            }
        });
    }

    private save = () => {
        ClientMethods.save(`windows:${this.props.name}:size`, this.state.windowSize)
    };

    // region Resize
    private resize: { horizontal?: boolean; vertical?: boolean } | undefined;

    startResize(cursor: Vector2, horizontal?: boolean, vertical?: boolean) {
        this.startCursorPos = cursor;
        this.startWindowSize = this.state.windowSize;
        this.resize = {horizontal, vertical};
        this.lastWindowSize = this.state.windowSize;
        document.addEventListener('mousemove', this.processResize);
        document.addEventListener('mouseup', this.stopResize);
        this.setState({ dragging: true });
    }

    stopResize = () => {
        if (this.lastWindowSize) this.setState({ windowSize: this.lastWindowSize })
        this.lastWindowSize = undefined;
        this.startWindowSize = undefined;
        this.startCursorPos = undefined;
        this.resize = undefined;
        document.removeEventListener('mousemove', this.processResize);
        document.removeEventListener('mouseup', this.stopResize);
        this.save();
        this.setState({ dragging: false });
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

        newSize.width = Utils.clamp(newSize.width, 400, 10000);
        newSize.height = Utils.clamp(newSize.height, 300, 10000);

        this.lastWindowSize = newSize;
        const el = this._windowRef.current;

        if (!el) return;
        el.style.height = newSize.height + 'px';
        el.style.width = newSize.width + 'px';
        el.style.top = newSize.y + 'px';
        el.style.left = newSize.x + 'px';
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
        this.move = false;
        if (this.lastWindowSize) this.setState({ windowSize: this.lastWindowSize })
        this.lastWindowSize = undefined;
        this.startCursorPos = undefined;
        document.removeEventListener('mousemove', this.processMove);
        document.removeEventListener('mouseup', this.stopMove);
        this.save();
    };

    processMove = (cursor: MouseEvent) => {
        if (!this.move) return;
        const newSize = Utils.jsonClone(this.startWindowSize)!;
        const deltaX = cursor.clientX - this.startCursorPos!.x;
        const deltaY = cursor.clientY - this.startCursorPos!.y;

        newSize.x += deltaX;
        newSize.y += deltaY;

        this.lastWindowSize = newSize;
        const el = this._windowRef.current;

        if (!el) return;
        el.style.height = newSize.height + 'px';
        el.style.width = newSize.width + 'px';
        el.style.top = newSize.y + 'px';
        el.style.left = newSize.x + 'px';
    };

    // endregion

    render() {
        return (
            <div className={"window " + this.props.name} style={{
                top: this.state.windowSize.y,
                left: this.state.windowSize.x,
                width: this.state.windowSize.width,
                height: this.state.windowSize.height,
                '--bg': Utils.hexToRgb(this.props.bgColor ?? '2d2d2d')!.join(', '),
                '--fg': Utils.hexToRgb(this.props.fgColor ?? 'ffffff')!.join(', '),
                display: this.props.visible === false ? 'none' : 'grid',
                opacity: this.props.opacity ?? 1
            } as any} ref={this._windowRef}>
                <div className="corner left" onMouseDown={this.getResize(false, false)}/>
                <div className="edge horizontal" onMouseDown={this.getResize(undefined, false)}/>
                <div className="corner right" onMouseDown={this.getResize(true, false)}/>
                <div className="edge vertical" onMouseDown={this.getResize(false, undefined)}/>
                <div className="content">
                    {this.props.children((e: React.MouseEvent) => e.target == e.currentTarget && this.startMove({
                        x: e.clientX,
                        y: e.clientY
                    }), this.state.dragging)}
                </div>
                <div className="edge vertical" onMouseDown={this.getResize(true, undefined)}/>
                <div className="corner right" onMouseDown={this.getResize(false, true)}/>
                <div className="edge horizontal" onMouseDown={this.getResize(undefined, true)}/>
                <div className="corner left" onMouseDown={this.getResize(true, true)}/>
            </div>
        );
    }
}
