/**
 * Mystery Box Frontend - MULTI-LANGUAGE SUPPORTED
 * Tích hợp: Dashboard, Shop, Inventory, Leaderboard (My Rank), History (Reward/Score)
 * Hỗ trợ: Việt Nam, English, Khmer
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
    seasonId: 1,
    // Ngôn ngữ mặc định
    lang: localStorage.getItem('game_lang') || 'vi',
    // History states
    historyType: 'reward', 
    historyPage: 1,
    historyLimit: 10
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

        // Tự động thêm tham số lang vào mọi URL
        const separator = url.includes('?') ? '&' : '?';
        const finalUrl = `${API_BASE}${url}${separator}lang=${state.lang}`;

        try {
            const response = await fetch(finalUrl, { ...options, headers });
            
            // [THÊM LOGIC AUTO LOGOUT TẠI ĐÂY]
            // Nếu Backend trả về 403 (Token hết hạn/lỗi) -> Tự động Logout
            if (response.status === 403) {
                UIController.showToast("Phiên đăng nhập đã hết hạn!", "error");
                UIController.handleLogout(); // Gọi hàm logout để xóa token và về màn hình login
                throw new Error("Session expired"); // Dừng luôn luồng xử lý
            }

            const result = await response.json();
            
            // Server sẽ trả về message đã được dịch dựa trên tham số lang này
            if (!response.ok) throw new Error(result.message || 'API request failed');
            return result;
        } catch (error) {
            // Không show toast lỗi nếu là do session expired (đã xử lý trên)
            if (error.message !== "Session expired") {
                UIController.showToast(error.message, 'error');
            }
            throw error;
        }
    },

    launchGame: (msisdn, fullName) => ApiService.request('/game/launch', {
        method: 'POST',
        body: JSON.stringify({ msisdn, fullName, lang: state.lang, gameType: state.gameId })
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
    }),

    getMyHistory: (type, page, limit) => 
        ApiService.request(`/history?gameId=${state.gameId}&type=${type}&page=${page}&limit=${limit}`)
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
        // Chuyển đổi ngôn ngữ
        const langSelect = document.getElementById('langSelect');
        if (langSelect) {
            langSelect.value = state.lang;
            langSelect.addEventListener('change', (e) => {
                state.lang = e.target.value;
                localStorage.setItem('game_lang', state.lang);
                // Tải lại dữ liệu trang hiện tại với ngôn ngữ mới
                this.loadViewData(state.currentView);
                this.showToast(state.lang === 'vi' ? 'Đã đổi ngôn ngữ' : 'Language updated');
            });
        }

        // Chuyển View chính
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });

        // Auth
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.handleLogout());

        // Score Actions
        document.getElementById('submitScoreBtn')?.addEventListener('click', () => this.toggleModal('scoreModal', true));
        document.getElementById('cancelScore')?.addEventListener('click', () => this.toggleModal('scoreModal', false));
        document.getElementById('confirmScore')?.addEventListener('click', () => this.handleSubmitScore());

        // Luckybox
        document.getElementById('openBoxBtn')?.addEventListener('click', () => this.handleOpenBox());

        // History Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                state.historyType = e.target.dataset.historyType;
                state.historyPage = 1;
                this.renderHistory();
            });
        });

        // Pagination
        document.getElementById('prevPage')?.addEventListener('click', () => {
            if (state.historyPage > 1) {
                state.historyPage--;
                this.renderHistory();
            }
        });

        document.getElementById('nextPage')?.addEventListener('click', () => {
            state.historyPage++;
            this.renderHistory();
        });
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
        document.getElementById(id)?.classList.toggle('hidden', !show);
    },

    async renderLeaderboard() {
        const list = document.getElementById('leaderboardRows');
        const myRank = document.getElementById('myRankRow');
        if (!list) return;

        try {
            const res = await ApiService.getLeaderboard();
            const lb = res.data.leaderboard || [];
            const me = res.data.me;

            list.innerHTML = lb.map((p, i) => `
                <div class="leaderboard-row">
                    <span class="rank-badge rank-${i + 1}">${i + 1}</span>
                    <span>${p.phone || 'Player'}</span>
                    <span>${p.score.toLocaleString()}</span>
                </div>
            `).join('');

            if (me && myRank) {
                myRank.classList.remove('hidden');
                myRank.innerHTML = `
                    <div class="leaderboard-row my-rank-active">
                        <span class="rank-badge">${me.rank || 'N/A'}</span>
                        <span>Your Rank: ${me.phone || 'You'}</span>
                        <span>${me.score.toLocaleString()}</span>
                    </div>
                `;
                const display = document.getElementById('currentScoreDisplay');
                if (display) display.textContent = me.score.toLocaleString();
            }
        } catch (err) { 
            list.innerHTML = '<div class="empty-state">Failed to load leaderboard.</div>'; 
        }
    },

    async renderHistory() {
        const header = document.getElementById('historyHeader');
        const body = document.getElementById('historyBody');
        const pageInfo = document.getElementById('pageInfo');
        if (!body || !header) return;

        try {
            const res = await ApiService.getMyHistory(state.historyType, state.historyPage, state.historyLimit);
            const { rewards, scores } = res.data;
            const data = state.historyType === 'reward' ? rewards : scores;

            // Header động theo ngôn ngữ đã chọn (Backend xử lý message, Frontend xử lý Header tĩnh)
            const headers = {
                vi: state.historyType === 'reward' ? ['Thời gian', 'Phần thưởng', 'Số lượng', 'Nguồn'] : ['Thời gian', 'Điểm cộng', 'Tổng điểm'],
                en: state.historyType === 'reward' ? ['Date', 'Reward', 'Qty', 'Source'] : ['Date', 'Score +', 'Total'],
                khmer: state.historyType === 'reward' ? ['កាលបរិច្ឆេទ', 'រង្វាន់', 'បរិមាណ', 'ប្រភព'] : ['កាលបរិច្ឆេទ', 'ពិន្ទុបូក', 'ពិន្ទុសរុប']
            };

            const currentHeader = headers[state.lang] || headers.en;
            header.innerHTML = `<tr>${currentHeader.map(h => `<th>${h}</th>`).join('')}</tr>`;

            if (!data || data.length === 0) {
                body.innerHTML = `<tr><td colspan="4" class="empty-state">No data available.</td></tr>`;
                return;
            }

            body.innerHTML = data.map(item => {
                const date = new Date(item.createdAt).toLocaleString(state.lang === 'vi' ? 'vi-VN' : 'en-US');
                if (state.historyType === 'reward') {
                    return `<tr>
                        <td>${date}</td>
                        <td><span class="reward-id">${item.rewardId}</span></td>
                        <td>x${item.quantity}</td>
                        <td><small>${item.sourceType}</small></td>
                    </tr>`;
                } else {
                    return `<tr>
                        <td>${date}</td>
                        <td class="score-plus">+${item.scorePlus}</td>
                        <td><strong>${item.totalScore.toLocaleString()}</strong></td>
                    </tr>`;
                }
            }).join('');

            pageInfo.textContent = `${state.lang === 'vi' ? 'Trang' : 'Page'} ${state.historyPage}`;
        } catch (err) {
            body.innerHTML = `<tr><td colspan="4">Error loading history.</td></tr>`;
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
        this.showToast('Logged out');
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
        document.getElementById(`${viewId}View`)?.classList.remove('hidden');

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
            case 'history': await this.renderHistory(); break;
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
                        <h3>${p.item_name || 'Item'}</h3>
                        <p class="item-price">${p.price} Coins</p>
                        <button class="btn-primary" onclick="UIController.handlePurchase(${p.item_id})">Buy</button>
                    </div>
                </div>
            `).join('');
        } catch (err) { container.innerHTML = 'Error loading shop.'; }
    },

    async renderInventory() {
        const container = document.getElementById('inventoryList');
        if (!container) return;
        try {
            const res = await ApiService.getInventory();
            state.inventory = res.data || [];
            if (state.inventory.length === 0) {
                container.innerHTML = '<div class="empty-state">Empty inventory.</div>';
                return;
            }
            container.innerHTML = state.inventory.map(inv => `
                <div class="item-card">
                    <div class="item-img">💎</div>
                    <div class="item-info">
                        <h3>${inv.item?.item_name || 'Item'}</h3>
                        <p>Qty: ${inv.quantity}</p>
                        <button class="btn-secondary" onclick="UIController.handleUseItem(${inv.item_reference_id})">Use</button>
                    </div>
                </div>
            `).join('');
        } catch (err) { container.innerHTML = 'Error loading inventory.'; }
    },

    async handlePurchase(productId) {
       try {
        const res = await ApiService.request('/purchase', {
            method: 'POST',
            body: JSON.stringify({ productId: Number(productId), gameId: state.gameId })
        });
        this.showToast(res.message, 'success'); 
        await this.renderInventory();
    } catch (err) {
        this.showToast(err.message, 'error');
    }
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
        console.log("Luckybox Res:", res); 
        
        this.showToast(res.message || "Mở quà thành công!", 'success'); 
        
        await this.renderInventory();
    } catch (err) {
        this.showToast(err.message, 'error');
    }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
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