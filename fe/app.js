/**
 * Mystery Box Frontend Demo
 * Core Logic & API Integration
 */

const API_BASE = '/api';

// --- State Management ---
const state = {
    token: localStorage.getItem('game_token'),
    user: JSON.parse(localStorage.getItem('user_info')),
    currentView: 'auth',
    products: [],
    inventory: [],
    leaderboard: [],
    gameId: 'MYSTERY_BOX',
    seasonId: 1
};

// --- API Service ---
const ApiService = {
    async request(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (state.token) {
            headers['Authorization'] = `Bearer ${state.token}`;
        }

        if (state.user?.msisdn) {
            headers['x-user-id'] = state.user.msisdn;
        }

        headers['x-game-id'] = state.gameId;

        try {
            const response = await fetch(`${API_BASE}${url}`, { ...options, headers });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'API request failed');
            return result;
        } catch (error) {
            UIController.showToast(error.message, 'error');
            throw error;
        }
    },

    // Auth
    launchGame: (msisdn, fullName) => ApiService.request('/game/launch', {
        method: 'POST',
        body: JSON.stringify({ msisdn, fullName, lang: 'vi', gameType: state.gameId })
    }),

    // Inventory
    getInventory: () => ApiService.request('/inventory'),

    // Shop
    getProducts: () => ApiService.request(`/products?gameId=${state.gameId}`),
    purchase: (productId) => ApiService.request('/purchase', {
        method: 'POST',
        body: JSON.stringify({ productId })
    }),

    // Leaderboard & Score
    getLeaderboard: () => ApiService.request(`/leaderboard?gameId=${state.gameId}&seasonId=${state.seasonId}&userId=${state.user?.msisdn || ''}`),
    submitScore: (score) => ApiService.request('/score/submit', {
        method: 'POST',
        body: JSON.stringify({ userId: state.user?.msisdn, gameId: state.gameId, seasonId: state.seasonId, score })
    }),

    // Prizes/History
    getHistory: () => ApiService.request(`/history?userId=${state.user?.msisdn}&gameId=${state.gameId}&type=reward`),

    // Luckybox
    openLuckybox: () => ApiService.request('/luckybox/open', {
        method: 'POST',
        body: JSON.stringify({ userId: state.user?.msisdn, gameId: state.gameId })
    })
};

// --- UI Controller ---
const UIController = {
    init() {
        this.bindEvents();
        this.checkAuth();
        this.handleUrlToken();
        this.hideLoader();
    },

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });

        // Forms
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // Modals
        document.getElementById('submitScoreBtn').addEventListener('click', () => this.toggleModal('scoreModal', true));
        document.getElementById('cancelScore').addEventListener('click', () => this.toggleModal('scoreModal', false));
        document.getElementById('confirmScore').addEventListener('click', () => this.handleSubmitScore());

        // Luckybox
        document.getElementById('openBoxBtn').addEventListener('click', () => this.handleOpenBox());
    },

    // Auth Logic
    async handleLogin(e) {
        e.preventDefault();
        const msisdn = document.getElementById('msisdn').value;
        const fullName = document.getElementById('fullName').value;

        try {
            const res = await ApiService.launchGame(msisdn, fullName);
            if (res.success) {
                const url = new URL(res.data.web_url);
                const token = url.searchParams.get('token');

                state.token = token;
                state.user = { msisdn, fullName };

                localStorage.setItem('game_token', token);
                localStorage.setItem('user_info', JSON.stringify(state.user));

                this.showToast('Login successful!');
                this.checkAuth();
            }
        } catch (err) {
            console.error('Login failed', err);
        }
    },

    handleLogout() {
        localStorage.clear();
        state.token = null;
        state.user = null;
        this.checkAuth();
        this.showToast('Logged out');
    },

    checkAuth() {
        if (state.token && state.user) {
            document.getElementById('userProfile').classList.remove('hidden');
            document.getElementById('userNameDisplay').textContent = state.user.fullName;
            document.getElementById('welcomeName').textContent = state.user.fullName;
            document.getElementById('navLinks').classList.remove('hidden');
            this.switchView('dashboard');
        } else {
            document.getElementById('userProfile').classList.add('hidden');
            document.getElementById('navLinks').classList.add('hidden');
            this.switchView('auth');
        }
    },

    handleUrlToken() {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            state.token = token;
            localStorage.setItem('game_token', token);
            // If we don't have user info, we might need to fetch it from backend
            // For now, assume a mock user or wait for an endpoint to fetch profile
            if (!state.user) {
                state.user = { msisdn: 'unknown', fullName: 'Player' };
            }
            this.checkAuth();
            // Clear URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    },

    // View Switching
    switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        const targetView = document.getElementById(`${viewId}View`);
        if (targetView) targetView.classList.remove('hidden');

        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewId);
        });

        state.currentView = viewId;
        this.loadViewData(viewId);
    },

    async loadViewData(viewId) {
        if (!state.token && viewId !== 'auth') return;

        switch (viewId) {
            case 'shop': await this.renderShop(); break;
            case 'inventory': await this.renderInventory(); break;
            case 'leaderboard': await this.renderLeaderboard(); break;
            case 'history': await this.renderHistory(); break;
            case 'dashboard': await this.updateDashboard(); break;
        }
    },

    // Rendering Logic
    async renderShop() {
        const container = document.getElementById('productList');
        try {
            const res = await ApiService.getProducts();
            state.products = res.data || [];
            if (state.products.length === 0) {
                container.innerHTML = '<div class="empty-state">No products available.</div>';
                return;
            }
            container.innerHTML = state.products.map(p => `
                <div class="item-card">
                    <div class="item-img">📦</div>
                    <div class="item-info">
                        <h3>${p.name || 'Product'}</h3>
                        <p class="item-price">${p.price} Coins</p>
                        <button class="btn-primary" onclick="UIController.handlePurchase(${p.id})">Buy Now</button>
                    </div>
                </div>
            `).join('');
        } catch (err) { container.innerHTML = '<div class="empty-state">Failed to load shop.</div>'; }
    },

    async renderInventory() {
        const container = document.getElementById('inventoryList');
        try {
            const res = await ApiService.getInventory();
            state.inventory = res.data || [];
            if (state.inventory.length === 0) {
                container.innerHTML = '<div class="empty-state">Your inventory is empty.</div>';
                return;
            }
            container.innerHTML = state.inventory.map(item => `
                <div class="item-card">
                    <div class="item-img">💎</div>
                    <div class="item-info">
                        <h3>${item.Item?.name || 'Item'}</h3>
                        <p>Quantity: ${item.quantity}</p>
                        <button class="btn-secondary" onclick="UIController.handleUseItem(${item.itemId})">Use Item</button>
                    </div>
                </div>
            `).join('');
        } catch (err) { container.innerHTML = '<div class="empty-state">Failed to load inventory.</div>'; }
    },

    async renderLeaderboard() {
        const list = document.getElementById('leaderboardRows');
        const myRank = document.getElementById('myRankRow');
        try {
            const res = await ApiService.getLeaderboard();
            const lb = res.data.leaderboard || [];
            const me = res.data.me;

            list.innerHTML = lb.map((p, i) => `
                <div class="leaderboard-row">
                    <span class="rank-badge rank-${i + 1}">${i + 1}</span>
                    <span>${p.fullName || p.msisdn}</span>
                    <span>${p.score}</span>
                </div>
            `).join('');

            if (me) {
                myRank.classList.remove('hidden');
                myRank.innerHTML = `
                    <div class="leaderboard-row">
                        <span class="rank-badge">${me.rank}</span>
                        <span>Your Rank (${state.user.fullName})</span>
                        <span>${me.score}</span>
                    </div>
                `;
                document.getElementById('currentScoreDisplay').textContent = me.score;
            }
        } catch (err) { list.innerHTML = '<div class="empty-state">Failed to load leaderboard.</div>'; }
    },

    async renderHistory() {
        const body = document.getElementById('historyBody');
        try {
            const res = await ApiService.getHistory();
            const history = res.data.items || [];
            if (history.length === 0) {
                body.innerHTML = '<tr><td colspan="3" style="text-align:center">No records found.</td></tr>';
                return;
            }
            body.innerHTML = history.map(h => `
                <tr>
                    <td>${new Date(h.createdAt).toLocaleDateString()}</td>
                    <td>${h.Item?.name || 'Random Prize'}</td>
                    <td><span class="status-pill status-completed">Delivered</span></td>
                </tr>
            `).join('');
        } catch (err) { body.innerHTML = '<tr><td colspan="3">Error loading history</td></tr>'; }
    },

    async updateDashboard() {
        // Just refresh leaderboard for score
        await this.renderLeaderboard();
    },

    // Actions
    async handlePurchase(productId) {
        try {
            await ApiService.purchase(productId);
            this.showToast('Purchase successful!', 'success');
            await this.renderInventory();
        } catch (err) { }
    },

    async handleUseItem(itemId) {
        try {
            // Mock sessionId for now
            this.showToast('Item used!', 'success');
            await this.renderInventory();
        } catch (err) { }
    },

    async handleSubmitScore() {
        const score = parseInt(document.getElementById('scoreInput').value);
        if (isNaN(score)) return;

        try {
            await ApiService.submitScore(score);
            this.showToast('Score submitted!', 'success');
            this.toggleModal('scoreModal', false);
            await this.renderLeaderboard();
        } catch (err) { }
    },

    async handleOpenBox() {
        try {
            const res = await ApiService.openLuckybox();
            this.showToast(`You won: ${res.data.itemName || 'something special'}!`, 'success');
            await this.renderInventory();
        } catch (err) { }
    },

    // Helpers
    toggleModal(id, show) {
        document.getElementById(id).classList.toggle('hidden', !show);
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    hideLoader() {
        setTimeout(() => {
            document.getElementById('loader').style.opacity = '0';
            setTimeout(() => document.getElementById('loader').classList.add('hidden'), 500);
        }, 800);
    }
};

// Global entry point
window.UIController = UIController;
document.addEventListener('DOMContentLoaded', () => UIController.init());
