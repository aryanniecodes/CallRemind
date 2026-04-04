// script.js - Fixed: New cards now appear with old data + LocalStorage

const STORAGE_KEY = 'callremind_cards';

let cards = [];
let currentFilter = 'all';

// ====================== LOCAL STORAGE ======================
function loadCards() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    // Default demo data (only used first time)
    return [
        {
            id: 1,
            imageUrl: "https://picsum.photos/id/64/300/300",
            fullName: "Rahul Sharma",
            homeTown: "Lucknow, Uttar Pradesh",
            purpose: "Finalise Q2 project deliverables and timeline before board meeting",
            category: "urgent"
        },
        {
            id: 2,
            imageUrl: "https://picsum.photos/id/201/300/300",
            fullName: "Priya Singh",
            homeTown: "Delhi",
            purpose: "Discuss admission process for my daughter at your university",
            category: "important"
        },
        {
            id: 3,
            imageUrl: "https://picsum.photos/id/29/300/300",
            fullName: "Dr. Amit Patel",
            homeTown: "Mumbai",
            purpose: "Emergency: Need latest blood report and medicine update",
            category: "emergency"
        },
        {
            id: 4,
            imageUrl: "https://picsum.photos/id/160/300/300",
            fullName: "Neha Gupta",
            homeTown: "Prayagraj, Uttar Pradesh",
            purpose: "Just catching up after 3 months! How is the family doing?",
            category: "no-rush"
        }
    ];
}

function saveCards() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

// ====================== CATEGORY STYLE ======================
function getCategoryStyle(category) {
    switch (category) {
        case 'emergency': return { bg: '#ef4444', text: '#fff', emoji: '🚨' };
        case 'urgent':    return { bg: '#f59e0b', text: '#fff', emoji: '⚡' };
        case 'important': return { bg: '#3b82f6', text: '#fff', emoji: '⭐' };
        case 'no-rush':   return { bg: '#10b981', text: '#fff', emoji: '🌿' };
        default:          return { bg: '#64748b', text: '#fff', emoji: '📌' };
    }
}

// ====================== RENDER STACK ======================
function renderStack() {
    const stack = document.getElementById('card-stack');
    stack.innerHTML = '';

    // Filter cards
    let filteredCards = currentFilter === 'all' 
        ? cards 
        : cards.filter(c => c.category === currentFilter);

    // Update count
    document.getElementById('card-count').innerHTML = `
        <span style="color:#10b981; font-weight:600">${filteredCards.length}</span> reminders
    `;

    if (filteredCards.length === 0) {
        stack.innerHTML = `
            <div class="empty-stack">
                <div style="font-size:64px; margin-bottom:16px;">📭</div>
                <h3>No reminders found</h3>
                <p>Create new or change filter</p>
            </div>
        `;
        return;
    }

    // Show only top 3 cards (Tinder style)
    const visibleCards = filteredCards.slice(0, 3);

    visibleCards.forEach((card, index) => {
        const style = getCategoryStyle(card.category);
        const isTop = index === 0;

        const cardHTML = `
        <div class="card ${isTop ? 'top-card' : index === 1 ? 'behind-card' : 'behind2-card'}" data-id="${card.id}">
            <div class="card-content">
                <div class="card-header">
                    <img src="${card.imageUrl}" alt="${card.fullName}" class="card-avatar">
                    <div class="card-info">
                        <h3>${card.fullName}</h3>
                        <p>${card.homeTown}</p>
                    </div>
                    <div class="category-badge" style="background:${style.bg}; color:${style.text}">
                        ${style.emoji} ${card.category.toUpperCase().replace('-', ' ')}
                    </div>
                </div>

                ${isTop ? `
                <div class="purpose">${card.purpose}</div>
                <div class="action-row">
                    <button onclick="handleCall(${card.id}); event.stopImmediatePropagation()" class="call-btn">📞 Call Now</button>
                    <button onclick="handleMessage(${card.id}); event.stopImmediatePropagation()" class="msg-btn">💬 Message</button>
                </div>` : `
                <div class="purpose" style="opacity:0.65; margin-top:40px; font-style:italic;">
                    Next reminder • ${card.fullName}
                </div>`}
            </div>
        </div>`;

        stack.innerHTML += cardHTML;
    });

    setTimeout(attachSwipeListeners, 80);
}

// ====================== SWIPE FUNCTIONALITY ======================
function attachSwipeListeners() {
    const topCard = document.querySelector('.top-card');
    if (!topCard) return;

    let isDragging = false, startX = 0, currentX = 0;

    const start = (clientX) => {
        isDragging = true;
        startX = clientX;
        topCard.style.transition = 'none';
    };

    const move = (clientX) => {
        if (!isDragging) return;
        currentX = clientX - startX;
        topCard.style.transform = `translateX(${currentX}px) rotate(${currentX / 15}deg)`;
    };

    const end = () => {
        if (!isDragging) return;
        isDragging = false;
        topCard.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1)';

        if (Math.abs(currentX) > 160) {
            if (currentX > 0) {
                topCard.style.transform = `translateX(700px) rotate(30deg)`;
                setTimeout(() => snoozeCard(topCard.dataset.id), 280);
            } else {
                topCard.style.transform = `translateX(-700px) rotate(-30deg)`;
                setTimeout(() => dismissCard(topCard.dataset.id), 280);
            }
        } else {
            topCard.style.transform = `translateX(0) rotate(0deg)`;
        }
    };

    // Mouse
    topCard.addEventListener('mousedown', (e) => start(e.clientX));
    window.addEventListener('mousemove', (e) => move(e.clientX));
    window.addEventListener('mouseup', end);

    // Touch
    topCard.addEventListener('touchstart', (e) => start(e.touches[0].clientX));
    window.addEventListener('touchmove', (e) => move(e.touches[0].clientX));
    window.addEventListener('touchend', end);
}

// Dismiss card
function dismissCard(id) {
    cards = cards.filter(c => c.id !== Number(id));
    saveCards();
    renderStack();
}

// Snooze card (move to bottom)
function snoozeCard(id) {
    const index = cards.findIndex(c => c.id === Number(id));
    if (index === -1) return;
    const card = cards.splice(index, 1)[0];
    cards.push(card);
    saveCards();
    renderStack();
}

// Manual swipe
window.manualSwipe = function(direction) {
    const topCard = document.querySelector('.top-card');
    if (!topCard) return;

    if (direction === 'left') {
        topCard.style.transform = `translateX(-700px) rotate(-30deg)`;
        setTimeout(() => dismissCard(topCard.dataset.id), 300);
    } else {
        topCard.style.transform = `translateX(700px) rotate(30deg)`;
        setTimeout(() => snoozeCard(topCard.dataset.id), 300);
    }
};

// Call & Message
window.handleCall = (id) => {
    const card = cards.find(c => c.id === id);
    if (card) alert(`📞 Calling ${card.fullName}...`);
};

window.handleMessage = (id) => {
    const card = cards.find(c => c.id === id);
    if (card) alert(`💬 Message to ${card.fullName}`);
};

// ====================== FORM ======================
function openFormModal() {
    document.getElementById('form-modal').style.display = 'flex';
    document.getElementById('reminder-form').reset();
}

function closeFormModal() {
    document.getElementById('form-modal').style.display = 'none';
}

// Form Submit - FIXED PART
document.getElementById('reminder-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const newCard = {
        id: Date.now(),
        imageUrl: document.getElementById('image-url').value.trim() || 'https://picsum.photos/id/1005/300/300',
        fullName: document.getElementById('full-name').value.trim(),
        homeTown: document.getElementById('home-town').value.trim(),
        purpose: document.getElementById('purpose').value.trim(),
        category: document.querySelector('input[name="category"]:checked').value
    };

    // Add new card to the TOP of the array
    cards.unshift(newCard);

    saveCards();           // Save immediately
    closeFormModal();
    renderStack();         // Re-render with ALL cards (old + new)

    showToast('✅ New reminder added successfully!');
});

function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%);
                           background:#10b981; color:white; padding:16px 32px; border-radius:9999px;
                           font-weight:600; box-shadow:0 10px 20px -5px rgb(16 185 129); z-index:9999;`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}

// ====================== FILTERS ======================
window.setFilter = function(filter) {
    currentFilter = filter;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
    });

    document.getElementById('stack-title').textContent = 
        filter === 'all' ? 'Upcoming Reminders' : filter.toUpperCase().replace('-', ' ') + ' Calls';

    renderStack();
};

function populateFilters() {
    const container = document.getElementById('filter-container');
    const filters = [
        {value: 'all', label: '🌐 All Reminders', color: '#64748b'},
        {value: 'emergency', label: '🚨 Emergency', color: '#ef4444'},
        {value: 'urgent', label: '⚡ Urgent', color: '#f59e0b'},
        {value: 'important', label: '⭐ Important', color: '#3b82f6'},
        {value: 'no-rush', label: '🌿 No Rush', color: '#10b981'}
    ];

    let html = '';
    filters.forEach(f => {
        html += `
        <button onclick="setFilter('${f.value}')" class="filter-btn ${f.value === 'all' ? 'active' : ''}" data-filter="${f.value}">
            <span class="category-dot" style="background:${f.color}"></span>
            ${f.label}
        </button>`;
    });
    container.innerHTML = html;
}

// Shuffle & Reset
window.shuffleCards = function() {
    cards.sort(() => Math.random() - 0.5);
    saveCards();
    renderStack();
};

window.resetAllCards = function() {
    if (confirm('Reset to original demo data?')) {
        localStorage.removeItem(STORAGE_KEY);
        cards = loadCards();
        currentFilter = 'all';
        populateFilters();
        renderStack();
    }
};

// ====================== INIT ======================
window.onload = function() {
    cards = loadCards();        // Load once at start
    populateFilters();
    renderStack();

    // NEW REMINDER BUTTON
    const newReminderBtn = document.querySelector('.new-reminder-btn');
    if (newReminderBtn) {
        newReminderBtn.addEventListener('click', openFormModal);
    }

    console.log('%c✅ CallRemind ready - New cards will now appear with old data!', 'color:#10b981; font-size:14px');
};