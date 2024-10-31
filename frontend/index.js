import { backend } from 'declarations/backend';

class Game {
    constructor() {
        this.gameState = null;
        this.boardElement = document.getElementById('game-board');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.loadingSpinner = document.getElementById('loading-spinner');
    }

    async startGame(difficultyIndex) {
        this.showLoading();
        try {
            await backend.newGame(BigInt(difficultyIndex));
            await this.updateGameState();
            this.renderBoard();
            await this.updateHighScore();
        } catch (error) {
            console.error('Error starting game:', error);
        } finally {
            this.hideLoading();
        }
    }

    async updateGameState() {
        this.showLoading();
        try {
            const state = await backend.getGameState();
            console.log('Raw game state:', state); // Log raw state for debugging
            if (state && state.length > 0) {
                this.gameState = this.convertBigIntsToNumbers(state[0]);
                console.log('Converted game state:', this.gameState); // Log converted state
            } else {
                console.error('Invalid game state received');
            }
        } catch (error) {
            console.error('Error updating game state:', error);
        } finally {
            this.hideLoading();
        }
    }

    convertBigIntsToNumbers(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        if (typeof obj === 'bigint') {
            return Number(obj);
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

    renderBoard() {
        if (!this.gameState || !this.gameState.grid) {
            console.error('Game state or grid is undefined', this.gameState);
            return;
        }

        this.boardElement.innerHTML = '';
        const grid = this.gameState.grid;
        if (!Array.isArray(grid)) {
            console.error('Grid is not an array', grid);
            return;
        }

        grid.forEach((row, y) => {
            if (!Array.isArray(row)) {
                console.error('Row is not an array', row);
                return;
            }
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
            } else if (cell.adjacentMines > 0) {
                cellElement.textContent = cell.adjacentMines;
            }
        } else if (cell.isFlagged) {
            cellElement.classList.add('flagged');
        }
    }

    async revealCell(x, y) {
        this.showLoading();
        try {
            const revealedCount = await backend.revealCell(BigInt(x), BigInt(y));
            await this.updateGameState();
            this.renderBoard();
            if (this.gameState.isGameOver) {
                alert(revealedCount === 0 ? 'Game Over!' : 'You Win!');
            }
        } catch (error) {
            console.error('Error revealing cell:', error);
        } finally {
            this.hideLoading();
        }
    }

    async toggleFlag(x, y) {
        this.showLoading();
        try {
            await backend.toggleFlag(BigInt(x), BigInt(y));
            await this.updateGameState();
            this.renderBoard();
        } catch (error) {
            console.error('Error toggling flag:', error);
        } finally {
            this.hideLoading();
        }
    }

    async updateHighScore() {
        try {
            const highScore = await backend.getHighScore();
            this.highScoreElement.textContent = Number(highScore);
        } catch (error) {
            console.error('Error updating high score:', error);
        }
    }

    showLoading() {
        this.loadingSpinner.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingSpinner.classList.add('hidden');
    }
}

const game = new Game();

window.startGame = (difficultyIndex) => game.startGame(difficultyIndex);
