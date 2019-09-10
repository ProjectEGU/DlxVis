import * as React from "react";
import { hot } from "react-hot-loader";

const reactLogo = require("./../assets/img/react_logo.svg");

import "./../assets/scss/App.scss";

import { Collapse, Button, Radio, Icon } from 'antd';

const { Panel } = Collapse; // how does this work ? how u define constant of a type equal to another type ?
import DLXDisplay from "./DlxDisplay"
import { DLXMatrix } from "./dlxmatrix"
import { DLXMatrixState } from "./dlxmatrixstate";
import { RadioChangeEvent } from "antd/lib/radio";

interface AppState {
    matrixStrings: string[],
    matrixStates: DLXMatrixState[],
    solutionSet: string[][],
    solutionText: string, // should we cache the solution text for faster access ? or is it bad code ?
    solutionTextRows: number, // todo possible hav floating buttons to hide the rows ?
    stateIdx: number,
    solvingBegan: boolean
}

class App extends React.Component<{}, AppState> {
    constructor(props: Readonly<AppState>) {
        /* if (sol.length >= 1) {
            sol.forEach(s => console.log(s.join('\n')));
         } else console.log("no sol");*/

        super(props);
        this.state = {
            matrixStrings: [],
            matrixStates: [],
            solutionSet: [],
            solutionText: "",
            solutionTextRows: 4,
            stateIdx: -1,
            solvingBegan: false
        }
        this.tryst = this.tryst.bind(this);
        // this.problemChosen = this.problemChosen.bind(this);
        this.initLatinSq2 = this.initLatinSq2.bind(this);
        this.initLatinSq3 = this.initLatinSq3.bind(this);
        this.initNQueens4 = this.initNQueens4.bind(this);
        this.nextMatState = this.nextMatState.bind(this);
        this.prevMatState = this.prevMatState.bind(this);
    }

    public render() {

        return (
            <div id="animA">
                <div id="controlS">
                    <Collapse defaultActiveKey={["1", "2", "3"]} bordered={false}>
                        <Panel header="Controls" key="1" disabled={true}>
                            <div className="controls-row" >
                                <Radio.Group>
                                <div className="controls-row" >
                                    <Radio.Button value="a" onChange={this.initLatinSq2}>Latin Sq (2x2)</Radio.Button>
                                    <Radio.Button value="b" onChange={this.initLatinSq3}>Latin Sq (3x3)</Radio.Button></div>
                                    <div className="controls-row" >
                                    <Radio.Button value="c" onChange={this.initNQueens4}>N-Queens (4x4)</Radio.Button>
                                    <Radio.Button value="d" disabled={true}>Sudoku (9x9)</Radio.Button></div>
                                </Radio.Group>
                            </div>
                            <div className="controls-row" >
                                <span className="infodisp">
                                {this.state.solvingBegan ? `${this.state.stateIdx + 1} / ${this.state.matrixStates.length}` : "0 / 0"}
                                </span>
                                <Button onClick={this.nextMatState} type="primary"
                                    disabled={!this.state.solvingBegan || this.state.stateIdx >= this.state.matrixStates.length - 1}
                                    style={{
                                        float: "right"
                                    }}>
                                    Next
                                    <Icon type="right" />
                                </Button>
                                <Button onClick={this.prevMatState} type="primary"
                                    disabled={!this.state.solvingBegan || this.state.stateIdx <= 0}
                                    style={{
                                        float: "right"
                                    }}>
                                    <Icon type="left" />
                                    Prev
                                </Button>
                            </div>
                        </Panel>

                        <Panel header="Options" key="2">

                        </Panel>
                        <Panel header="Matrix State View" key="3">
                            <textarea rows={this.state.solvingBegan ? this.state.matrixStates[this.state.stateIdx].rowCount + 2 : 5}
                                wrap="off"
                                className="matrixtextdisp"
                                placeholder={`The corresponding matrix representation \nof the DLX nodes graph will appear here.`}
                                readOnly={true}
                                value={this.state.solvingBegan ? this.state.matrixStrings[this.state.stateIdx] : ""}>
                            </textarea>
                        </Panel>
                        <Panel header="Board State View" key="4">
                            <textarea rows={16}
                                className="matrixtextdisp"
                                placeholder="The corresponding board state with the current step of the algorithm will appear here."
                                readOnly={true}
                                value={""}>
                            </textarea>
                        </Panel>

                        <Panel header="Solution Set View" key="5">
                            <textarea rows={this.state.solutionTextRows + 2}
                                className="matrixtextdisp"
                                placeholder="Up to 3 solution states will appear here."
                                readOnly={true}
                                value={this.state.solutionText}>
                            </textarea>
                        </Panel>
                    </Collapse>

                </div>
                <div id="mainS" onMouseDown={this.tryst} onMouseUp={this.tryst}
                    onMouseOver={this.tryst} onMouseOut={this.tryst}
                    onMouseMove={this.tryst}>
                    <DLXDisplay
                        state={this.state.solvingBegan ? this.state.matrixStates[this.state.stateIdx] : null}
                        stateIdx={this.state.stateIdx}
                    />
                </div>
            </div>
        );
    }

    initNQueens4(){
       this.solver(DLXMatrix.InitializeNQueens(4));
    }

    initLatinSq2() {
        this.solver(DLXMatrix.InitializeLatinSquares(2));
    }

    initLatinSq3() {
        this.solver(DLXMatrix.InitializeLatinSquares(3));
    }

    nextMatState() {
        if (this.state.stateIdx < this.state.matrixStates.length - 1) {
            this.setState((state) => {
                return { stateIdx: state.stateIdx + 1 };
            });
        }
    }

    prevMatState() {
        if (this.state.stateIdx > 0) {
            this.setState((state) => {
                return { stateIdx: state.stateIdx - 1 };
            });
        }
    }

    solver(mat: DLXMatrix) {
        const maxSolCount = 3; // maximum number of solutions to display in textbox

        let nfk = [];
        let nfs = [];
        // sol is an array of solutions. each solution is another array of strings, each string indicating the choice made.
        let sol: string[][] = mat.Solve(() => {
            let a = mat.GetMatrixState();
            let b = mat.toString();
            nfk.push(a);
            nfs.push(b);
            // console.log(b)
        });
        // todo : allow back/forward showing solutions or export solution.
        // todo : allow input custom constraint matrix, specifying optional constraints too
        let solText: string;
        let solTextRows = 0;
        if (sol.length == 0)
            solText = "No solutions found.";
        else {

            solText = `Total ${sol.length} solutions found.\n`
                + sol.slice(0, maxSolCount).map((choices) => {
                    solTextRows += choices.length;
                    return choices.join('\n');
                }
                ).join('\n-\n');
            if (sol.length > maxSolCount) {
                solText += `\n... additional ${sol.length - maxSolCount} solutions excluded.`;
            }
        }
        solTextRows += Math.min(maxSolCount, sol.length) - 1;
        this.setState((state) => {
            return {
                matrixStrings: nfs,
                matrixStates: nfk,
                solvingBegan: true,
                solutionSet: sol,
                solutionText: solText,
                solutionTextRows: solTextRows,
                stateIdx: 0
            }
        });
    }
    public tryst(evt: React.MouseEvent) {

        this.setState(state => (
            {

            }
        ));
    }
}


declare let module: object;
export default hot(module)(App);