// Canvas-based board renderer with animations and themes
class BoardRenderer {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            theme: 'classic',
            pieceSet: 'standard',
            showCoordinates: true,
            animationSpeed: 300,
            ...options
        };
        
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.squareSize = 60;
        this.boardOffset = { x: 20, y: 20 };
        this.selectedSquare = null;
        this.possibleMoves = [];
        this.animationQueue = [];
        this.draggingPiece = null;
        this.dragOffset = { x: 0, y: 0 };
        
        this.themes = {
            classic: {
                light: '#f0d9b5',
                dark: '#b58863',
                border: '#00b87c',
                highlight: 'rgba(255, 255, 0, 0.4)'
            },
            modern: {
                light: '#e6e8e3',
                dark: '#567268',
                border: '#007a5c',
                highlight: 'rgba(0, 122, 92, 0.5)'
            },
            glass: {
                light: 'rgba(255, 255, 255, 0.1)',
                dark: 'rgba(0, 0, 0, 0.2)',
                border: 'rgba(255, 255, 255, 0.1)',
                highlight: 'rgba(0, 184, 124, 0.3)'
            },
            wood: {
                light: '#f1d9b5',
                dark: '#85634d',
                border: '#5c3c21',
                highlight: 'rgba(255, 255, 0, 0.3)'
            }
        };
        
        this.pieceSets = {
            standard: {
                white: {
                    pawn: '♙', knight: '♘', bishop: '♗',
                    rook: '♖', queen: '♕', king: '♔'
                },
                black: {
                    pawn: '♟', knight: '♞', bishop: '♝',
                    rook: '♜', queen: '♛', king: '♚'
                }
            },
            'alpha': {
                white: {
                    pawn: '♟', knight: '♞', bishop: '♝',
                    rook: '♜', queen: '♛', king: '♚'
                },
                black: {
                    pawn: '♙', knight: '♘', bishop: '♗',
                    rook: '♖', queen: '♕', king: '♔'
                }
            }
        };
        
        this.init();
    }
    
    init() {
        this.container.appendChild(this.canvas);
        this.resizeCanvas();
        this.setupEventListeners();
        this.render();
    }
    
    resizeCanvas() {
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;
        
        this.squareSize = Math.min(
            (containerWidth - 40) / 8,
            (containerHeight - 40) / 8,
            80 // Max square size
        );
        
        this.canvas.width = this.squareSize * 8 + 40;
        this.canvas.height = this.squareSize * 8 + 40;
        this.render();
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleMouseDown(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMouseMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp(e.changedTouches[0]);
        });
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.floor((x - 20) / this.squareSize);
        const row = Math.floor((y - 20) / this.squareSize);
        
        if (row >= 0 && row < 8 && col >= 0 && col < 8) {
            this.selectedSquare = [row, col];
            this.possibleMoves = this.game.getValidMoves(row, col) || [];
            this.draggingPiece = this.game.board[row][col];
            
            if (this.draggingPiece) {
                this.dragOffset = {
                    x: x - (col * this.squareSize + 20 + this.squareSize / 2),
                    y: y - (row * this.squareSize + 20 + this.squareSize / 2)
                };
            }
            
            this.render();
        }
    }
    
    handleMouseMove(e) {
        if (this.draggingPiece) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.dragPosition = {
                x: x - this.dragOffset.x,
                y: y - this.dragOffset.y
            };
            
            this.render();
        }
    }
    
    handleMouseUp(e) {
        if (this.draggingPiece) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const col = Math.floor((x - 20) / this.squareSize);
            const row = Math.floor((y - 20) / this.squareSize);
            
            if (row >= 0 && row < 8 && col >= 0 && col < 8) {
                const [fromRow, fromCol] = this.selectedSquare;
                if (this.game.makeMove(fromRow, fromCol, row, col)) {
                    // Add move animation
                    this.addAnimation({
                        type: 'move',
                        from: [fromRow, fromCol],
                        to: [row, col],
                        piece: this.draggingPiece
                    });
                }
            }
            
            this.draggingPiece = null;
            this.dragPosition = null;
            this.selectedSquare = null;
            this.possibleMoves = [];
            this.render();
        }
    }
    
    render() {
        this.drawBoard();
        this.drawPieces();
        this.drawHighlights();
        this.drawCoordinates();
        this.drawDraggingPiece();
    }
    
    drawBoard() {
        const theme = this.themes[this.options.theme] || this.themes.classic;
        
        // Draw border
        this.ctx.fillStyle = theme.border;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw squares
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const x = col * this.squareSize + 20;
                const y = row * this.squareSize + 20;
                const isLight = (row + col) % 2 === 0;
                
                this.ctx.fillStyle = isLight ? theme.light : theme.dark;
                this.ctx.fillRect(x, y, this.squareSize, this.squareSize);
                
                // Highlight selected square
                if (this.selectedSquare && this.selectedSquare[0] === row && this.selectedSquare[1] === col) {
                    this.ctx.fillStyle = theme.highlight;
                    this.ctx.fillRect(x, y, this.squareSize, this.squareSize);
                }
                
                // Highlight possible moves
                if (this.possibleMoves.some(([r, c]) => r === row && c === col)) {
                    this.ctx.fillStyle = 'rgba(0, 184, 124, 0.5)';
                    this.ctx.beginPath();
                    this.ctx.arc(
                        x + this.squareSize / 2,
                        y + this.squareSize / 2,
                        15,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fill();
                    
                    // Capture indicator
                    if (this.game.board[row][col]) {
                        this.ctx.strokeStyle = 'rgba(220, 50, 50, 0.8)';
                        this.ctx.lineWidth = 3;
                        this.ctx.beginPath();
                        this.ctx.arc(
                            x + this.squareSize / 2,
                            y + this.squareSize / 2,
                            15,
                            0,
                            Math.PI * 2
                        );
                        this.ctx.stroke();
                    }
                }
            }
        }
    }
    
    drawPieces() {
        const pieces = this.pieceSets[this.options.pieceSet] || this.pieceSets.standard;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece) {
                    const x = col * this.squareSize + 20 + this.squareSize / 2;
                    const y = row * this.squareSize + 20 + this.squareSize / 2;
                    
                    this.ctx.font = `${this.squareSize * 0.7}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillStyle = piece.color === 'white' ? 'white' : 'black';
                    
                    const symbol = pieces[piece.color][piece.type];
                    this.ctx.fillText(symbol, x, y);
                }
            }
        }
    }
    
    drawHighlights() {
        // Draw check indicator
        const kingPos = this.game.findKing(this.game.currentPlayer);
        if (kingPos && this.game.inCheck[this.game.currentPlayer]) {
            const [row, col] = kingPos;
            const x = col * this.squareSize + 20;
            const y = row * this.squareSize + 20;
            
            this.ctx.fillStyle = 'rgba(220, 50, 50, 0.3)';
            this.ctx.fillRect(x, y, this.squareSize, this.squareSize);
        }
    }
    
    drawCoordinates() {
        if (!this.options.showCoordinates) return;
        
        const theme = this.themes[this.options.theme] || this.themes.classic;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = theme.light;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Files (a-h)
        for (let col = 0; col < 8; col++) {
            const x = col * this.squareSize + 20 + this.squareSize / 2;
            const y = this.canvas.height - 10;
            this.ctx.fillText(String.fromCharCode(97 + col), x, y);
            
            const yTop = 10;
            this.ctx.fillText(String.fromCharCode(97 + col), x, yTop);
        }
        
        // Ranks (1-8)
        for (let row = 0; row < 8; row++) {
            const x = 10;
            const y = row * this.squareSize + 20 + this.squareSize / 2;
            this.ctx.fillText(8 - row, x, y);
            
            const xRight = this.canvas.width - 10;
            this.ctx.fillText(8 - row, xRight, y);
        }
    }
    
    drawDraggingPiece() {
        if (!this.draggingPiece || !this.dragPosition) return;
        
        const pieces = this.pieceSets[this.options.pieceSet] || this.pieceSets.standard;
        const symbol = pieces[this.draggingPiece.color][this.draggingPiece.type];
        
        this.ctx.font = `${this.squareSize * 0.7}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = this.draggingPiece.color === 'white' ? 'white' : 'black';
        
        this.ctx.fillText(
            symbol,
            this.dragPosition.x,
            this.dragPosition.y
        );
    }
    
    addAnimation(animation) {
        this.animationQueue.push(animation);
        this.processAnimations();
    }
    
    processAnimations() {
        if (this.animationQueue.length === 0) return;
        
        const animation = this.animationQueue.shift();
        
        // Handle move animation
        if (animation.type === 'move') {
            const start = Date.now();
            const duration = this.options.animationSpeed;
            
            const animate = () => {
                const elapsed = Date.now() - start;
                const progress = Math.min(elapsed / duration, 1);
                
                this.render();
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        }
        
        if (this.animationQueue.length > 0) {
            setTimeout(() => this.processAnimations(), 50);
        }
    }
    
    setGame(game) {
        this.game = game;
        this.render();
    }
    
    setTheme(theme) {
        this.options.theme = theme;
        this.render();
    }
    
    setPieceSet(pieceSet) {
        this.options.pieceSet = pieceSet;
        this.render();
    }
    
    setShowCoordinates(show) {
        this.options.showCoordinates = show;
        this.render();
    }
}

// Puzzle renderer component
class PuzzleRenderer {
    constructor(container) {
        this.container = container;
        this.currentPuzzle = null;
        this.solution = null;
        this.userMove = null;
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="puzzle-header">
                <h2>Daily Puzzle</h2>
                <div class="puzzle-rating">Rating: 1500</div>
            </div>
            <div class="puzzle-board-container">
                <canvas id="puzzle-board" width="480" height="480"></canvas>
            </div>
            <div class="puzzle-info">
                <div class="puzzle-description">White to play and win</div>
                <div class="puzzle-feedback"></div>
            </div>
            <div class="puzzle-controls">
                <button class="btn btn-primary" id="submit-puzzle">Submit Move</button>
                <button class="btn" id="reset-puzzle">Reset</button>
            </div>
        `;
        
        this.boardCanvas = document.getElementById('puzzle-board');
        this.ctx = this.boardCanvas.getContext('2d');
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('submit-puzzle').addEventListener('click', () => {
            this.checkSolution();
        });
        
        document.getElementById('reset-puzzle').addEventListener('click', () => {
            this.resetPuzzle();
        });
    }
    
    loadPuzzle(puzzle) {
        this.currentPuzzle = puzzle;
        this.solution = puzzle.solution;
        this.userMove = null;
        this.renderPuzzle();
    }
    
    renderPuzzle() {
        // Implement puzzle board rendering
        const ctx = this.ctx;
        const size = this.boardCanvas.width / 8;
        
        // Draw board
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const x = col * size;
                const y = row * size;
                const isLight = (row + col) % 2 === 0;
                
                ctx.fillStyle = isLight ? '#f0d9b5' : '#b58863';
                ctx.fillRect(x, y, size, size);
                
                // Draw pieces from FEN
                if (this.currentPuzzle.fen) {
                    // Parse FEN and draw pieces
                }
            }
        }
        
        // Draw move indicators
        if (this.userMove) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.fillRect(
                this.userMove.toCol * size,
                this.userMove.toRow * size,
                size,
                size
            );
        }
    }
    
    checkSolution() {
        const feedback = document.querySelector('.puzzle-feedback');
        
        if (!this.userMove) {
            feedback.textContent = "Make a move first!";
            feedback.style.color = "red";
            return;
        }
        
        const userMoveStr = `${this.userMove.fromRow}${this.userMove.fromCol}${this.userMove.toRow}${this.userMove.toCol}`;
        
        if (userMoveStr === this.solution) {
            feedback.textContent = "Correct! Brilliant move!";
            feedback.style.color = "#00b87c";
            
            // Show next puzzle after delay
            setTimeout(() => {
                this.loadRandomPuzzle();
            }, 2000);
        } else {
            feedback.textContent = "Try again! Look for a better move.";
            feedback.style.color = "red";
        }
    }
    
    resetPuzzle() {
        this.userMove = null;
        this.renderPuzzle();
        document.querySelector('.puzzle-feedback').textContent = "";
    }
    
    loadRandomPuzzle() {
        // Load random puzzle from database
        const puzzles = [
            {
                fen: "rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 4",
                solution: "3433", // d5e4
                description: "Black to play and win material"
            },
            {
                fen: "r1bqkb1r/ppp2ppp/2n2n2/3pp3/4P3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 6",
                solution: "4353", // e4d5
                description: "White to play and fork"
            }
        ];
        
        const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
        this.loadPuzzle(randomPuzzle);
    }
}
