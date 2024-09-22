const chessboard = document.getElementById('chessboard');
const gameStatus = document.getElementById('game-status');
const resetBtn = document.getElementById('reset-btn');
const aiMoveBtn = document.getElementById('ai-move-btn');
const difficultySelect = document.getElementById('difficulty-select');
const timeLimitSelect = document.getElementById('time-limit-select');
const whiteTimerDisplay = document.getElementById('white-timer');
const blackTimerDisplay = document.getElementById('black-timer');

let selectedSquare = null;
let gameState = null;
let timerInterval = null;

const pieceUnicode = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

function createChessboard() {
    chessboard.innerHTML = '';
    for (let row = 7; row >= 0; row--) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
            square.dataset.row = row;
            square.dataset.col = col;
            square.addEventListener('click', handleSquareClick);
            chessboard.appendChild(square);
        }
    }
}

function updateBoard(fen) {
    if (!fen) {
        console.error('FEN is undefined');
        return;
    }
    const pieces = fen.split(' ')[0];
    const squares = chessboard.getElementsByClassName('square');
    let squareIndex = 0;

    // Clear all squares
    for (let square of squares) {
        square.textContent = '';
    }

    for (let i = 0; i < pieces.length; i++) {
        const char = pieces[i];
        if (char === '/') {
            continue;
        } else if (isNaN(char)) {
            squares[squareIndex].textContent = pieceUnicode[char];
            squareIndex++;
        } else {
            squareIndex += parseInt(char);
        }
    }
}

function handleSquareClick(event) {
    const clickedSquare = event.target;
    
    if (selectedSquare === null) {
        if (clickedSquare.textContent !== '') {
            selectedSquare = clickedSquare;
            selectedSquare.classList.add('selected');
        }
    } else {
        const move = getMoveNotation(selectedSquare, clickedSquare);
        makeMove(move);
        selectedSquare.classList.remove('selected');
        selectedSquare = null;
    }
}

function getMoveNotation(fromSquare, toSquare) {
    const files = 'abcdefgh';
    const fromFile = files[fromSquare.dataset.col];
    const fromRank = parseInt(fromSquare.dataset.row) + 1;
    const toFile = files[toSquare.dataset.col];
    const toRank = parseInt(toSquare.dataset.row) + 1;
    return `${fromFile}${fromRank}${toFile}${toRank}`;
}

async function makeMove(move) {
    const response = await fetch('/move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ move: move }),
    });
    const result = await response.json();
    if (result.error) {
        console.error('Move error:', result.error);
        alert(result.error);
    } else {
        updateGameState(result);
    }
}

async function aiMove() {
    const response = await fetch('/ai_move');
    const result = await response.json();
    if (result.error) {
        alert(result.error);
    } else {
        updateGameState(result);
    }
}

function updateGameState(state) {
    if (!state || !state.fen) {
        console.error('Invalid game state:', state);
        return;
    }
    gameState = state;
    updateBoard(state.fen);
    updateStatus();
    updateTimers(state.white_time, state.black_time);
}

function updateStatus() {
    if (!gameState) {
        console.error('Game state is not initialized');
        return;
    }
    let status = `Current turn: ${gameState.turn}`;
    if (gameState.in_check) {
        status += ' | Check!';
    }
    if (gameState.game_over) {
        if (gameState.checkmate) {
            status = `Checkmate! ${gameState.turn === 'white' ? 'Black' : 'White'} wins!`;
        } else if (gameState.stalemate) {
            status = 'Stalemate! The game is a draw.';
        } else {
            status = 'Game over!';
        }
        clearInterval(timerInterval);
    }
    gameStatus.textContent = status;
}

function updateTimers(whiteTime, blackTime) {
    whiteTimerDisplay.textContent = `White: ${formatTime(whiteTime)}`;
    blackTimerDisplay.textContent = `Black: ${formatTime(blackTime)}`;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function resetGame() {
    const difficulty = difficultySelect.value;
    const timeLimit = parseInt(timeLimitSelect.value);
    const response = await fetch('/reset', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ difficulty: difficulty, time_limit: timeLimit }),
    });
    const result = await response.json();
    if (result.status === 'ok') {
        const initialStateResponse = await fetch('/move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ move: 'initial' }),
        });
        const initialState = await initialStateResponse.json();
        updateGameState(initialState);
        startTimer();
    }
}

async function setDifficulty() {
    const difficulty = difficultySelect.value;
    const timeLimit = parseInt(timeLimitSelect.value);
    const response = await fetch('/set_difficulty', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ difficulty: difficulty, time_limit: timeLimit }),
    });
    const result = await response.json();
    if (result.status === 'ok') {
        alert(`AI difficulty set to ${difficulty}`);
        resetGame();
    }
}

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timerInterval = setInterval(async () => {
        const response = await fetch('/get_time');
        const result = await response.json();
        updateTimers(result.white_time, result.black_time);
    }, 1000);
}

createChessboard();
resetGame();

resetBtn.addEventListener('click', resetGame);
aiMoveBtn.addEventListener('click', aiMove);
difficultySelect.addEventListener('change', setDifficulty);
timeLimitSelect.addEventListener('change', resetGame);
