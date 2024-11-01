import { backend } from 'declarations/backend';

class Game {
    constructor() {
        this.gameState = null;
        this.boardElement = document.getElementById('game-board');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.flagsLeftElement = document.getElementById('flags-left');
        this.timerElement = document.getElementById('timer');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.gameOverMessage = document.getElementById('game-over-message');
        this.finalScoreElement = document.getElementById('final-score');
        this.themeToggle = document.getElementById('theme-toggle');
        this.timerInterval = null;
        this.startTime = null;
        this.clickSound = new Audio('click.mp3');
        this.flagSound = new Audio('flag.mp3');
        this.explosionSound = new Audio('explosion.mp3');
        this.winSound = new Audio('win.mp3');

        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.initTheme();
    }

    async startGame(difficultyIndex) {
        const difficulty = await backend.getDifficulty(BigInt(difficultyIndex));
        this.initializeGame(this.convertBigIntsToNumbers(difficulty));
        this.renderBoard();
        await this.updateHighScore();
        this.startTimer();
    }

    initializeGame(difficulty) {
        this.gameState = {
            grid: this.createEmptyGrid(difficulty.width, difficulty.height),
            difficulty: difficulty,
            score: 0,
            flagsLeft: difficulty.mines,
            isGameOver: false,
            isFirstClick: true
        };
        this.placeMines();
        this.updateFlagsLeft();
    }

    createEmptyGrid(width, height) {
        return Array(height).fill().map(() => Array(width).fill().map(() => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            adjacentMines: 0
        })));
    }

    placeMines() {
        const { width, height, mines } = this.gameState.difficulty;
        let minesPlaced = 0;
        while (minesPlaced < mines) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            if (!this.gameState.grid[y][x].isMine) {
                this.gameState.grid[y][x].isMine = true;
                minesPlaced++;
                this.incrementAdjacentCells(x, y);
            }
        }
    }

    incrementAdjacentCells(x, y) {
        const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        const { width, height } = this.gameState.difficulty;
        directions.forEach(([dx, dy]) => {
            const newX = x + dx;
            const newY = y + dy;
            if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
                this.gameState.grid[newY][newX].adjacentMines++;
            }
        });
    }

    renderBoard() {
        this.boardElement.innerHTML = '';
        this.boardElement.style.setProperty('--grid-size', this.gameState.difficulty.width);

        this.gameState.grid.forEach((row, y) => {
            row.forEach((cell, x) => {
                const cellElement = document.createElement('div');
                cellElement.className = 'cell';
                cellElement.dataset.x = x;
                cellElement.dataset.y = y;
                cellElement.addEventListener('click', () => this.revealCell(x, y));
                cellElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.toggleFlag(x, y);
                });
                this.updateCellDisplay(cellElement, cell);
                this.boardElement.appendChild(cellElement);
            });
        });
    }

    updateCellDisplay(cellElement, cell) {
        cellElement.className = 'cell';
        if (cell.isRevealed) {
            cellElement.classList.add('revealed');
            if (cell.isMine) {
                cellElement.classList.add('mine');
                cellElement.textContent = '💣';
            } else if (cell.adjacentMines > 0) {
                cellElement.textContent = cell.adjacentMines;
                cellElement.classList.add(`adjacent-${cell.adjacentMines}`);
            }
        } else if (cell.isFlagged) {
            cellElement.classList.add('flagged');
            cellElement.textContent = '🚩';
        }
    }

    revealCell(x, y) {
        const cell = this.gameState.grid[y][x];
        if (cell.isRevealed || cell.isFlagged || this.gameState.isGameOver) return;

        cell.isRevealed = true;
        this.gameState.score += 1;
        this.clickSound.play();

        if (cell.isMine) {
            this.explosionSound.play();
            this.gameOver(false);
        } else if (cell.adjacentMines === 0) {
            this.revealAdjacentCells(x, y);
        }

        this.checkWinCondition();
        this.renderBoard();
        this.updateScore();
    }

    revealAdjacentCells(x, y) {
        const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        const { width, height } = this.gameState.difficulty;
        directions.forEach(([dx, dy]) => {
            const newX = x + dx;
            const newY = y + dy;
            if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
                const adjacentCell = this.gameState.grid[newY][newX];
                if (!adjacentCell.isRevealed && !adjacentCell.isFlagged) {
                    this.revealCell(newX, newY);
                }
            }
        });
    }

    toggleFlag(x, y) {
        const cell = this.gameState.grid[y][x];
        if (!cell.isRevealed && !this.gameState.isGameOver) {
            cell.isFlagged = !cell.isFlagged;
            this.gameState.flagsLeft += cell.isFlagged ? -1 : 1;
            this.flagSound.play();
            this.renderBoard();
            this.updateFlagsLeft();
        }
    }

    checkWinCondition() {
        const { width, height, mines } = this.gameState.difficulty;
        let revealedCount = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (this.gameState.grid[y][x].isRevealed) revealedCount++;
            }
        }
        if (revealedCount === width * height - mines) {
            this.winSound.play();
            this.gameOver(true);
        }
    }

    async gameOver(isWin) {
        this.gameState.isGameOver = true;
        clearInterval(this.timerInterval);
        const message = isWin ? 'You Win!' : 'Game Over!';
        this.showGameOverModal(message);
        if (isWin) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            await this.updateHighScore();
        }
    }

    updateScore() {
        this.scoreElement.textContent = this.gameState.score;
    }

    updateFlagsLeft() {
        this.flagsLeftElement.textContent = this.gameState.flagsLeft;
    }

    async updateHighScore() {
        const highScore = await backend.updateHighScore(BigInt(this.gameState.score));
        this.highScoreElement.textContent = Number(highScore);
    }

    showGameOverModal(message) {
        this.gameOverMessage.textContent = message;
        this.finalScoreElement.textContent = this.gameState.score;
        this.gameOverModal.classList.remove('hidden');
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
            const seconds = (elapsedTime % 60).toString().padStart(2, '0');
            this.timerElement.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    }

    initTheme() {
        if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.classList.add('dark-theme');
        }
    }

    convertBigIntsToNumbers(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return typeof obj === 'bigint' ? Number(obj) : obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.convertBigIntsToNumbers(item));
        }
        const convertedObj = {};
        for (const key in obj) {
            convertedObj[key] = this.convertBigIntsToNumbers(obj[key]);
        }
        return convertedObj;
    }
}

const game = new Game();

window.startGame = (difficultyIndex) => game.startGame(difficultyIndex);
