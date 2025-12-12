// User authentication and profile management system
class UserSystem {
    constructor() {
        this.currentUser = this.loadUser();
        this.friends = this.loadFriends();
        this.initEventListeners();
    }
    
    loadUser() {
        const savedUser = localStorage.getItem('chessUser');
        if (savedUser) {
            return JSON.parse(savedUser);
        }
        
        const defaultUser = {
            id: `user_${Date.now()}`,
            username: `Guest${Math.floor(Math.random() * 10000)}`,
            email: '',
            password: '',
            rating: 1200,
            games: { total: 0, wins: 0, losses: 0, draws: 0 },
            puzzles: { solved: 0, streak: 0, bestStreak: 0 },
            settings: {
                boardTheme: 'classic',
                pieceSet: 'standard',
                sound: true,
                notifications: true,
                showCoordinates: true
            },
            friends: [],
            lastLogin: new Date().toISOString()
        };
        
        localStorage.setItem('chessUser', JSON.stringify(defaultUser));
        return defaultUser;
    }
    
    loadFriends() {
        // Default friends list
        return [
            { id: 1, username: 'ChessMaster99', status: 'online', rating: 1850, avatar: 'CM' },
            { id: 2, username: 'GrandmasterX', status: 'online', rating: 2100, avatar: 'GX' },
            { id: 3, username: 'HikaruFan', status: 'offline', rating: 1650, avatar: 'HF' },
            { id: 4, username: 'MagnusLover', status: 'online', rating: 1950, avatar: 'ML' },
            { id: 5, username: 'TacticsQueen', status: 'offline', rating: 1750, avatar: 'TQ' }
        ];
    }
    
    saveUser() {
        localStorage.setItem('chessUser', JSON.stringify(this.currentUser));
    }
    
    initEventListeners() {
        document.getElementById('account-btn').addEventListener('click', () => {
            showPage('account-page');
            this.renderAccountPage();
        });
        
        document.getElementById('search-btn').addEventListener('click', () => {
            showModal('search-modal');
            this.renderSearchResults();
        });
        
        document.getElementById('close-search').addEventListener('click', () => {
            hideModal('search-modal');
        });
        
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
        
        document.getElementById('edit-profile-btn').addEventListener('click', () => {
            this.showEditProfileModal();
        });
        
        // Theme selection
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const theme = e.target.getAttribute('data-theme');
                this.setTheme(theme);
            });
        });
        
        // Piece set selection
        document.querySelectorAll('.piece-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const pieceSet = e.target.getAttribute('data-piece');
                this.setPieceSet(pieceSet);
            });
        });
        
        // Sound settings
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.currentUser.settings.sound = e.target.checked;
            this.saveUser();
        });
        
        document.getElementById('notifications-toggle').addEventListener('change', (e) => {
            this.currentUser.settings.notifications = e.target.checked;
            this.saveUser();
        });
        
        document.getElementById('coordinates-toggle').addEventListener('change', (e) => {
            this.currentUser.settings.showCoordinates = e.target.checked;
            this.saveUser();
            
            if (window.boardRenderer) {
                window.boardRenderer.setShowCoordinates(e.target.checked);
            }
        });
    }
    
    renderAccountPage() {
        const user = this.currentUser;
        
        // Profile section
        document.querySelector('.profile-username').textContent = user.username;
        document.querySelector('.profile-rating').textContent = `Rating: ${user.rating}`;
        
        // Avatar initial
        const avatar = document.querySelector('.profile-avatar');
        if (avatar) {
            avatar.textContent = user.username.charAt(0).toUpperCase();
        }
        
        // Game stats
        document.querySelector('.stat-wins').textContent = user.games.wins;
        document.querySelector('.stat-losses').textContent = user.games.losses;
        document.querySelector('.stat-draws').textContent = user.games.draws;
        
        // Puzzle stats
        document.querySelector('.stat-puzzles').textContent = user.puzzles.solved;
        document.querySelector('.stat-streak').textContent = user.puzzles.streak;
        
        // Friends list
        this.renderFriendsList();
        
        // Settings
        document.getElementById('sound-toggle').checked = user.settings.sound;
        document.getElementById('notifications-toggle').checked = user.settings.notifications;
        document.getElementById('coordinates-toggle').checked = user.settings.showCoordinates;
        
        // Set active theme
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-theme') === user.settings.boardTheme) {
                option.classList.add('active');
            }
        });
        
        // Set active piece set
        document.querySelectorAll('.piece-option').forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-piece') === user.settings.pieceSet) {
                option.classList.add('active');
            }
        });
    }
    
    renderFriendsList() {
        const container = document.querySelector('.friends-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.friends.forEach(friend => {
            const friendElement = document.createElement('div');
            friendElement.className = 'friend-item';
            friendElement.innerHTML = `
                <div class="friend-avatar" style="background: ${this.getAvatarColor(friend.id)};">
                    ${friend.avatar}
                </div>
                <div class="friend-info">
                    <div class="friend-name">${friend.username}</div>
                    <div class="friend-status" style="color: ${friend.status === 'online' ? '#00b87c' : '#aaa'};">
                        ${friend.status === 'online' ? '● Online' : '○ Offline'} • ${friend.rating}
                    </div>
                </div>
                <button class="btn challenge-btn" data-id="${friend.id}">Challenge</button>
            `;
            container.appendChild(friendElement);
        });
        
        // Add event listeners to challenge buttons
        document.querySelectorAll('.challenge-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const friendId = e.target.getAttribute('data-id');
                this.sendChallenge(friendId);
            });
        });
    }
    
    getAvatarColor(id) {
        const colors = [
            '#00b87c', '#007a5c', '#3a86ff', '#8338ec', 
            '#ff006e', '#fb5607', '#ffbe0b', '#3a86ff'
        ];
        return colors[id % colors.length];
    }
    
    renderSearchResults() {
        const container = document.getElementById('search-results');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.friends.forEach(friend => {
            if (friend.username.toLowerCase().includes('grand')) {
                const resultElement = document.createElement('div');
                resultElement.className = 'player-result';
                resultElement.innerHTML = `
                    <div class="player-info">
                        <div class="player-avatar" style="background: ${this.getAvatarColor(friend.id)};">
                            ${friend.avatar}
                        </div>
                        <div>
                            <div class="player-name">${friend.username}</div>
                            <div class="player-rating">${friend.rating} • ${friend.status}</div>
                        </div>
                    </div>
                    <button class="btn challenge-btn" data-id="${friend.id}">Challenge</button>
                `;
                container.appendChild(resultElement);
            }
        });
        
        // Add event listeners to challenge buttons
        document.querySelectorAll('.challenge-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const friendId = e.target.getAttribute('data-id');
                this.sendChallenge(friendId);
                hideModal('search-modal');
            });
        });
    }
    
    sendChallenge(friendId) {
        const friend = this.friends.find(f => f.id == friendId);
        if (!friend) return;
        
        // Show challenge confirmation
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Send Challenge</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Challenge ${friend.username} to a game?</p>
                    <div class="challenge-options">
                        <div class="time-control active" data-time="bullet">1|0</div>
                        <div class="time-control" data-time="blitz">5|0</div>
                        <div class="time-control" data-time="rapid">10|0</div>
                    </div>
                    <button class="btn btn-primary" id="send-challenge-btn">Send Challenge</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        let selectedTime = 'bullet';
        document.querySelectorAll('.time-control').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.time-control').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                selectedTime = option.getAttribute('data-time');
            });
        });
        
        document.getElementById('send-challenge-btn').addEventListener('click', () => {
            // In real app, this would send to server
            alert(`Challenge sent to ${friend.username} for ${selectedTime} game!`);
            document.body.removeChild(modal);
            
            // Start game immediately for demo
            if (window.gameLogic) {
                window.gameLogic.startNewGame(selectedTime);
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
        
        if (result.includes('wins')) {
            if (result.includes('white') && this.currentUser.color === 'white') {
                this.currentUser.games.wins++;
            } else if (result.includes('black') && this.currentUser.color === 'black') {
                this.currentUser.games.wins++;
            } else {
                this.currentUser.games.losses++;
            }
        } else {
            this.currentUser.games.draws++;
        }
        
        // Update rating (simplified)
        if (result.includes('wins') && 
            ((result.includes('white') && this.currentUser.color === 'white') || 
             (result.includes('black') && this.currentUser.color === 'black'))) {
            this.currentUser.rating += 10;
        } else if (result.includes('wins')) {
            this.currentUser.rating -= 5;
        }
        
        this.saveUser();
    }
    
    updatePuzzleResult(isCorrect) {
        if (isCorrect) {
            this.currentUser.puzzles.solved++;
            this.currentUser.puzzles.streak++;
            if (this.currentUser.puzzles.streak > this.currentUser.puzzles.bestStreak) {
                this.currentUser.puzzles.bestStreak = this.currentUser.puzzles.streak;
            }
            this.currentUser.rating += 2;
        } else {
            this.currentUser.puzzles.streak = 0;
            this.currentUser.rating -= 1;
        }
        
        this.saveUser();
    }
    
    showEditProfileModal() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Profile</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="username-input" value="${this.currentUser.username}">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="email-input" value="${this.currentUser.email || ''}">
                    </div>
                    <button class="btn btn-primary" id="save-profile-btn">Save Changes</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        document.getElementById('save-profile-btn').addEventListener('click', () => {
            const newUsername = document.getElementById('username-input').value;
            const newEmail = document.getElementById('email-input').value;
            
            if (newUsername.length < 3) {
                alert('Username must be at least 3 characters');
                return;
            }
            
            this.currentUser.username = newUsername;
            this.currentUser.email = newEmail;
            this.saveUser();
            
            this.renderAccountPage();
            document.body.removeChild(modal);
            
            alert('Profile updated successfully!');
        });
    }
    
    logout() {
        // Clear current session
        localStorage.removeItem('chessUser');
        
        // Redirect to login page (simulated)
        showPage('home-page');
        
        // Reset to default user
        this.currentUser = this.loadUser();
        
        alert('You have been logged out.');
    }
}

// Notification system
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.init();
    }
    
    init() {
        // Simulate incoming notifications
        setTimeout(() => {
            this.addNotification({
                type: 'challenge',
                title: 'Game Challenge',
                message: 'ChessMaster99 challenged you to a bullet game!',
                time: '2m ago',
                action: () => {
                    if (window.gameLogic) {
                        window.gameLogic.startNewGame('bullet');
                    }
                }
            });
        }, 5000);
        
        setTimeout(() => {
            this.addNotification({
                type: 'puzzle',
                title: 'Daily Puzzle',
                message: 'A new puzzle is available!',
                time: '5m ago',
                action: () => {
                    showPage('puzzles-page');
                    if (window.puzzleSystem) {
                        window.puzzleSystem.startNewPuzzle();
                    }
                }
            });
        }, 10000);
    }
    
    addNotification(notification) {
        this.notifications.unshift({
            id: Date.now(),
            read: false,
            ...notification
        });
        
        this.renderNotifications();
        
        // Show toast notification
        this.showToast(notification);
    }
    
    renderNotifications() {
        const container = document.querySelector('.notifications-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.notifications.slice(0, 5).forEach(notification => {
            const notifElement = document.createElement('div');
            notifElement.className = `notification ${notification.read ? '' : 'unread'}`;
            notifElement.innerHTML = `
                <div class="notification-icon ${notification.type}">
                    ${this.getIconForType(notification.type)}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${notification.time}</div>
                </div>
            `;
            
            if (notification.action) {
                notifElement.addEventListener('click', () => {
                    notification.read = true;
                    notification.action();
                    this.renderNotifications();
                });
            }
            
            container.appendChild(notifElement);
        });
        
        // Update notification count
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = unreadCount > 0 ? unreadCount : '';
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }
    
    getIconForType(type) {
        switch(type) {
            case 'challenge': return '♟';
            case 'puzzle': return '🧩';
            case 'message': return '💬';
            case 'system': return '⚙️';
            default: return '🔔';
        }
    }
    
    showToast(notification) {
        if (!this.currentUser?.settings?.notifications) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="toast-icon">${this.getIconForType(notification.type)}</div>
            <div class="toast-content">
                <div class="toast-title">${notification.title}</div>
                <div class="toast-message">${notification.message}</div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}
