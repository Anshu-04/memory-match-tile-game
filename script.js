const THEMES = {
    emojis: ["😀","😆","😇","😎","😤","🤥","🤑","😱","🥳","🥲","☹️","😔"],
    animals: ["🐶","🐱","🦊","🐼","🐵","🦁","🐸","🐷","🐻","🦄","🐢","🐙"],
    shapes: ["▲","●","■","◆","★","♣","♥","♦","♠","▶","✦","✶"]
};

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

class Confetti {
    constructor() {
        this.canvas = document.getElementById('confetti-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationFrame = null;
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    burst() {
        this.init();
        this.particles = [];
        
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        
        for (let i = 0; i < 150; i++) {
            this.particles.push({
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 4,
                gravity: 0.2,
                life: 1
            });
        }

        this.animate();
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life -= 0.01;

            if (p.life > 0) {
                this.ctx.globalAlpha = p.life;
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(p.x, p.y, p.size, p.size);
            } else {
                this.particles.splice(index, 1);
            }
        });

        if (this.particles.length > 0) {
            this.animationFrame = requestAnimationFrame(() => this.animate());
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

const confetti = new Confetti();

class Game {
    constructor() {
        this.board = [];
        this.flippedTiles = [];
        this.matchedPairs = 0;
        this.totalPairs = 0;
        this.moves = 0;
        this.seconds = 0;
        this.timerInterval = null;
        this.isAnimating = false;
        this.gameStarted = false;
        this.theme = 'emojis';
        this.difficulty = 'easy';
        this.matchHistory = [];
    }

    init(theme, difficulty) {
        this.reset();
        this.theme = theme;
        this.difficulty = difficulty;
        
        const gridSizes = {
            easy: 12,
            medium: 16,
            hard: 20
        };

        const gridSize = gridSizes[difficulty];
        this.totalPairs = gridSize / 2;

        const themeData = THEMES[theme];
        const selectedIcons = themeData.slice(0, this.totalPairs);
        const pairedIcons = [...selectedIcons, ...selectedIcons];
        this.board = shuffleArray(pairedIcons);

        this.renderBoard();
        this.updateUI();
    }

    reset() {
        this.board = [];
        this.flippedTiles = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.seconds = 0;
        this.isAnimating = false;
        this.gameStarted = false;
        this.matchHistory = [];
        this.stopTimer();
    }

    renderBoard() {
        const grid = document.getElementById('board-grid');
        grid.innerHTML = '';
        
        const gridClass = {
            easy: 'grid-3x4',
            medium: 'grid-4x4',
            hard: 'grid-5x4'
        };
        
        grid.className = `board-grid ${gridClass[this.difficulty]}`;

        this.board.forEach((icon, index) => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.index = index;
            tile.dataset.icon = icon;
            
            tile.innerHTML = `
                <div class="tile-inner">
                    <div class="tile-face tile-front"></div>
                    <div class="tile-face tile-back">${icon}</div>
                </div>
            `;
            
            tile.addEventListener('click', () => this.handleTileClick(index));
            grid.appendChild(tile);
        });
    }

    handleTileClick(index) {
        if (this.isAnimating) return;
        if (this.flippedTiles.length >= 2) return;

        const tile = document.querySelectorAll('.tile')[index];
        if (tile.classList.contains('flipped') || tile.classList.contains('matched')) return;

        if (!this.gameStarted) {
            this.startTimer();
            this.gameStarted = true;
        }

        this.flipTile(index);
        this.flippedTiles.push(index);

        if (this.flippedTiles.length === 2) {
            this.moves++;
            this.updateUI();
            this.checkMatch();
        }
    }

    flipTile(index) {
        const tile = document.querySelectorAll('.tile')[index];
        tile.classList.add('flipped');
    }

    unflipTile(index) {
        const tile = document.querySelectorAll('.tile')[index];
        tile.classList.remove('flipped');
    }

    checkMatch() {
        this.isAnimating = true;
        const [index1, index2] = this.flippedTiles;
        const icon1 = this.board[index1];
        const icon2 = this.board[index2];

        if (icon1 === icon2) {
            setTimeout(() => {
                this.markAsMatched(index1, index2);
                this.matchedPairs++;
                this.matchHistory.push([index1, index2]);
                this.flippedTiles = [];
                this.isAnimating = false;
                this.updateUI();
                this.checkWin();
            }, 400);
        } else {
            setTimeout(() => {
                this.unflipTile(index1);
                this.unflipTile(index2);
                this.flippedTiles = [];
                this.isAnimating = false;
            }, 800);
        }
    }

    markAsMatched(index1, index2) {
        const tiles = document.querySelectorAll('.tile');
        tiles[index1].classList.add('matched');
        tiles[index2].classList.add('matched');
    }

    unmarkMatched(index1, index2) {
        const tiles = document.querySelectorAll('.tile');
        tiles[index1].classList.remove('matched', 'flipped');
        tiles[index2].classList.remove('matched', 'flipped');
    }

    checkWin() {
        if (this.matchedPairs === this.totalPairs) {
            this.stopTimer();
            setTimeout(() => {
                this.showWinModal();
            }, 500);
        }
    }

    showWinModal() {
        confetti.burst();
        document.getElementById('final-time').textContent = formatTime(this.seconds);
        document.getElementById('final-moves').textContent = this.moves;
        document.getElementById('win-modal').classList.add('active');
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.seconds++;
            this.updateUI();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateUI() {
        document.getElementById('timer').textContent = formatTime(this.seconds);
        document.getElementById('moves').textContent = this.moves;
        document.getElementById('matches').textContent = `${this.matchedPairs}/${this.totalPairs}`;
        document.getElementById('undo-btn').disabled = this.matchHistory.length === 0;
    }

    preview() {
        const tiles = document.querySelectorAll('.tile');
        const overlay = document.getElementById('preview-overlay');
        
        overlay.classList.add('active');
        tiles.forEach(tile => tile.classList.add('flipped'));
        
        setTimeout(() => {
            tiles.forEach(tile => {
                if (!tile.classList.contains('matched')) {
                    tile.classList.remove('flipped');
                }
            });
            overlay.classList.remove('active');
        }, 1500);
    }

    restart() {
        this.init(this.theme, this.difficulty);
    }

    undo() {
        if (this.matchHistory.length === 0) return;
        
        const [index1, index2] = this.matchHistory.pop();
        this.unmarkMatched(index1, index2);
        this.matchedPairs--;
        this.moves--;
        this.updateUI();
    }
}

const game = new Game();

class App {
    constructor() {
        this.currentTheme = 'emojis';
        this.setupEventListeners();
    }

    setupEventListeners() {

        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.currentTheme = e.target.value;
        });

        document.querySelectorAll('.difficulty-buttons button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const difficulty = e.target.dataset.difficulty;
                this.startGame(this.currentTheme, difficulty);
            });
        });

        document.getElementById('back-btn').addEventListener('click', () => {
            this.showScreen('home-screen');
            game.reset();
        });

        document.getElementById('preview-btn').addEventListener('click', () => {
            game.preview();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            game.restart();
        });

        document.getElementById('undo-btn').addEventListener('click', () => {
            game.undo();
        });

        document.getElementById('new-game-btn').addEventListener('click', () => {
            document.getElementById('win-modal').classList.remove('active');
            game.restart();
        });

        document.getElementById('home-btn').addEventListener('click', () => {
            document.getElementById('win-modal').classList.remove('active');
            this.showScreen('home-screen');
            game.reset();
        });
    }

    startGame(theme, difficulty) {
        this.showScreen('game-screen');
        game.init(theme, difficulty);
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
}

const app = new App();
