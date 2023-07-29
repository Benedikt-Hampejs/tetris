 export default class Block {
    squares: Square[] = [];

    constructor(color: string, ...squareCoordinate: {x: number, y: number}[] ) {
            const squares = squareCoordinate.map((coordinate) => ({color: color, x: coordinate.x, y: coordinate.y}));
            this.squares.push(...squares);
    }
}
