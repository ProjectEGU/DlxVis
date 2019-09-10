import { DLXMatrix, DLXNode } from "./dlxmatrix";
import { CellState } from "./MatrixBlock";

/*
Rule of DLX Matrix State:
- Between states, the number of links will not change
- Between states, the order of links - arranged in accordance with its source box / direction - will preserved.
This allows dynamic update all the links in react DOM.
*/
export enum Direction {
    Left, Right, Up, Down
}
export enum DLXStepLevel {
    LowDetail, MediumDetail, HighDetail
}
/**
 *  DLX Matrix State is a list of links between different nodes.
 *  
 *  The root node is at row = -1, col = -1.
 *  The header row has row = -1.
 *  All other nodes are 0-based.
 *  
 *  Possible way to make it faster is to return a DLXMatrixState with all changes recorded,
 *  and all the little reassignments of pointers stored as delta.
 *  
 *  This can get memory consuming.
 */
export class DLXMatrixState {
    rowCount: number;
    colCount: number;

    exists: boolean[][];
    linked: boolean[][];

    links: Array<RCLink>;

    public constructor(nodes_list: DLXNode[], nRows: number, nCols: number) {
        this.links = []

        this.exists = DLXMatrix.New2dArray(nRows + 1, nCols + 1);
        this.linked = DLXMatrix.New2dArray(nRows + 1, nCols + 1);

        this.rowCount = nRows;
        this.colCount = nCols;

        nodes_list.forEach((node) => {
            this.exists[node.rowId + 1][node.colId + 1] = true;
            this.linked[node.rowId + 1][node.colId + 1] = node.IsActive;

            if (node.left) {
                this.links.push(new RCLink({
                    origRow: node.rowId,
                    origCol: node.colId,
                    destRow: node.left.rowId,
                    destCol: node.left.colId,
                    direction: Direction.Left
                }));
            }
            if (node.right) {
                this.links.push(new RCLink({
                    origRow: node.rowId,
                    origCol: node.colId,
                    destRow: node.right.rowId,
                    destCol: node.right.colId,
                    direction: Direction.Right
                }));
            }
            if (node.up) {
                this.links.push(new RCLink({
                    origRow: node.rowId,
                    origCol: node.colId,
                    destRow: node.up.rowId,
                    destCol: node.up.colId,
                    direction: Direction.Up
                }));
            }
            if (node.down) {
                this.links.push(new RCLink({
                    origRow: node.rowId,
                    origCol: node.colId,
                    destRow: node.down.rowId,
                    destCol: node.down.colId,
                    direction: Direction.Down
                }));
            }
        });

        this.ComputeOverlaps();
    }

    ComputeOverlaps() {
        this.links.forEach((link) => {
            link.overlaps = 1;
        });
    }

    public GetCellState(row: number, col: number): CellState {
        if (this.IsExisting(row, col)) {
            return this.IsActive(row, col) ? CellState.Active : CellState.Covered;
        } else {
            return CellState.Inactive;
        }
    }

    public IsActive(row: number, col: number): boolean {
        // values in the array are either undefined or true.
        // if compared to true, undefined will become false instead.
        return this.linked[row + 1][col + 1] == true;
    }

    /**
     * Returns true if the row, col in specified was 1 in the original DLX array, 
     * regardless of whether it was covered or uncovered during intermediate calculations.
     */
    public IsExisting(row: number, col: number): boolean {

        return this.exists[row + 1][col + 1] == true;
    }
}

export class RCLink {
    public origRow: number;
    public origCol: number;
    public destRow: number;
    public destCol: number;

    public overlaps: number;

    public direction: Direction;

    public get IsSelf(): boolean {
        return this.origRow == this.destRow && this.origCol == this.destCol;
    }

    /**
     * Whether or not this link is pointing in the 'opposite' direction on the grid.
     */
    public get IsOpposite(): boolean {
        switch (this.direction) {
            case Direction.Left:
                return this.destCol > this.origCol;
            case Direction.Right:
                return this.destCol < this.origCol;
            case Direction.Up:
                return this.destRow > this.origRow;
            case Direction.Down:
                return this.destRow < this.origRow;
            default:
                break;
        }
    }

    public get Distance(): number {
        return Math.max(Math.abs(this.origRow - this.destRow), Math.abs(this.origCol - this.destCol));
    }

    public constructor(params: {
        origRow: number, origCol: number, destRow: number,
        destCol: number, direction: Direction, overlaps?: number
    }) {
        this.origRow = params.origRow;
        this.origCol = params.origCol;
        this.destRow = params.destRow;
        this.destCol = params.destCol;

        this.direction = params.direction;

        this.overlaps = params.overlaps || 0;
    }
}