// Real-time game logic with time controls and multiplayer simulation
class GameLogic {
    constructor(uiRenderer) {
        this.uiRenderer = uiRenderer;
        this.currentGame = null;
        this.timeControls = {
            rapid: { baseTime: 600, increment: 0 },    // 10 minutes
            blitz: { baseTime: 300, increment: 0 },    // 5 minutes
            bullet: { baseTime: 60, increment: 0 },    // 1 minute
            classical: { baseTime: 1800, increment: 30 } // 30 minutes + 30s increment
        };
        this.playerTimes = { white: 0, black: 0 };
        this.clockInterval = null;
        this.initEventListeners();
    }
    
    initEventListeners() {
        document.getElementById('play-btn').addEventListener('click', () => {
            showPage('play-page');
        });
        
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                const mode = card.getAttribute('data-mode');
                this.startNewGame(mode);
            });
        });
        
        document.getElementById('resign-btn').addEventListener('click', () => {
            this.handleResignation();
        });
        
        document.getElementById('draw-btn').addEventListener('click', () => {
            this.offerDraw();
        });
    }
    
    startNewGame(mode) {
        if (!this.timeControls[mode]) {
            console.error(`Invalid game mode: ${mode}`);
            return;
        }
        
        const timeControl = this.timeControls[mode];
        
        // Initialize chess engine
        this.currentGame = new ChessEngine();
        
        // Set initial times
        this.playerTimes.white = timeControl.baseTime;
        this.playerTimes.black = timeControl.baseTime;
        
        // Update UI
        this.updateClockDisplay();
        
        // Start clock for white player
        this.startClock('white');
        
        // Render board
        this.uiRenderer.setGame(this.currentGame);
        showPage('game-page');
    }
    
    startClock(player) {
        clearInterval(this.clockInterval);
        
        this.clockInterval = setInterval(() => {
            if (this.currentGame.gameOver) {
                clearInterval(this.clockInterval);
                return;
            }
            
            this.playerTimes[player]--;
            
            // Check for timeout
            if (this.playerTimes[player] <= 0) {
                this.handleTimeout(player);
                return;
            }
            
            this.updateClockDisplay();
        }, 1000);
    }
    
    updateClockDisplay() {
        document.querySelectorAll('.timer').forEach((el, index) => {
            const player = index === 0 ? 'black' : 'white';
            const seconds = this.playerTimes[player];
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            el.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            
            // Highlight low time
            if (seconds < 10) {
                el.style.color = 'red';
            } else {
                el.style.color = '';
            }
        });
    }
    
    handleMove(fromRow, fromCol, toRow, toCol) {
        if (!this.currentGame) return;
        
        const success = this.currentGame.makeMove(fromRow, fromCol, toRow, toCol);
        
        if (success) {
            // Stop current clock
            clearInterval(this.clockInterval);
            
            // Apply increment
            const currentPlayer = this.currentGame.currentPlayer === 'white' ? 'black' : 'white';
            const timeControl = this.timeControls[this.currentGame.mode];
            this.playerTimes[currentPlayer] += timeControl.increment;
            
            // Start opponent's clock
            this.startClock(this.currentGame.currentPlayer);
            
            // Update UI
            this.uiRenderer.render();
            this.updateClockDisplay();
            
            // Check game end
            if (this.currentGame.gameOver) {
                this.endGame();
            }
        }
    }
    
    handleTimeout(player) {
        clearInterval(this.clockInterval);
        
        const winner = player === 'white' ? 'black' : 'white';
        this.currentGame.gameOver = true;
        this.currentGame.gameResult = `${winner} wins on time`;
        
        this.showGameResult();
    }
    
    handleResignation() {
        if (!this.currentGame || this.currentGame.gameOver) return;
        
        const resigningPlayer = this.currentGame.currentPlayer;
        const winner = resigningPlayer === 'white' ? 'black' : 'white';
        
        this.currentGame.gameOver = true;
        this.currentGame.gameResult = `${winner} wins by resignation`;
        
        clearInterval(this.clockInterval);
        this.showGameResult();
    }
    
    offerDraw() {
        // Simplified draw handling
        if (confirm("Do you accept the draw offer?")) {
            this.currentGame.gameOver = true;
            this.currentGame.gameResult = "Draw by agreement";
            clearInterval(this.clockInterval);
            this.showGameResult();
        }
    }
    
    endGame() {
        clearInterval(this.clockInterval);
        this.showGameResult();
    }
    
    showGameResult() {
        const resultElement = document.createElement('div');
        resultElement.className = 'game-result-modal';
        resultElement.innerHTML = `
            <div class="modal-content">
                <h2>Game Over</h2>
                <p>${this.currentGame.gameResult}</p>
                <div class="result-buttons">
                    <button class="btn btn-primary" id="new-game-btn">New Game</button>
                    <button class="btn" id="home-btn">Home</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(resultElement);
        
        document.getElementById('new-game-btn').addEventListener('click', () => {
            document.body.removeChild(resultElement);
            showPage('play-page');
        });
        
        document.getElementById('home-btn').addEventListener('click', () => {
            document.body.removeChild(resultElement);
            showPage('home-page');
        });
    }
    
    // Multiplayer simulation
    simulateMultiplayer() {
        // In a real app, this would connect to WebSockets
        // For demo, we'll simulate AI moves
        if (this.currentGame.gameOver) return;
        
        setTimeout(() => {
            if (this.currentGame.gameOver) return;
            
            const validMoves = [];
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const piece = this.currentGame.board[r][c];
                    if (piece && piece.color === 'black') {
                        const moves = this.currentGame.getValidMoves(r, c);
                        moves.forEach(move => {
                            validMoves.push({ from: [r, c], to: move });
                        });
                    }
                }
            }
            
            if (validMoves.length > 0) {
                const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                this.handleMove(
                    randomMove.from[0],
                    randomMove.from[1],
                    randomMove.to[0],
                    randomMove.to[1]
                );
            }
        }, 1500);
    }
}

// Account system with localStorage persistence
class AccountSystem {
    constructor() {
        this.currentUser = this.loadUser();
        this.initEventListeners();
    }
    
    loadUser() {
        const savedUser = localStorage.getItem('chessUser');
        if (savedUser) {
            return JSON.parse(savedUser);
        }
        
        // Create default user
        return {
            username: 'GuestPlayer',
            rating: 1200,
            games: { total: 0, wins: 0, losses: 0, draws: 0 },
            puzzles: { solved: 0, streak: 0, bestStreak: 0 },
            settings: {
                boardTheme: 'classic',
                pieceSet: 'standard',
                sound: true,
                notifications: true
            },
            friends: [
                { username: 'ChessMaster99', status: 'online', rating: 1850 },
                { username: 'GrandmasterX', status: 'online', rating: 2100 },
                { username: 'HikaruFan', status: 'offline', rating: 1650 }
            ],
            lastLogin: new Date().toISOString()
        };
    }
    
    saveUser() {
        localStorage.setItem('chessUser', JSON.stringify(this.currentUser));
    }
    
    initEventListeners() {
        document.getElementById('account-btn').addEventListener('click', () => {
            showPage('account-page');
            this.renderAccountPage();
        });
        
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const theme = e.target.getAttribute('data-theme');
                this.setTheme(theme);
            });
        });
        
        document.querySelectorAll('.piece-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const pieceSet = e.target.getAttribute('data-piece');
                this.setPieceSet(pieceSet);
            });
        });
    }
    
    renderAccountPage() {
        const user = this.currentUser;
        
        // Update profile section
        document.querySelector('.player-name').textContent = user.username;
        document.querySelector('.player-rating').textContent = `Rating: ${user.rating}`;
        
        // Update stats
        document.querySelector('.win-count').textContent = user.games.wins;
        document.querySelector('.loss-count').textContent = user.games.losses;
        document.querySelector('.draw-count').textContent = user.games.draws;
        document.querySelector('.puzzle-streak').textContent = user.puzzles.streak;
        
        // Update friends list
        const friendsContainer = document.querySelector('.friends-grid');
        friendsContainer.innerHTML = '';
        
        user.friends.forEach(friend => {
            const friendCard = document.createElement('div');
            friendCard.className = 'friend-card';
            friendCard.innerHTML = `
                <div class="friend-avatar">${friend.username.charAt(0)}</div>
                <div class="friend-name">${friend.username}</div>
                <div class="status" style="color: ${friend.status === 'online' ? '#00b87c' : '#aaa'};">
                    ${friend.status === 'online' ? '● Online' : '○ Offline'} • ${friend.rating}
                </div>
            `;
            friendsContainer.appendChild(friendCard);
        });
        
        // Set active theme
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-theme') === user.settings.boardTheme) {
                option.classList.add('active');
            }
        });
    }
    
    setTheme(theme) {
        this.currentUser.settings.boardTheme = theme;
        this.saveUser();
        
        if (window.boardRenderer) {
            window.boardRenderer.setTheme(theme);
        }
    }
    
    setPieceSet(pieceSet) {
        this.currentUser.settings.pieceSet = pieceSet;
        this.saveUser();
        
        if (window.boardRenderer) {
            window.boardRenderer.setPieceSet(pieceSet);
        }
    }
    
    updateGameResult(result) {
        this.currentUser.games.total++;
        
        if (result.includes('white wins')) {
            if (this.currentUser.color === 'white') this.currentUser.games.wins++;
            else this.currentUser.games.losses++;
        } else if (result.includes('black wins')) {
            if (this.currentUser.color === 'black') this.currentUser.games.wins++;
            else this.currentUser.games.losses++;
        } else {
            this.currentUser.games.draws++;
        }
        
        this.saveUser();
    }
}
