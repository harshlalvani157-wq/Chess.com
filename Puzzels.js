// Puzzle system with daily challenges and statistics tracking
class PuzzleSystem {
    constructor() {
        this.puzzles = [
            {
                id: 1,
                fen: "rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 4",
                moves: ["d5e4", "e1e4"],
                rating: 1200,
                themes: ["fork", "tactics"],
                solution: "d5e4",
                description: "Black to play and win material"
            },
            {
                id: 2,
                fen: "r1bqkb1r/ppp2ppp/2n2n2/3pp3/4P3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 6",
                moves: ["e4d5", "c6d5"],
                rating: 1400,
                themes: ["fork", "discovery"],
                solution: "e4d5",
                description: "White to play and fork"
            },
            {
                id: 3,
                fen: "rnbqkb1r/ppp2ppp/4pn2/3p4/3PP3/5N2/PPP2PPP/RNBQKB1R w KQkq - 0 5",
                moves: ["e4d5", "e6d5"],
                rating: 1300,
                themes: ["pin", "tactics"],
                solution: "e4d5",
                description: "White to play and open the position"
            },
            {
                id: 4,
                fen: "r2qk2r/ppp2ppp/2n1bn2/2b1p3/4P3/2NP1N2/PPP2PPP/R1BQ1RK1 w kq - 0 9",
                moves: ["f3e5", "f6e5", "d1h5", "g7g6", "h5e5"],
                rating: 1600,
                themes: ["sacrifice", "attack"],
                solution: "f3e5",
                description: "White to play and attack"
            },
            {
                id: 5,
                fen: "r1bqk2r/ppp2ppp/2n1pn2/3p4/1b1PP3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 7",
                moves: ["e4d5", "e6d5", "c3d5"],
                rating: 1500,
                themes: ["fork", "discovery"],
                solution: "e4d5",
                description: "White to play and win a pawn"
            }
        ];
        
        this.currentPuzzle = null;
        this.userStats = this.loadStats();
        this.puzzleRenderer = null;
        this.init();
    }
    
    init() {
        document.getElementById('puzzles-link').addEventListener('click', () => {
            showPage('puzzles-page');
            this.startNewPuzzle();
        });
        
        document.getElementById('puzzle-rush-btn').addEventListener('click', () => {
            this.startPuzzleRush();
        });
    }
    
    loadStats() {
        const savedStats = localStorage.getItem('puzzleStats');
        if (savedStats) {
            return JSON.parse(savedStats);
        }
        
        return {
            total: 0,
            solved: 0,
            failed: 0,
            currentStreak: 0,
            bestStreak: 0,
            lastPlayed: null
        };
    }
    
    saveStats() {
        localStorage.setItem('puzzleStats', JSON.stringify(this.userStats));
    }
    
    startNewPuzzle() {
        // Get puzzle based on user rating
        const userRating = window.accountSystem?.currentUser?.rating || 1200;
        const suitablePuzzles = this.puzzles.filter(p => 
            p.rating >= userRating - 200 && p.rating <= userRating + 200
        );
        
        this.currentPuzzle = suitablePuzzles[Math.floor(Math.random() * suitablePuzzles.length)];
        
        // Initialize renderer if needed
        if (!this.puzzleRenderer) {
            this.puzzleRenderer = new PuzzleRenderer(document.getElementById('puzzle-container'));
        }
        
        this.puzzleRenderer.loadPuzzle(this.currentPuzzle);
        document.querySelector('.puzzle-info').textContent = this.currentPuzzle.description;
    }
    
    startPuzzleRush() {
        // Implement puzzle rush mode
        showPage('puzzle-rush-page');
        
        let score = 0;
        let timeLeft = 60; // 60 seconds
        
        const timerElement = document.getElementById('rush-timer');
        const scoreElement = document.getElementById('rush-score');
        
        const timer = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                this.endPuzzleRush(score);
            }
        }, 1000);
        
        // Load first puzzle
        this.loadRushPuzzle();
    }
    
    loadRushPuzzle() {
        // Load random puzzle for rush mode
        const puzzle = this.puzzles[Math.floor(Math.random() * this.puzzles.length)];
        
        // Render puzzle
        // ... (simplified for brevity)
    }
    
    endPuzzleRush(score) {
        // Show results
        const resultElement = document.createElement('div');
        resultElement.className = 'rush-result';
        resultElement.innerHTML = `
            <h2>Puzzle Rush Complete!</h2>
            <p>Your score: ${score} puzzles</p>
            <button class="btn btn-primary" id="play-again">Play Again</button>
        `;
        
        document.getElementById('puzzle-rush-page').appendChild(resultElement);
        
        document.getElementById('play-again').addEventListener('click', () => {
            document.getElementById('puzzle-rush-page').removeChild(resultElement);
            this.startPuzzleRush();
        });
    }
    
    checkSolution(userMove) {
        if (!this.currentPuzzle) return false;
        
        const solution = this.currentPuzzle.solution;
        const isCorrect = userMove === solution;
        
        // Update stats
        this.userStats.total++;
        
        if (isCorrect) {
            this.userStats.solved++;
            this.userStats.currentStreak++;
            if (this.userStats.currentStreak > this.userStats.bestStreak) {
                this.userStats.bestStreak = this.userStats.currentStreak;
            }
        } else {
            this.userStats.failed++;
            this.userStats.currentStreak = 0;
        }
        
        this.userStats.lastPlayed = new Date().toISOString();
        this.saveStats();
        
        return isCorrect;
    }
    
    getDailyPuzzle() {
        // Get puzzle based on current date
        const today = new Date().toISOString().split('T')[0];
        let index = 0;
        
        for (let i = 0; i < today.length; i++) {
            index += today.charCodeAt(i);
        }
        
        return this.puzzles[index % this.puzzles.length];
    }
    
    renderStats() {
        if (!this.userStats) return;
        
        const statsContainer = document.querySelector('.puzzle-stats');
        if (!statsContainer) return;
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${this.userStats.solved}</div>
                <div class="stat-label">Puzzles Solved</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.userStats.currentStreak}</div>
                <div class="stat-label">Current Streak</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.userStats.bestStreak}</div>
                <div class="stat-label">Best Streak</div>
            </div>
        `;
    }
}

// Puzzle training modes
class PuzzleTrainer {
    constructor() {
        this.modes = {
            daily: {
                name: "Daily Puzzle",
                description: "One new puzzle every day",
                icon: "📆"
            },
            rush: {
                name: "Puzzle Rush",
                description: "Solve as many puzzles as possible in 60 seconds",
                icon: "⚡"
            },
            thematic: {
                name: "Thematic Training",
                description: "Focus on specific tactics like forks or pins",
                icon: "🎯"
            },
            endgame: {
                name: "Endgame Practice",
                description: "Master essential endgame positions",
                icon: "♚"
            }
        };
        
        this.init();
    }
    
    init() {
        const modesContainer = document.querySelector('.puzzle-modes');
        if (!modesContainer) return;
        
        Object.entries(this.modes).forEach(([id, mode]) => {
            const modeElement = document.createElement('div');
            modeElement.className = 'puzzle-mode-card';
            modeElement.innerHTML = `
                <div class="mode-icon">${mode.icon}</div>
                <div class="mode-name">${mode.name}</div>
                <div class="mode-desc">${mode.description}</div>
            `;
            modeElement.addEventListener('click', () => this.startMode(id));
            modesContainer.appendChild(modeElement);
        });
    }
    
    startMode(modeId) {
        switch(modeId) {
            case 'daily':
                showPage('puzzles-page');
                window.puzzleSystem.startNewPuzzle();
                break;
            case 'rush':
                showPage('puzzles-page');
                window.puzzleSystem.startPuzzleRush();
                break;
            case 'thematic':
                this.startThematicTraining();
                break;
            case 'endgame':
                this.startEndgameTraining();
                break;
        }
    }
    
    startThematicTraining() {
        // Show thematic selection
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Thematic Training</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="themes-grid">
                        <div class="theme-card" data-theme="fork">
                            <div class="theme-icon">♞</div>
                            <div>Fork</div>
                        </div>
                        <div class="theme-card" data-theme="pin">
                            <div class="theme-icon">🧷</div>
                            <div>Pin</div>
                        </div>
                        <div class="theme-card" data-theme="skewer">
                            <div class="theme-icon">🔄</div>
                            <div>Skewer</div>
                        </div>
                        <div class="theme-card" data-theme="discovery">
                            <div class="theme-icon">✨</div>
                            <div>Discovery</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        document.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', () => {
                const theme = card.getAttribute('data-theme');
                this.loadThematicPuzzles(theme);
                document.body.removeChild(modal);
            });
        });
    }
    
    loadThematicPuzzles(theme) {
        // Filter puzzles by theme
        const thematicPuzzles = window.puzzleSystem.puzzles.filter(p => 
            p.themes.includes(theme)
        );
        
        if (thematicPuzzles.length === 0) {
            alert(`No puzzles found for theme: ${theme}`);
            return;
        }
        
        window.puzzleSystem.currentPuzzle = thematicPuzzles[0];
        showPage('puzzles-page');
        window.puzzleSystem.puzzleRenderer.loadPuzzle(window.puzzleSystem.currentPuzzle);
    }
    
    startEndgameTraining() {
        // Load endgame puzzles
        const endgamePuzzles = [
            {
                fen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1",
                solution: "",
                description: "King vs King - Draw"
            },
            {
                fen: "4k3/8/8/8/8/8/5Q2/4K3 w - - 0 1",
                solution: "f2f7",
                description: "Queen checkmate"
            }
        ];
        
        window.puzzleSystem.currentPuzzle = endgamePuzzles[0];
        showPage('puzzles-page');
        window.puzzleSystem.puzzleRenderer.loadPuzzle(window.puzzleSystem.currentPuzzle);
    }
}
