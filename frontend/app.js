/**
 * Mystery Box Frontend - BẢN FULL CHUẨN DỊCH VỤ & SUBMIT SCORE (Đã tích hợp My Rank)
 */

const API_BASE = 'http://localhost:3000/api';

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

    launchGame: (msisdn, fullName) => ApiService.request('/game/launch', {
        method: 'POST',
        body: JSON.stringify({ msisdn, fullName, lang: 'vi', gameType: state.gameId })
    }),

    getInventory: () => ApiService.request(`/inventory?gameId=${state.gameId}`),

    getProducts: () => ApiService.request(`/products?gameId=${state.gameId}`),
    
    purchase: (productId) => ApiService.request('/purchase', {
        method: 'POST',
        body: JSON.stringify({ 
            productId: Number(productId), 
            gameId: state.gameId 
        })
    }),

    // ✅ Đã cập nhật theo yêu cầu: Leaderboard & Score
    getLeaderboard: () => ApiService.request(`/leaderboard?gameId=${state.gameId}&seasonId=${state.seasonId}&userId=${state.user?.msisdn || ''}`),
    
    submitScore: (score) => ApiService.request('/score/submit', {
        method: 'POST',
        body: JSON.stringify({ 
            userId: state.user?.msisdn, 
            gameId: state.gameId, 
            seasonId: state.seasonId, 
            score: Number(score) 
        })
    }),

    openLuckybox: () => ApiService.request('/luckybox/open', {
        method: 'POST',
        body: JSON.stringify({ gameId: state.gameId })
    }),

    useItem: (itemId) => ApiService.request('/use', {
        method: 'POST',
        body: JSON.stringify({ 
            itemId: Number(itemId), 
            sessionId: "SESS_" + Date.now()
        })
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
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });

        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.handleLogout());

        const submitScoreBtn = document.getElementById('submitScoreBtn');
        if (submitScoreBtn) {
            submitScoreBtn.addEventListener('click', () => this.toggleModal('scoreModal', true));
        }

        const cancelScore = document.getElementById('cancelScore');
        if (cancelScore) {
            cancelScore.addEventListener('click', () => this.toggleModal('scoreModal', false));
        }

        const confirmScore = document.getElementById('confirmScore');
        if (confirmScore) {
            confirmScore.addEventListener('click', () => this.handleSubmitScore());
        }

        const openBoxBtn = document.getElementById('openBoxBtn');
        if (openBoxBtn) {
            openBoxBtn.addEventListener('click', () => this.handleOpenBox());
        }
    },

    async handleSubmitScore() {
        const scoreInput = document.getElementById('scoreInput');
        if (!scoreInput) return;

        const score = parseInt(scoreInput.value);
        if (isNaN(score)) {
            this.showToast('Vui lòng nhập số điểm hợp lệ!', 'error');
            return;
        }

        try {
            await ApiService.submitScore(score);
            this.showToast('Gửi điểm thành công!', 'success');
            
            this.toggleModal('scoreModal', false);
            scoreInput.value = '';

            await this.renderLeaderboard();
        } catch (err) {
            console.error('Submit score failed:', err);
        }
    },

    toggleModal(id, show) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.toggle('hidden', !show);
    },

    // ✅ Đã cập nhật theo yêu cầu: renderLeaderboard mới hỗ trợ My Rank
    async renderLeaderboard() {
        const list = document.getElementById('leaderboardRows');
        const myRank = document.getElementById('myRankRow');
        if (!list) return;

        try {
            const res = await ApiService.getLeaderboard();
            // Cấu trúc res.data.leaderboard theo code bạn gửi
            const lb = res.data.leaderboard || [];
            const me = res.data.me;

            list.innerHTML = lb.map((p, i) => `
                <div class="leaderboard-row">
                    <span class="rank-badge rank-${i + 1}">${i + 1}</span>
                    <span>${p.fullName || p.msisdn || p.phone || 'Người chơi'}</span>
                    <span>${p.score}</span>
                </div>
            `).join('');

            if (me && myRank) {
                myRank.classList.remove('hidden');
                myRank.innerHTML = `
                    <div class="leaderboard-row">
                        <span class="rank-badge">${me.rank}</span>
                        <span>Your Rank (${state.user.fullName}): ${state.user.msisdn}</span>
                        <span>${me.score}</span>
                    </div>
                `;
                const display = document.getElementById('currentScoreDisplay');
                if (display) display.textContent = me.score;
            }
        } catch (err) { 
            console.error(err);
            list.innerHTML = '<div class="empty-state">Failed to load leaderboard.</div>'; 
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const msisdn = document.getElementById('msisdn').value;
        const fullName = document.getElementById('fullName').value;
        try {
            const res = await ApiService.launchGame(msisdn, fullName);
            if (res.success && res.data) {
                let token = res.data.token || new URL(res.data.web_url).searchParams.get('token');
                if (token) {
                    state.token = token;
                    state.user = { msisdn, fullName };
                    localStorage.setItem('game_token', token);
                    localStorage.setItem('user_info', JSON.stringify(state.user));
                    this.showToast('Đăng nhập thành công!', 'success');
                    this.checkAuth();
                }
            }
        } catch (err) { console.error('Login failed', err); }
    },

    handleLogout() {
        localStorage.clear();
        state.token = null;
        state.user = null;
        this.checkAuth();
        this.showToast('Đã đăng xuất');
    },

    checkAuth() {
        if (state.token && state.user) {
            document.getElementById('userProfile')?.classList.remove('hidden');
            document.getElementById('userNameDisplay').textContent = state.user.fullName;
            document.getElementById('welcomeName').textContent = state.user.fullName;
            document.getElementById('navLinks')?.classList.remove('hidden');
            this.switchView('dashboard');
        } else {
            document.getElementById('userProfile')?.classList.add('hidden');
            document.getElementById('navLinks')?.classList.add('hidden');
            this.switchView('auth');
        }
    },

    handleUrlToken() {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            state.token = token;
            localStorage.setItem('game_token', token);
            window.history.replaceState({}, document.title, window.location.pathname);
            this.checkAuth();
        }
    },

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
            case 'dashboard': await this.updateDashboard(); break;
        }
    },

    async renderShop() {
        const container = document.getElementById('productList');
        if (!container) return;
        try {
            const res = await ApiService.getProducts();
            state.products = res.data || [];
            container.innerHTML = state.products.map(p => `
                <div class="item-card">
                    <div class="item-img">📦</div>
                    <div class="item-info">
                        <h3>${p.item_name || 'Sản phẩm'}</h3>
                        <p class="item-price">${p.price} Coins</p>
                        <button class="btn-primary" onclick="UIController.handlePurchase(${p.item_id})">Mua ngay</button>
                    </div>
                </div>
            `).join('');
        } catch (err) { container.innerHTML = 'Lỗi tải Shop.'; }
    },

    async renderInventory() {
        const container = document.getElementById('inventoryList');
        if (!container) return;
        try {
            const res = await ApiService.getInventory();
            state.inventory = res.data || [];
            
            if (state.inventory.length === 0) {
                container.innerHTML = '<div class="empty-state">Túi đồ của bạn đang trống.</div>';
                return;
            }

            container.innerHTML = state.inventory.map(inv => `
                <div class="item-card">
                    <div class="item-img">💎</div>
                    <div class="item-info">
                        <h3>${inv.item?.item_name || 'Vật phẩm'}</h3>
                        <p>Số lượng: ${inv.quantity}</p>
                        <button class="btn-secondary" 
                                onclick="UIController.handleUseItem(${inv.item_reference_id})">
                            Sử dụng
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (err) { container.innerHTML = 'Lỗi tải Inventory.'; }
    },

    async handlePurchase(productId) {
        try {
            await ApiService.purchase(productId);
            this.showToast('Mua thành công!', 'success');
            await this.renderInventory();
        } catch (err) { }
    },

    async handleUseItem(itemId) {
        try {
            await ApiService.useItem(itemId);
            this.showToast('Sử dụng thành công!', 'success');
            await this.renderInventory();
        } catch (err) { }
    },

    async handleOpenBox() {
        try {
            const res = await ApiService.openLuckybox();
            this.showToast(`Bạn nhận được: ${res.data.itemName || 'quà'}!`, 'success');
            await this.renderInventory();
        } catch (err) { }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.classList.add('hidden'), 500);
            }, 800);
        }
    },

    async updateDashboard() { await this.renderLeaderboard(); }
};

window.UIController = UIController;
document.addEventListener('DOMContentLoaded', () => UIController.init());