const chessboard = document.getElementById('chessboard');
const gameStatus = document.getElementById('game-status');
const resetBtn = document.getElementById('reset-btn');
const aiMoveBtn = document.getElementById('ai-move-btn');
const difficultySelect = document.getElementById('difficulty-select');
const timeLimitSelect = document.getElementById('time-limit-select');
const whiteTimerDisplay = document.getElementById('white-timer');
const blackTimerDisplay = document.getElementById('black-timer');
const moveHistoryContainer = document.getElementById('move-history');
const prevMoveBtn = document.getElementById('prev-move-btn');
const nextMoveBtn = document.getElementById('next-move-btn');
const playPauseBtn = document.getElementById('play-pause-btn');

let selectedSquare = null;
let gameState = null;
let timerInterval = null;
let moveHistory = [];
let currentMoveIndex = -1;
let isReplaying = false;
let replayInterval = null;

const pieceUnicode = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

function createChessboard() {
    chessboard.innerHTML = '';
    for (let row = 7; row >= 0; row--) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('w-1/8', 'h-1/8', 'flex', 'items-center', 'justify-center', 'text-4xl', 'cursor-pointer');
            square.classList.add((row + col) % 2 === 0 ? 'bg-amber-200' : 'bg-amber-800');
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
    const squares = chessboard.getElementsByClassName('w-1/8');
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
    if (isReplaying) return;

    const clickedSquare = event.target;
    
    if (selectedSquare === null) {
        if (clickedSquare.textContent !== '') {
            selectedSquare = clickedSquare;
            selectedSquare.classList.add('bg-blue-400');
        }
    } else {
        const move = getMoveNotation(selectedSquare, clickedSquare);
        makeMove(move);
        selectedSquare.classList.remove('bg-blue-400');
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
    updateMoveHistory(state.move_history);
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
        stopTimer();
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

function updateMoveHistory(history) {
    moveHistory = history;
    currentMoveIndex = moveHistory.length - 1;
    displayMoveHistory();
}

function displayMoveHistory() {
    moveHistoryContainer.innerHTML = '';
    for (let i = 0; i < moveHistory.length; i++) {
        const moveElement = document.createElement('div');
        moveElement.textContent = `${Math.floor(i/2) + 1}. ${moveHistory[i]}`;
        moveElement.classList.add('py-1', 'px-2');
        if (i === currentMoveIndex) {
            moveElement.classList.add('bg-blue-200');
        }
        moveHistoryContainer.appendChild(moveElement);
    }
    moveHistoryContainer.scrollTop = moveHistoryContainer.scrollHeight;
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
        stopReplay();
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
    stopTimer();
    timerInterval = setInterval(updateTimersFromServer, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
}

async function updateTimersFromServer() {
    try {
        const response = await fetch('/get_time');
        const result = await response.json();
        updateTimers(result.white_time, result.black_time);
    } catch (error) {
        console.error('Error updating timers:', error);
    }
}

function prevMove() {
    if (currentMoveIndex > 0) {
        currentMoveIndex--;
        updateBoardToMove(currentMoveIndex);
    }
}

function nextMove() {
    if (currentMoveIndex < moveHistory.length - 1) {
        currentMoveIndex++;
        updateBoardToMove(currentMoveIndex);
    }
}

function updateBoardToMove(moveIndex) {
    fetch('/move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ move: 'initial' }),
    })
    .then(response => response.json())
    .then(initialState => {
        let board = new Chess(initialState.fen);
        for (let i = 0; i <= moveIndex; i++) {
            board.move(moveHistory[i]);
        }
        updateBoard(board.fen());
        displayMoveHistory();
    });
}

function toggleReplay() {
    if (isReplaying) {
        stopReplay();
    } else {
        startReplay();
    }
}

function startReplay() {
    isReplaying = true;
    playPauseBtn.textContent = 'Pause';
    replayInterval = setInterval(() => {
        if (currentMoveIndex < moveHistory.length - 1) {
            nextMove();
        } else {
            stopReplay();
        }
    }, 1000);
}

function stopReplay() {
    isReplaying = false;
    playPauseBtn.textContent = 'Play';
    if (replayInterval) {
        clearInterval(replayInterval);
    }
}

createChessboard();
resetGame();

resetBtn.addEventListener('click', resetGame);
aiMoveBtn.addEventListener('click', aiMove);
difficultySelect.addEventListener('change', setDifficulty);
timeLimitSelect.addEventListener('change', resetGame);
prevMoveBtn.addEventListener('click', prevMove);
nextMoveBtn.addEventListener('click', nextMove);
playPauseBtn.addEventListener('click', toggleReplay);