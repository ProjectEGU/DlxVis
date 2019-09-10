import * as React from "react";

import "./../assets/scss/MatrixBlock.scss";
import { Direction } from "./dlxmatrixstate";

export enum CellState {
    Covered,
    Active,
    Inactive
}

export interface MatrixBlockStyle {
    borderWidth?: number,
    backgroundColor?: string,
    borderColor?: string,
    dashed?: boolean,
    visible?: boolean
}

export interface MatrixBlockProps {
    posX: number,
    posY: number,
    width: number,
    height: number,
    animDurMS?: number,
    style?: MatrixBlockStyle
}

export interface MatrixBlockState {
    x: number,
    y: number,
    w: number,
    h: number,
    stylesCache: MatrixBlockStyle[]
}

export class MatrixBlock extends React.Component<MatrixBlockProps, MatrixBlockState> {
    private static arrowId: number = 0;

    static defaultProps: MatrixBlockProps = {
        posX: 0, posY: 0, width: 0, height: 0,
        style: {},
        animDurMS: 800
    }

    animRef: React.RefObject<SVGAnimateElement> = null;
    animRef2: React.RefObject<SVGAnimateElement> = null;
    constructor(props: MatrixBlockProps) {
        super(props);

        let initStyles = {
            borderWidth: props.style.borderWidth || 4,
            borderColor: props.style.borderColor || "#222222",
            backgroundColor: props.style.backgroundColor || "#eeeeee",
            dashed: props.style.dashed || false,
            visible: props.style.visible || true
        };

        this.state = {
            x: props.posX,
            y: props.posY,
            w: props.width,
            h: props.height,
            stylesCache: [initStyles, initStyles]
        }
        this.animRef = React.createRef<SVGAnimateElement>();
        this.animRef2 = React.createRef<SVGAnimateElement>();
    }
    /*
    TODO: refactor to dynamically generate <animate/> tags per style that changed.
    Need to create multiple refs to manage all those animations.
    If generic SVGAnimateElement is used, we need to restrict the anims to be only for those properties
    that got changed.
    Also, if any values not specified, the default must applied.
    1. Restrict provided values to ones that matter...? then we cannot keep the names
        - we may make a name : tag mapping with a func sometimes .. ?
        - and we keep a list of only tags that should be affect .. ?
    2. Dynamically generate <animate> tag PER MODIFIED property. how to diff ?
    */
    public render() {
        const animColorBorder =
            <animate
                attributeName="stroke"
                attributeType="XML"
                ref={this.animRef}
                from={this.state.stylesCache[0].borderColor}
                to={this.state.stylesCache[1].borderColor}
                keySplines=" 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1" keyTimes="0;0.22;0.33;0.55;0.66;0.88;1"
                calcMode="spline"
                dur={this.props.animDurMS + "ms"}
                repeatCount="1"
                fill="freeze"
            />

        const animColorBg =
            <animate
                attributeName="fill"
                attributeType="XML"
                ref={this.animRef2}
                from={this.state.stylesCache[0].backgroundColor}
                to={this.state.stylesCache[1].backgroundColor}
                keySplines=" 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1" keyTimes="0;0.22;0.33;0.55;0.66;0.88;1"
                calcMode="spline"
                dur={this.props.animDurMS + "ms"}
                repeatCount="1"
                fill="freeze"
            />

        return (
            <svg>
                <rect
                    x={this.props.posX} y={this.props.posY}
                    width={this.props.width} height={this.props.height}
                    strokeDasharray={this.props.style.dashed ? "6.2 3.8" : null}
                    stroke={this.props.style.borderColor}
                    fill={this.props.style.backgroundColor}
                    strokeWidth={this.props.style.borderWidth}
                    visibility={this.props.style.visible ? "visible" : "hidden"}
                    rx="3"
                >
                    {animColorBg}
                    {animColorBorder}
                    
                </rect>
            </svg>
        );
    }

    componentDidUpdate(prevProps: MatrixBlockProps) {
        // return if props are the exact same as before.
        if (prevProps === this.props) {
            return;
        }

        this.setState((state) => {
            // bezier points: take 1/3 and 2/3 of the way points.

            let newState = {
                x: this.props.posX,
                y: this.props.posY,
                w: this.props.width,
                h: this.props.height,
                stylesCache: [state.stylesCache[1], {
                    borderWidth: this.props.style.borderWidth || 4,
                    borderColor: this.props.style.borderColor || "#222222",
                    backgroundColor: this.props.style.backgroundColor || "#eeeeee",
                    dashed: this.props.style.dashed || false,
                    visible: this.props.style.visible || true
                }]
            };

            return newState;
        }, () => {
            this.animRef.current.beginElement();
            this.animRef2.current.beginElement();
            // setstate callback
            /*this.animRef.current.endElement();
            this.animRef.current.beginElement();
            window.setTimeout(
                () => { // window timeout callback
                    this.render();
                }, this.props.animDurMS + 20)*/
        });
    }

}

declare let module: object;


