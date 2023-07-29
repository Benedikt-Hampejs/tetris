import Block from './Block';

const canvas = document.querySelector("#canvas") as HTMLCanvasElement;
const context = canvas.getContext("2d");
const STONE_SIZE = 50;
const CANVAS_HEIGHT = 800;
const CANVAS_WIDTH = 500;
const lINE_WIDTH = 4;
var y = -STONE_SIZE
var x = STONE_SIZE
var gameOver = false;
let interfallTimer = 300;

let stones: Block = new Block('');
let droppingStone: Block = new Block('');
canvas.height = CANVAS_HEIGHT + lINE_WIDTH;
canvas.width = CANVAS_WIDTH + lINE_WIDTH;
var rowScore = 0;
let reDrawNeeded = false;

function increaseRowScore(addRowsCount: number) {
    rowScore += addRowsCount;
    const rowScoreLabel = document.querySelector('#rowScore');
    if(rowScoreLabel) {
        rowScoreLabel.innerHTML = rowScore.toString();
    }
    console.log('test');
    interfallTimer = 300 * Math.pow(0.9, rowScore);
    const interval = document.querySelector('#speed');
    if(interval) {
        interval.innerHTML = (Math.round(1 / interfallTimer * 100000) / 100).toString();
    }
}

function calculateRotatedDroppingStone(relativePos: Block) {
    return relativePos.squares.map((s) => { 
        let x = s.x; 
        return {
            x: s.x = -s.y + droppingStone.squares[1].x, 
            y: s.y = x + droppingStone.squares[1].y,
            color: s.color
        };
    });
}

function suggestPositionCorrection(takenPosition: Block, relativePos: Block, newPositions: Block) {
    const minX = Math.min(...takenPosition.squares.map(position => position.x));
    const maxX = Math.max(...takenPosition.squares.map(position => position.x));
    const maxY = Math.max(...takenPosition.squares.map(position => position.y));
    let correction = newPositions;  
    if(minX < relativePos.squares[1].x && maxX > relativePos.squares[1].x) {
       // cannot correct position
    } else if (minX < newPositions.squares[1].x){
        const moveDistance = newPositions.squares[1].x - minX;
        correction.squares = newPositions.squares.map((stone) => ({x: stone.x += moveDistance, y: stone.y, color: stone.color}));
    } else if (maxX > newPositions.squares[1].x) {
        const moveDistance = newPositions.squares[1].x - maxX;
        correction.squares = newPositions.squares.map((stone) => ({x: stone.x += moveDistance, y: stone.y, color: stone.color}));
    } else if (maxY >= newPositions.squares[1].y) {
        const moveDistance = maxY - newPositions.squares[1].y + STONE_SIZE;
        correction.squares = newPositions.squares.map((stone) => ({x: stone.x, y: stone.y -= moveDistance, color: stone.color}));
    }
    return correction;
}

function tryRotateStone() {
    if(droppingStone.squares[0].color != 'yellow' && !gameOver) {
        const originalPos = JSON.parse(JSON.stringify(droppingStone));
        const relativePos = new Block(droppingStone.squares[0].color);
        relativePos.squares = droppingStone.squares.map((s) => ({x: (s.x - droppingStone.squares[1].x), y: s.y - droppingStone.squares[1].y, color: s.color}));
        let newPositions = new Block(droppingStone.squares[0].color);
        newPositions.squares = calculateRotatedDroppingStone(relativePos);
        const takenPosition = new Block(droppingStone.squares[0].color);
        takenPosition.squares = newPositions.squares.filter((stone) => isPositionTaken(stone.x, stone.y));
        if(takenPosition) {
            newPositions = suggestPositionCorrection(takenPosition, relativePos, newPositions);
        }
        if(!newPositions.squares.find((stone) => isPositionTaken(stone.x, stone.y))) {
            droppingStone = newPositions;
        }
    }
}

function setDroppingStoneColor(color: string) {
    droppingStone.squares.forEach((s) => {s.color = color});
}

function createNewStone() {
    const randomNr = Math.floor(Math.random() * 7);
    switch(randomNr) {
        case 0:
            droppingStone = new Block('cyan', {x, y}, {x: x + 50,y}, {x: x + 100,y}, {x: x + 150,y});
            break;
        case 1:
            droppingStone = new Block('blue', {x, y}, {x: x + 50,y}, {x: x + 100,y}, {x: x + 100,y: y + 50});
            break;
        case 2:
            droppingStone = new Block('orange', {x, y}, {x: x + 50,y}, {x: x + 100,y}, {x: x + 100,y: y - 50});
            break;
        case 3:
            droppingStone = new Block('yellow', {x, y}, {x: x + 50,y}, {x,y: y + 50}, {x: x + 50,y: y + 50});
            break;
        case 4:
            droppingStone = new Block('red', {x, y}, {x: x + 50,y}, {x: x + 50,y: y + 50}, {x: x + 100,y: y + 50});
            setDroppingStoneColor('red')
            break;
        case 5:
            droppingStone = new Block('green', {x, y}, {x: x + 50,y}, {x: x + 50,y: y - 50}, {x: x + 100,y: y - 50});
            break;
        default:
            droppingStone = new Block('violet', {x, y}, {x: x + 50,y}, {x: x + 50,y: y - 50}, {x: x + 100,y: y});
    }
}

function getFinishedRows() {
    const collectedRows: { y: number, count: number}[] = []
    const finishedRows: number[] = [];
    stones.squares.forEach((stone) => {
        let row = collectedRows.find((row) => row.y == stone.y)
        if (!row) {
            collectedRows.push({y: stone.y, count: 1});
        } else if (++row.count >= CANVAS_WIDTH / STONE_SIZE) {
            finishedRows.push(row.y);
        }
    });
    return finishedRows;
}

function removeStonesWithYCoordinate(yCoordinate: number) {
    stones.squares = stones.squares.filter((s) => s.y !== yCoordinate);
}

function moveStonesDownwardsWithYCoordinate(yCoordinate: number) {
    stones.squares.forEach((stone) => {
        if(stone.y < yCoordinate) {
            stone.y += STONE_SIZE;
        }
    })
}

function deleteFullRows() {
    const rowsToDelete = getFinishedRows();
    rowsToDelete.sort();
    rowsToDelete.forEach((rowY) => {
        removeStonesWithYCoordinate(rowY);
    })
    rowsToDelete.forEach((rowY) => {
        moveStonesDownwardsWithYCoordinate(rowY)
    })
    if (rowsToDelete.length) {
        increaseRowScore(rowsToDelete.length)
    }
}

function moveStoneLeft() {
    if (allowMoveLeft()) {
        droppingStone.squares.forEach((s) => {s.x -= STONE_SIZE});
    }
}

function moveStoneRight() {
    if(allowMoveRight()) {
        droppingStone.squares.forEach((s) => {s.x += STONE_SIZE});
    }
}

function isStoneBelow() {
    return  droppingStone.squares.find((s) => isPositionTaken(s.x, s.y + STONE_SIZE));
}

function allowMoveLeft() {
    return  !droppingStone.squares.find((s) => isPositionTaken(s.x - STONE_SIZE, s.y));
}

function allowMoveRight() {
    return  !droppingStone.squares.find((s) => isPositionTaken(s.x + STONE_SIZE, s.y));
}

function isPositionTaken(x: number, y: number) {
    let positionTaken: boolean | Square | undefined = false;
    positionTaken = x < 0 || x + STONE_SIZE > CANVAS_WIDTH || y + STONE_SIZE > CANVAS_HEIGHT; 
    positionTaken = positionTaken || stones.squares.find((s) => s.x == x && s.y == y);
    return positionTaken
}

function isStoneTouchingBottom() {
    return droppingStone.squares.find((s) => s.y >= CANVAS_HEIGHT - STONE_SIZE);
}

function moveStoneDown() {
    droppingStone.squares.forEach((s) => {s.y += STONE_SIZE});
}

function makeNextStep() {
    if(!isStoneTouchingBottom() && !isStoneBelow()) {
        moveStoneDown()
    } else {
        stones.squares.push(...droppingStone.squares);
        deleteFullRows()
        createNewStone()
    }
}

function drawGame() {
    if(context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < stones.squares.length; i++) {
            context.beginPath();
            context.lineWidth = lINE_WIDTH;
            context.strokeStyle = 'black';
            context.fillStyle = stones.squares[i].color;
            context.rect(stones.squares[i].x + lINE_WIDTH / 2, stones.squares[i].y + lINE_WIDTH / 2, STONE_SIZE, STONE_SIZE);
            context.fill();
            context.stroke();
        }
        for(let i = 0; i < droppingStone.squares.length; i++) {
            context.beginPath();
            context.lineWidth = lINE_WIDTH;
            context.strokeStyle = 'black';
            context.fillStyle = droppingStone.squares[i].color;
            context.rect(droppingStone.squares[i].x + lINE_WIDTH / 2, droppingStone.squares[i].y + lINE_WIDTH / 2, STONE_SIZE, STONE_SIZE);
            context.fill();
            context.stroke();
        }
    }
}


function startGameLoop() {
    setTimeout(() => {    
        reDrawNeeded = true;
        makeNextStep();
        if(!stones.squares.find((s) => s.y < 0)){
            startGameLoop();
        } else {
            const lostLabel = document.querySelector('#lostLabel') as HTMLElement;
            if(lostLabel) {
                lostLabel.style.display = 'block';
            }
            gameOver = true;
        }
    }, interfallTimer)
    
}

function startDrawGameLoop() {
    requestAnimationFrame(() => {
            if(reDrawNeeded) {
                drawGame();
                reDrawNeeded = false;
            }
            if(!gameOver) {
                startDrawGameLoop();
            }
        }
    )
}
createNewStone();
startGameLoop();
startDrawGameLoop();

document.onkeydown = checkKey;

function checkKey(e: KeyboardEvent) {


    if (e.keyCode == 38) {
        tryRotateStone();
        reDrawNeeded = true;
    }
    else if (e.keyCode == 40) {
        makeNextStep()
        reDrawNeeded = true;
    }
    else if (e.keyCode == 37) {
        moveStoneLeft();
        reDrawNeeded = true;
    }
    else if (e.keyCode == 39) {
        moveStoneRight();
        reDrawNeeded = true;
    }

}
