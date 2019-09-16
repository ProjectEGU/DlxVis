import { DLXMatrixState, DLXStepLevel } from "./dlxmatrixstate";

export class DLXMatrix {
    root: DLXNode;
    all_nodes: Array<DLXNode>;
    rowNames: Array<string>;
    nRows: number;
    nCols: number;

    private constructor(root: DLXNode, all_nodes: Array<DLXNode>, rowNames: Array<string>, nRows: number, nCols: number) {
        this.root = root;
        this.all_nodes = all_nodes.slice();
        this.rowNames = rowNames.slice();
        this.nRows = nRows;
        this.nCols = nCols;
    }

    public GetRowNames() {
        return this.rowNames; // TODO - make this readonly somehow
    }

    solutionSet: Array<Array<string>> = new Array<Array<string>>();
    curSol: Array<string> = new Array<string>();

    public Solve(callback?: (level: DLXStepLevel) => void): Array<Array<string>> {
        this.solutionSet = [];
        this.curSol = [];

        this.SolveR(0, callback);

        return this.solutionSet.map(x => x.slice());
    }

    private SolveR(depth: number, callback?: (level: DLXStepLevel) => void): void {
        // If the callback is not null, then invoke it.
        (callback || ((a) => { }))(DLXStepLevel.LowDetail);

        // check if there is a column (constraint) to satisfy.
        if (this.root.right === this.root) {
            // slice deepcopies array
            this.solutionSet.push(this.curSol.slice());
            return;
        }

        // find a column (constraint) to satisfy.
        let c = DLXMatrix.GetColumn(this.root);

        // find a row which satisfies the current constraint.
        let r = c.down;

        // kill off this column since the constraint is satisfied.
        DLXMatrix.CoverColumn(c);

        while (r !== c) {
            // push a solution onto the sol stack
            this.curSol.push(this.rowNames[r.rowId]);

            // kill all columns (constraints) that would be satisfied by choosing this row.
            // this also removes any rows that satisfy the removed options.
            let d = r.right;
            while (r !== d) {
                DLXMatrix.CoverColumn(d.col);
                d = d.right;
            }

            this.SolveR(depth + 1, callback);

            // revives all columns / rows that were killed previously.
            // this must be done in the reverse order as before.
            d = r.left;
            while (r !== d) {
                DLXMatrix.UncoverColumn(d.col);
                d = d.left;
            }

            // proceed onto the next row which satisfies the current constraint.
            r = r.down;

            // pop the current solution off the sol stack
            this.curSol.pop();
        }

        // restore the column that was covered.
        DLXMatrix.UncoverColumn(c);
    }

    public toString(): string {
        // arrays are sparse in javascript.
        // out of bounds assignment will expand array up to the assigned index.
        // the assigned index will contain the assigned value. 
        // all other slots will be filled with 'undefined'.
        let map: boolean[][] = DLXMatrix.New2dArray(this.nRows, this.nCols);

        let sb: string = "";
        let padSize: number = Math.max(...this.rowNames.map(x => x.length));

        let c = this.root.right;
        while (c !== this.root) {
            let r = c.down;
            while (r !== c) {
                map[r.rowId][r.colId] = true;
                r = r.down;
            }
            c = c.right;
        }

        let rowIdx = 0;
        this.rowNames.forEach((rowName) => {
            sb += rowName.padEnd(padSize) + ": ";

            for (let colIdx = 0; colIdx < this.nCols; colIdx++) {
                sb += (map[rowIdx][colIdx] ? '1' : '0') + " ";
            }

            sb += '\n';
            rowIdx++;
        });

        console.assert(rowIdx == this.nRows);

        return sb;
    }

    public static InitializeLatinSquares(n: number): DLXMatrix {
        // Array<T> is used in favor of T[] when the length of the array in question is expected to be changed.
        let nodeList: Array<DLXNode> = [];

        let root = new DLXNode({
            rowId: -1, colId: -1, label: "root"
        });

        nodeList.push(root);

        let nRows = n * n * n;
        let nCols = n * n * 3;
        let nConstraints = 3;
        let colList = new Array(nCols);
        let rowNames = new Array(nRows);

        // Init header row
        // Assume nCols >= 1

        colList[0] = new DLXNode({
            rowId: -1, colId: 0
        });

        colList[0].up = colList[0];
        colList[0].down = colList[0];

        for (let i = 1; i < nCols; i++) {
            colList[i] = new DLXNode({
                rowId: -1, colId: i
            });
            colList[i].up = colList[i];
            colList[i].down = colList[i];

            colList[i - 1].right = colList[i];
            colList[i].left = colList[i - 1];
        }

        colList[0].left = root;
        colList[nCols - 1].right = root;
        root.right = colList[0];
        root.left = colList[nCols - 1];
        root.up = root;
        root.down = root;

        // Label header row
        for (let i = 0; i < nCols; i++) {
            colList[i].label = "Column Header " + i;
        }

        nodeList.push(...colList);
        // Populate constraint rows. p-prefix indicates position on the puzzle board itself, not the DLX matrix.

        let rowId = 0;
        for (let pColPos = 0; pColPos < n; pColPos++) {
            for (let pRowPos = 0; pRowPos < n; pRowPos++) {
                for (let pNum = 0; pNum < n; pNum++) {
                    let label = `${pNum + 1} at r${pRowPos}c${pColPos}`;
                    rowNames[rowId] = label;

                    // Generate chain of links for a single row
                    let rowNodes: DLXNode[] = new Array(nConstraints);
                    for (let i = 0; i < 3; i++) {
                        // Determine constraint group offset
                        let colId = i * n * n;
                        if (i == 0) {
                            // Number N in some row / column
                            colId += ((pColPos * n) + pRowPos);
                        } else if (i == 1) {
                            // Number N must appear in row
                            colId += ((pNum * n) + pRowPos);
                        } else if (i == 2) {
                            // Number N must appear in column
                            colId += ((pNum * n) + pColPos);
                        }

                        rowNodes[i] = new DLXNode({
                            rowId: rowId,
                            colId: colId,
                            label: label
                        });

                        rowNodes[i].up = rowNodes[i];
                        rowNodes[i].down = rowNodes[i];

                        if (i != 0) {
                            rowNodes[i - 1].right = rowNodes[i];
                            rowNodes[i].left = rowNodes[i - 1];
                        }
                    }
                    rowNodes[0].left = rowNodes[nConstraints - 1];
                    rowNodes[nConstraints - 1].right = rowNodes[0];

                    // Push this chain of links down the correct columns
                    rowNodes.forEach(node => {
                        let c = colList[node.colId];
                        let d = c.up;

                        node.up = d;
                        node.down = c;

                        c.up = node;
                        d.down = node;

                        node.col = c;

                        c.size += 1;
                    });

                    nodeList.push(...rowNodes);

                    rowId++;
                }
            }
        }
        return new DLXMatrix(root, nodeList, rowNames, nRows, nCols);
    }

    public static InitializeNQueens(n: number): DLXMatrix {

        // Array<T> is used in favor of T[] when the length of the array in question is expected to be changed.
        let nodeList: Array<DLXNode> = [];

        let root = new DLXNode({
            rowId: -1, colId: -1, label: "root"
        });

        nodeList.push(root);

        let nRows = n * n;
        let nCols = 6 * n - 2;
        let secondaryColOffset = 2 * n; // offset of where secondary column begins, inclusive.
        let nConstraints = 4;
        let colList = new Array(nCols);
        let rowNames = new Array(nRows);

        console.assert(secondaryColOffset > 0);
        console.assert(secondaryColOffset < nCols);

        // Init header row
        // Assume nCols >= 1

        colList[0] = new DLXNode({
            rowId: -1, colId: 0
        });

        colList[0].up = colList[0];
        colList[0].down = colList[0];

        for (let i = 1; i < nCols; i++) {
            colList[i] = new DLXNode({
                rowId: -1, colId: i
            });
            colList[i].up = colList[i];
            colList[i].down = colList[i];
            if (i < secondaryColOffset) {
                colList[i - 1].right = colList[i];
                colList[i].left = colList[i - 1];
            } else {
                colList[i].left = colList[i];
                colList[i].right = colList[i];
            }
        }

        colList[0].left = root;
        colList[secondaryColOffset - 1].right = root;
        root.right = colList[0];
        root.left = colList[secondaryColOffset - 1];
        root.up = root;
        root.down = root;

        // Label header row
        for (let i = 0; i < nCols; i++) {
            colList[i].label = "Column Header " + i + (i < secondaryColOffset ? " (primary)" : " (secondary)");
        }

        nodeList.push(...colList);
        // Populate constraint rows. p-prefix indicates position on the puzzle board itself, not the DLX matrix.

        let rowId = 0;
        for (let pColPos = 0; pColPos < n; pColPos++) {
            for (let pRowPos = 0; pRowPos < n; pRowPos++) {
                let label = `Q at r${pRowPos}c${pColPos}`;
                rowNames[rowId] = label;

                // Generate chain of links for a single row
                let rowNodes: DLXNode[] = new Array(nConstraints);
                for (let i = 0; i < nConstraints; i++) {
                    // Determine constraint group offset
                    let colId = 0;
                    if (i == 0) {
                        // Queen placed in row N
                        colId = pRowPos;
                        //colId = 5;
                    } else if (i == 1) {
                        // Queen placed in col N
                        colId = n + pColPos;
                        //colId = 6;
                    } else if (i == 2) {
                        // Queen placed in d1
                        colId = 2 * n + (n - 1 - pRowPos) + pColPos;
                        //colId = 7;
                    } else if (i == 3) {
                        // Queen placed in d2
                        colId = 2 * n + (2 * n - 1) + pRowPos + pColPos;
                        //colId = 15;
                    }

                    rowNodes[i] = new DLXNode({
                        rowId: rowId,
                        colId: colId,
                        label: label
                    });

                    rowNodes[i].up = rowNodes[i];
                    rowNodes[i].down = rowNodes[i];

                    if (i != 0) {
                        rowNodes[i - 1].right = rowNodes[i];
                        rowNodes[i].left = rowNodes[i - 1];
                    }
                }
                rowNodes[0].left = rowNodes[nConstraints - 1];
                rowNodes[nConstraints - 1].right = rowNodes[0];

                // Push this chain of links down the correct columns
                rowNodes.forEach(node => {
                    let c = colList[node.colId];
                    let d = c.up;

                    node.up = d;
                    node.down = c;

                    c.up = node;
                    d.down = node;

                    node.col = c;

                    c.size += 1;
                });

                nodeList.push(...rowNodes);

                rowId++;
            }
        }
        return new DLXMatrix(root, nodeList, rowNames, nRows, nCols);
    }

    /**
     * Generate a list of horizontally linked nodes.
     * For example: GenerateLinkChain(4) produces:
     * ... <- a <-> b <-> c <-> d -> ...
     * These 4 elements are linked together in terms of left/right pointers.
     * Their up/down pointers may be SELF or NONE.
     * NOT IMPLEMENTED: reason is due to undecided labelling issue.
     * Possible solution: allow providing array of labels, or a callbackFn with index passed in and returns a label? 
     * If none provided, all label can be null / blank.
     */
    private static GenerateLinkChain(count: number): DLXNode[] {
        return null;
    }

    public GetMatrixState(): DLXMatrixState {
        // do certain elements need to be fully slicecopied?
        return new DLXMatrixState(this.all_nodes, this.nRows, this.nCols);
    }

    private static CoverColumn(c: DLXNode): void {
        c.right.left = c.left;
        c.left.right = c.right;

        c.IsActive = false;

        let r = c.down;
        while (r !== c) {
            r.IsActive = false;
            let d = r.right;
            while (r !== d) {
                d.up.down = d.down;
                d.down.up = d.up;
                d.col.size -= 1;
                d.IsActive = false;
                d = d.right;
            }
            r = r.down;
        }
    }

    private static UncoverColumn(c: DLXNode): void {
        c.right.left = c;
        c.left.right = c;

        c.IsActive = true;

        let r = c.up;
        while (r !== c) {
            r.IsActive = true;
            let d = r.left;
            while (r !== d) {
                d.up.down = d;
                d.down.up = d;
                d.col.size += 1;
                d.IsActive = true;
                d = d.left;
            }
            r = r.up;
        }
    }

    private static GetColumn(root: DLXNode): DLXNode {
        console.assert(root.right !== root, "GetColumn called on empty header");

        let c = root.right;
        let m = c;

        let size = -1;

        while (c !== root) {
            if (c.size < size || size == -1) {
                size = c.size;
                m = c;
            }

            c = c.right;
        }
        return m;
    }

    public static New2dArray(dim1size: number, dim2size: number): any[][] {
        let output = [];
        for (let i = 0; i < dim1size; i++) {
            //only need to push new Array() without specifying size.
            //this is because of the boundless array access leniency property.
            output.push(new Array(dim2size));
        }
        return output;
    }
}

export class DLXNode {
    public IsActive: boolean;

    public up: DLXNode;
    public down: DLXNode;
    public left: DLXNode;
    public right: DLXNode;

    public col: DLXNode;

    public label: string;
    public rowId: number;
    public colId: number;

    private _size: number;

    public get size(): number {
        if (this.rowId != -1 || this.colId == -1) {
            throw "Only header nodes have sizes."
        }
        return this._size;
    }

    public set size(value: number) {
        this._size = value;
    }

    constructor(params: { rowId, colId, label?}) {
        this.rowId = params.rowId;
        this.colId = params.colId;
        this.label = params.label || "";
        this.up = null;
        this.down = null;
        this.left = null;
        this.right = null;

        this.size = 0;
        this.IsActive = true;
    }
}

