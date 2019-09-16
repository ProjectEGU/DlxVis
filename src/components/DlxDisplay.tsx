import * as React from "react";

import "./../assets/scss/DlxDisplay.scss";
import { MatrixBlock, CellState, MatrixBlockStyle } from "./MatrixBlock"
import ArrowLink from "./ArrowLink"
import { DLXMatrixState, Direction } from "./dlxmatrixstate";

interface DLXProps {
    state?: DLXMatrixState
    stateIdx?: number // use for refreshing elements ...
}

interface DLXState {
    x: number,
    y: number,
    prevX: number,
    prevY: number,
    svgViewbox: string
}

export default class DLXDisplay extends React.Component<DLXProps, DLXState> {
    static defaultProps: DLXProps = {

    }

    svgRef: React.RefObject<SVGSVGElement> = null;
    animRef: React.RefObject<SVGAnimateElement> = null;
    constructor(props: DLXProps) {
        super(props);
        this.state = {
            x: 0, y: 0, prevX: 0, prevY: 0,
            svgViewbox: "0 0 1000 1000"
        }
        this.tryst = this.tryst.bind(this);
        this.updateSVGDimensions = this.updateSVGDimensions.bind(this);
        this.calcSvgViewbox = this.calcSvgViewbox.bind(this);
        this.svgRef = React.createRef<SVGSVGElement>();
        this.animRef = React.createRef<SVGAnimateElement>();

        this.cellStyles[CellState.Active] = {
            borderWidth: 2,
            borderColor: "#10239e",
            backgroundColor: "#2f54eb",
            dashed: false,
            visible: true
        };
        this.cellStyles[CellState.Covered] = {
            borderWidth: 3,
            borderColor: "#85a5ff",
            backgroundColor: "#adc6ff",
            dashed: false,
            visible: true
        };
        this.cellStyles[CellState.Inactive] = {
            borderWidth: 3,
            borderColor: "#d6e4ff",
            backgroundColor: "#f0f5ff",
            dashed: true,
            visible: true
        };
        //todo: put this as part of the MatrixBlock component. then, pass cellstate directly to the component.
        //reasoning: MatrixBlock component should decide the style, while DlxDisplay decides the logic.
    }
    renderArrow(keyIncrementor: { key: number },
        origX: number, origY: number, destX: number, destY: number,
        direction: Direction, overlaps: any, visible: boolean) {

        return <ArrowLink
            key={keyIncrementor.key++}
            origX={origX} origY={origY}
            destX={destX} destY={destY}
            direction={direction}
            visible={visible}
        />
    }

    cellStyles: MatrixBlockStyle[] = []
    renderCell(keyIncrementor: { key: number }, state: CellState, cellSize: number, row: number, col: number) {
        let cellX = this.bX + (cellSize + this.cellPadX) * col;
        let cellY = this.bY + (cellSize + this.cellPadY) * row;

        return <MatrixBlock key={keyIncrementor.key++}
            posX={cellX} posY={cellY} width={cellSize} height={cellSize}
            style={this.cellStyles[state]}
        />
    }

    bX = 0;
    bY = 0;
    bWidth = 980;
    bHeight = 980;
    cellOffsetX = 5;
    cellOffsetY = 5;
    cellPadX = 20;
    cellPadY = 20;
    arrowOffset = 20;
    cellSize = 0;
    public render() {
        let curveDist: number = 15; //this.state.x;
        let curveRatio: number = 0.541; //this.state.y/1000;

        let elems = []

        if (this.props.state) {
            let key = { key: 0 };
            // this key incrementor is passed to each of the render functions.
            // the render function will increment the key and use it accordingly.
            // the resulting incremented key can be used in subsequent calls.


            let matrixState: DLXMatrixState = this.props.state;

            let nRows = matrixState.rowCount;
            let nCols = matrixState.colCount;

            this.cellSize = Math.min(this.bWidth / (nCols + 1) - this.cellPadX, this.bHeight / (nRows + 1) - this.cellPadY);
            this.arrowOffset = 0.31 * this.cellSize;
            // todo refactor these variables to props or something
            this.bX = 20 + this.cellSize + this.cellPadX;
            this.bY = 20 + this.cellSize + this.cellPadY;

            // Draw cells
            // Draw header row
            elems.push(this.renderCell(key, CellState.Active, this.cellSize, -1, -1));
            for (let i = 0; i < nCols; i++) {
                if (matrixState.IsExisting(-1, i)) {
                    elems.push(this.renderCell(key, matrixState.GetCellState(-1, i), this.cellSize, -1, i));
                }
            }

            // Draw other cells
            for (let r = 0; r < nRows; r++) {
                for (let c = 0; c < nCols; c++) {
                    elems.push(this.renderCell(key, matrixState.GetCellState(r, c), this.cellSize, r, c));
                }
            }

            this.props.state.links.forEach((link) => {
                //if(link.origRow > -1 || link.origCol > 1) return;

                let visible = !(link.IsOpposite );//!(link.IsOpposite || link.IsSelf);
                /* let visible =
                     link.origRow == -1 && link.origCol == 1
                     && !(link.IsOpposite || link.IsSelf)
                     && link.direction == Direction.Left
                     ;*/

                let srcCellX = this.bX + (this.cellSize + this.cellPadX) * link.origCol;
                let srcCellY = this.bY + (this.cellSize + this.cellPadY) * link.origRow;
                let dstCellX = this.bX + (this.cellSize + this.cellPadX) * link.destCol;
                let dstCellY = this.bY + (this.cellSize + this.cellPadY) * link.destRow;
                //if (visible) console.log(`srcX ${srcCellX} srcY ${srcCellY + this.arrowOffset} dstX ${dstCellX + this.cellSize} dstY ${dstCellY + this.arrowOffset}`);
                //if (visible) console.log(`${key.key} srcR ${link.origRow} srcC ${link.origCol} dstR ${link.destRow} dstC ${link.destCol}`);
                // todo - refactor those src/dst params into an object param which can have labels in syntax.
                switch (link.direction) {
                    case Direction.Left:
                        elems.push(this.renderArrow(key,
                            srcCellX,
                            srcCellY + this.arrowOffset,
                            dstCellX + this.cellSize,
                            dstCellY + this.arrowOffset,
                            Direction.Left,
                            link.overlaps,
                            visible
                        ));
                        break;
                    case Direction.Right:
                        elems.push(this.renderArrow(key,
                            srcCellX + this.cellSize,
                            srcCellY + this.cellSize - this.arrowOffset,
                            dstCellX,
                            dstCellY + this.cellSize - this.arrowOffset,
                            Direction.Right,
                            link.overlaps,
                            visible
                        ));
                        break;
                    case Direction.Up:
                        elems.push(this.renderArrow(key,
                            srcCellX + this.arrowOffset,
                            srcCellY,
                            dstCellX + this.arrowOffset,
                            dstCellY + this.cellSize,
                            Direction.Up,
                            link.overlaps,
                            visible
                        ));
                        break;
                    case Direction.Down:
                        elems.push(this.renderArrow(key,
                            srcCellX + this.cellSize - this.arrowOffset,
                            srcCellY + this.cellSize,
                            dstCellX + this.cellSize - this.arrowOffset,
                            dstCellY,
                            Direction.Down,
                            link.overlaps,
                            visible
                        ));
                        break;
                    default:
                        break;
                }
            });
        }

        //<rect x="20" y="20" width="960" height="960" stroke="black" strokeWidth="5" fill="none" opacity="0.25"></rect>
        return (
            <svg style={{
                width: "100%",
                height: "100%",
                //maxWidth:"500px",
                position: "relative"
            }} ref={this.svgRef} id="maincanvas" onMouseMove={this.tryst} onMouseDown={this.tryst}
                viewBox={this.calcSvgViewbox()}
                preserveAspectRatio="xMinYMin slice"
            >

                {elems}

            </svg>
        );
    }
    calcSvgViewbox() {
        let svgViewbox = `0 0 1000 1000`; // todo - resize according to the graph's proportion.
        if (this.props.state) {
            let svgE: SVGSVGElement = this.svgRef.current;

            let cw = this.bX + (this.cellSize + this.cellPadX) * this.props.state.colCount;
            let ch = this.bY + (this.cellSize + this.cellPadY) * this.props.state.rowCount;

            let sw = svgE.clientWidth;
            let sh = svgE.clientHeight;

            console.log(`svgMaxW: ${cw} svgMaxH: ${ch}`);
            console.log(`svgWidth: ${sw} svgHeight: ${sh}`);

            let A = cw / ch;
            let B = sw / sh;

            // let ratio = sw > sh ? B : A/B;

            let ratio = Math.min(sw, sh) / Math.max(sw, sh);

            svgViewbox = `0 0 ${1000 / ratio} ${1000 / ratio}`;
        }
        return svgViewbox;
    }
    updateSVGDimensions() {
        this.setState({ svgViewbox: this.calcSvgViewbox() });
    }

    componentWillMount() {
        window.addEventListener("resize", this.updateSVGDimensions);
    }
    componentDidMount() {
        this.updateSVGDimensions();
    }
    shouldComponentUpdate(nextProps: Readonly<DLXProps>, nextState: Readonly<DLXState>) {
        return nextProps.state != this.props.state || nextState.svgViewbox != this.state.svgViewbox;
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updateSVGDimensions);
    }

    public tryst(evt: React.MouseEvent) {

        let t = evt.type;

        let svgE: SVGSVGElement = this.svgRef.current;
        let pt = svgE.createSVGPoint();
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        pt = pt.matrixTransform(svgE.getScreenCTM().inverse());
        let newX = Math.round(pt.x);
        let newY = Math.round(pt.y);
        // console.log(newX + " " + newY);
        if (t == "mousemove") {
            evt.stopPropagation();

            this.setState((state) => {
                let newState = {
                    x: newX,
                    y: newY,
                    prevX: state.x,
                    prevY: state.y
                }

                return newState;
            });
        }
    }

}
/**
//test items showing arrow directions:
        let curveDist:number = 15; //this.state.x;
        let curveRatio:number = 0.541;//this.state.y/1000;
<ArrowLink origX={50} destX={200} origY={50} destY={50}
                    arrowColor="#030852" lineColor="#030852"
                    arrowHeight={6}
                    arrowWidth={6}
                    lineWidth={2}
                    visible={true}
                    direction={Direction.Right}
                    curveDist={curveDist}
                    curveRatio={curveRatio}
                    />
                <ArrowLink origX={400} destX={250} origY={80} destY={80}
                    arrowColor="#030852" lineColor="#030852"
                    arrowHeight={6}
                    arrowWidth={6}
                    lineWidth={2}
                    visible={true}
                    direction={Direction.Left}
                    curveDist={curveDist}
                    curveRatio={curveRatio}/>
                <ArrowLink origX={450} destX={450} origY={200} destY={50}
                    arrowColor="#030852" lineColor="#030852"
                    arrowHeight={6}
                    arrowWidth={6}
                    lineWidth={2}
                    direction={Direction.Up}
                    visible={true}
                    curveDist={curveDist}
                    curveRatio={curveRatio} />
                <ArrowLink origX={680} destX={680} origY={50} destY={200}
                    arrowColor="#030852" lineColor="#030852"
                    arrowHeight={6}
                    arrowWidth={6}
                    lineWidth={2}
                    direction={Direction.Down}
                    visible={true}
                    curveDist={curveDist}
                    curveRatio={curveRatio} />

                <ArrowLink origX={50} destX={200} origY={450} destY={450}
                    arrowColor="#030852" lineColor="#030852"
                    arrowHeight={6}
                    arrowWidth={6}
                    lineWidth={2}
                    direction={Direction.Left}
                    visible={true}
                    curveDist={curveDist}
                    curveRatio={curveRatio}/>
                <ArrowLink origX={400} destX={250} origY={480} destY={480}
                    arrowColor="#030852" lineColor="#030852"
                    arrowHeight={6}
                    arrowWidth={6}
                    lineWidth={2}
                    direction={Direction.Right}
                    visible={true}
                    curveDist={curveDist}
                    curveRatio={curveRatio}/>
                <ArrowLink origX={450} destX={450} origY={600} destY={450}
                    arrowColor="#030852" lineColor="#030852"
                    arrowHeight={6}
                    arrowWidth={6}
                    lineWidth={2}
                    direction={Direction.Down}
                    visible={true}
                    curveDist={curveDist}
                    curveRatio={curveRatio}/>
                <ArrowLink origX={680} destX={680} origY={450} destY={600}
                    arrowColor="#030852" lineColor="#030852"
                    arrowHeight={6}
                    arrowWidth={6}
                    lineWidth={2}
                    direction={Direction.Up}
                    visible={true}
                    curveDist={curveDist}
                    curveRatio={curveRatio}/>
 */