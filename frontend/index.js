import { backend } from 'declarations/backend';

class ModernMinesweeper {
    constructor() {
        this.difficulties = [
            { width: 9, height: 9, mines: 10, basePoints: 100 },
            { width: 16, height: 16, mines: 40, basePoints: 200 },
            { width: 24, height: 24, mines: 99, basePoints: 300 },
            { width: 30, height: 30, mines: 180, basePoints: 500 }
        ];
        
        this.initializeElements();
        this.initializeGameState();
        this.setupEventListeners();
        this.setupParticles();
        this.newGame();
    }
    
    initializeElements() {
        this.grid = document.getElementById('grid');
        this.difficultySelect = document.getElementById('difficulty');
        this.newGameBtn = document.getElementById('newGame');
        this.minesLeftSpan = document.getElementById('mines-left');
        this.timerSpan = document.getElementById('timer');
        this.scoreSpan = document.getElementById('score');
        this.highScoreSpan = document.getElementById('high-score');
        this.streakSpan = document.getElementById('streak');
        this.comboMultiplier = document.getElementById('combo-multiplier');
        this.comboFill = document.getElementById('combo-fill');
    }
    
    initializeGameState() {
        this.cells = [];
        this.gameOver = false;
        this.firstClick = true;
        this.startTime = null;
        this.timerInterval = null;
        this.score = 0;
        this.streak = 0;
        this.combo = 1;
        this.comboTimer = null;
        this.particles = [];
    }
    
    setupEventListeners() {
        this.difficultySelect.addEventListener('change', () => this.newGame());
        this.newGameBtn.addEventListener('click', () => this.newGame());
        
        this.grid.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                const [x, y] = e.target.dataset.pos.split(',').map(Number);
                this.revealCell(x, y);
            }
        });
        
        this.grid.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('cell')) {
                const [x, y] = e.target.dataset.pos.split(',').map(Number);
                this.toggleFlag(x, y);
            }
        });
    }
    
    setupParticles() {
        const canvas = document.createElement('canvas');
        canvas.className = 'particles';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            this.particles = this.particles.filter(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.1;
                particle.alpha -= 0.01;
                
                if (particle.alpha > 0) {
                    ctx.fillStyle = `rgba(${particle.color}, ${particle.alpha})`;
                    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
                    return true;
                }
                return false;
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    createParticles(x, y, color) {
        const rect = this.grid.getBoundingClientRect();
        const cellSize = 40;
        const worldX = rect.left + x * (cellSize + 3) + cellSize / 2;
        const worldY = rect.top + y * (cellSize + 3) + cellSize / 2;
        
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: worldX,
                y: worldY,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                size: Math.random() * 4 + 2,
                alpha: 1,
                color
            });
        }
    }
    
    showAchievement(text) {
        const achievement = document.createElement('div');
        achievement.className = 'achievement animate__animated animate__slideInRight';
        achievement.textContent = text;
        document.body.appendChild(achievement);
        
        setTimeout(() => {
            achievement.classList.add('animate__slideOutRight');
            setTimeout(() => achievement.remove(), 500);
        }, 2000);
    }
    
    updateCombo() {
        this.combo++;
        this.comboMultiplier.textContent = this.combo;
        this.comboFill.style.width = '100%';
        
        clearTimeout(this.comboTimer);
        this.comboTimer = setTimeout(() => {
            this.combo = 1;
            this.comboMultiplier.textContent = this.combo;
            this.comboFill.style.width = '0%';
        }, 2000);
        
        const comboDecay = setInterval(() => {
            const currentWidth = parseFloat(this.comboFill.style.width);
            if (currentWidth > 0) {
                this.comboFill.style.width = `${currentWidth - 5}%`;
            } else {
                clearInterval(comboDecay);
            }
        }, 100);
    }
    
    async newGame() {
        const difficultyIndex = parseInt(this.difficultySelect.value);
        await backend.newGame(difficultyIndex);
        
        this.initializeGameState();
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        const difficulty = this.difficulties[difficultyIndex];
        this.width = difficulty.width;
        this.height = difficulty.height;
        this.totalMines = difficulty.mines;
        this.basePoints = difficulty.basePoints;
        
        this.grid.style.gridTemplateColumns = `repeat(${this.width}, 40px)`;
        this.createGrid();
        this.updateMinesLeft();
        this.updateScore();
        this.updateHighScore();
    }
    
    createGrid() {
        this.grid.innerHTML = '';
        
        for (let y = 0; y < this.height; y++) {
            this.cells[y] = [];
            for (let x = 0; x < this.width; x++) {
                const cell = document.createElement('button');
                cell.className = 'cell animate__animated animate__fadeIn';
                cell.dataset.pos = `${x},${y}`;
                this.grid.appendChild(cell);
                this.cells[y][x] = cell;
            }
        }
    }
    
    async revealCell(x, y) {
        if (this.gameOver) return;
        
        if (this.firstClick) {
            this.firstClick = false;
            this.startTimer();
        }
        
        const revealedCount = await backend.revealCell(x, y);
        
        if (revealedCount === 0) {
            this.gameOver = true;
            this.revealAllMines();
            clearInterval(this.timerInterval);
            this.combo = 1;
            this.streak = 0;
            this.updateStreak();
            this.showAchievement('💥 Game Over!');
            return;
        }
        
        if (revealedCount > 0) {
            const points = Math.floor(revealedCount * this.basePoints * this.combo);
            this.score = await backend.updateScore(points);
            this.updateScore();
            this.updateCombo();
            
            const bonus = document.createElement('div');
            bonus.className = 'streak-bonus';
            bonus.textContent = `+${points}`;
            const cell = this.cells[y][x];
            cell.appendChild(bonus);
            
            this.createParticles(x, y, '99, 102, 241');
        }
        
        this.updateGameState();
    }
    
    async toggleFlag(x, y) {
        if (this.gameOver) return;
        
        const success = await backend.toggleFlag(x, y);
        if (success) {
            const cell = this.cells[y][x];
            cell.classList.toggle('flagged');
            cell.classList.toggle('animate__bounce');
            cell.textContent = cell.classList.contains('flagged') ? '🚩' : '';
            this.createParticles(x, y, '245, 158, 11');
            this.updateMinesLeft();
        }
    }
    
    updateScore() {
        this.scoreSpan.textContent = this.score;
    }
    
    updateStreak() {
        this.streakSpan.textContent = this.streak;
    }
    
    updateMinesLeft() {
        this.minesLeftSpan.textContent = this.totalMines - document.querySelectorAll('.flagged').length;
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const time = Math.floor((Date.now() - this.startTime) / 1000);
            this.timerSpan.textContent = `${time}s`;
        }, 1000);
    }
    
    async revealAllMines() {
        const gameState = await backend.getGameState();
        if (gameState) {
            gameState.grid.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell.isMine) {
                        const cellElement = this.cells[y][x];
                        cellElement.classList.add('revealed', 'mine', 'animate__pulse');
                        cellElement.textContent = '💣';
                        this.createParticles(x, y, '239, 68, 68');
                    }
                });
            });
        }
    }
    
    async updateGameState() {
        const gameState = await backend.getGameState();
        if (gameState) {
            gameState.grid.forEach((row, y) => {
                row.forEach((cell, x) => {
                    const cellElement = this.cells[y][x];
                    if (cell.isRevealed) {
                        cellElement.classList.add('revealed');
                        if (cell.adjacentMines > 0) {
                            cellElement.textContent = cell.adjacentMines;
                            cellElement.classList.add(`number-${cell.adjacentMines}`);
                        }
                    }
                });
            });
            
            if (this.checkWin(gameState)) {
                this.gameOver = true;
                clearInterval(this.timerInterval);
                this.streak++;
                this.updateStreak();
                const time = Math.floor((Date.now() - this.startTime) / 1000);
                this.showAchievement(`🏆 Level Complete! Time: ${time}s`);
                this.updateHighScore();
            }
        }
    }
    
    checkWin(gameState) {
        return gameState.grid.every(row => row.every(cell => cell.isRevealed || cell.isMine));
    }
    
    async updateHighScore() {
        const highScore = await backend.getHighScore();
        this.highScoreSpan.textContent = highScore;
        if (this.score > highScore) {
            this.showAchievement('🌟 New High Score!');
        }
    }
}

new ModernMinesweeper();
