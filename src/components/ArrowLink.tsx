import * as React from "react";

import "./../assets/scss/ArrowLink.scss";
import { Direction } from "./dlxmatrixstate";
import { TweenMax } from "gsap/TweenMax";

interface Anim {
    endTime: number,
    durationMS: number,
    animValues: string[],
}

interface ArrowProps {
    origX: number,
    origY: number,
    destX: number,
    destY: number,
    direction: Direction,
    curveRatio?: number,
    curveDist?: number,
    animDurMS?: number,
    isAnim?: boolean,
    visible?: boolean,
    arrowWidth?: number,
    arrowHeight?: number,
    arrowColor?: string,
    lineColor?: string,
    lineWidth?: number
    doAnimation?: boolean
}

interface ArrowState {
    curAnim: Anim,
    curId: number
}

export default class ArrowLink extends React.Component<ArrowProps, ArrowState> {
    private static arrowId: number = 0;

    static defaultProps: ArrowProps = {
        origX: 0, origY: 0, destX: 0, destY: 0,
        animDurMS: 500,
        isAnim: true,
        direction: null,
        curveRatio: 0.541,
        curveDist: 15,
        visible: true,
        arrowWidth: 4,
        arrowHeight: 4,
        arrowColor: "#030852",
        lineColor: "#030852", //todo animate arrow/line color changes and even arrow/line size changes.
        lineWidth: 2,
        doAnimation: true
    }

    svgRef: React.RefObject<SVGPathElement> = null;
    animRef: React.RefObject<SVGAnimateElement> = null;
    constructor(props: ArrowProps) {
        super(props);
        let thisD = this.new_d();
        this.state = {
            curAnim: {
                endTime: 0, durationMS: 0, animValues: [thisD, thisD],
            },
            curId: ArrowLink.arrowId++
        }
        this.svgRef = React.createRef<SVGPathElement>();
        this.animRef = React.createRef<SVGAnimateElement>();
    }

    public render() {
        const animMotion = (
            <animate
                attributeName="d"
                attributeType="XML"
                ref={this.animRef}
                from={this.state.curAnim.animValues[0]}
                to={this.state.curAnim.animValues[1]}
                keySplines=" 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1; 0.1 0.8 0.2 1" keyTimes="0;0.22;0.33;0.55;0.66;0.88;1"
                calcMode="spline"
                dur={this.state.curAnim.durationMS + "ms"}
                repeatCount="1"
                fill="freeze"
            />
        );
        return (

            <svg >
                <marker id={"pointer-" + this.state.curId} viewBox="0 0 50 50" refX="50" refY="25"
                    markerWidth={this.props.arrowWidth} markerHeight={this.props.arrowHeight} orient="auto">
                    <path d="M 0 0 L 19 25 L 0 50 L 50 25 z " stroke={this.props.arrowColor} fill={this.props.arrowColor} />
                </marker>
                <path
                    d={this.state.curAnim.animValues[1]}
                    stroke={this.props.lineColor} fill="none"
                    strokeWidth={this.props.lineWidth}
                    markerEnd={"url(#pointer-" + this.state.curId + ")"}
                    visibility={this.props.visible ? "visible" : "hidden"}
                    ref={this.svgRef}
                    id={'arrow' + this.state.curId}
                >
                    {/*animMotion*/}
                </path>
            </svg>
        );
    }

    /**
     * Returns an array of points divided evenly along the line formed by orig and dest. The endpoints are included.
     * @param nDivs Number of points to place.
     */
    static MorphPts(origX: number, origY: number, destX: number, destY: number, nDivs: number): { x: number, y: number }[] {
        let output: { x: number, y: number }[] = []
        for (let i: number = 0; i <= nDivs - 1; i++) {
            let ratio = i / (nDivs - 1);
            output.push({
                x: origX + (destX - origX) * ratio,
                y: origY + (destY - origY) * ratio
            });
        }
        return output;
    }

    /**
     * Return the point that is partway between two points. Ratio specifies how far along the way to go (0 to 1).
     */
    static GetPointBetween(origX: number, origY: number, destX: number, destY: number, ratio: number): { x: number, y: number } {
        return {
            x: origX + (destX - origX) * ratio,
            y: origY + (destY - origY) * ratio
        };
    }

    private new_d(): string {
        let ptA = ArrowLink.GetPointBetween(this.props.origX, this.props.origY, this.props.destX, this.props.destY, this.props.curveRatio);
        let ptB = ArrowLink.GetPointBetween(this.props.origX, this.props.origY, this.props.destX, this.props.destY, 1 - this.props.curveRatio);
        switch (this.props.direction) {
            case Direction.Left:
                ptA.y -= this.props.curveDist;
                ptB.y -= this.props.curveDist;
                break;
            case Direction.Right:
                ptA.y += this.props.curveDist;
                ptB.y += this.props.curveDist;
                break;
            case Direction.Up:
                ptA.x -= this.props.curveDist;
                ptB.x -= this.props.curveDist;
                break;
            case Direction.Down:
                ptA.x += this.props.curveDist;
                ptB.x += this.props.curveDist;
                break;
            default:
                break;
        }
        let bezPts: string = [ptA.x, ptA.y, ptB.x, ptB.y].map(x => Math.round(x)).join(" ");
        return " \
                M " + Math.round(this.props.origX) + " " + Math.round(this.props.origY) + " \
                C "+ bezPts + "\
                " + Math.round(this.props.destX) + " " + Math.round(this.props.destY);
    }

    componentDidUpdate(prevProps: ArrowProps) {
        // return if coords are the exact same as before.
        if (prevProps.origX == this.props.origX
            && prevProps.origY == this.props.origY
            && prevProps.destX == this.props.destX
            && prevProps.destY == this.props.destY) {
            return;
        }

        /*// previous if statement for insta return condition:
        prevProps.origX == this.props.origX
                    && prevProps.origY == this.props.origY
                    && prevProps.destX == this.props.destX
                    && prevProps.destY == this.props.destY*/

        this.setState((state) => {
            // bezier points: take 1/3 and 2/3 of the way points.

            let amV: string[] = [
                state.curAnim.animValues[1],
                this.new_d()
            ]

            let newState = {
                curAnim: {
                    endTime: Date.now() + this.props.animDurMS,
                    durationMS: this.props.animDurMS,
                    animValues: amV
                }
            }

            return newState;
        }, () => { // setstate callback
            //this.animRef.current.endElement();

            // this.animRef.current.beginElement();
            TweenMax.to(this.svgRef.current, this.props.animDurMS / 1000, {
                startAt:
                {
                    attr: {
                        d: this.state.curAnim.animValues[0]
                    }
                },
                attr: {
                    d: this.state.curAnim.animValues[1]
                },
                ease: "Power2.easeOut"
            });
        });
    }

}

declare let module: object;


