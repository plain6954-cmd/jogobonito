// State
let state = {
    isAdmin: false,
    players: JSON.parse(localStorage.getItem('jogo_players')) || [
        { id: 1, name: 'Pele', rating: 98, position: 'ATT', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Pele_by_John_Mathew_Smith.jpg/440px-Pele_by_John_Mathew_Smith.jpg' },
        { id: 2, name: 'Zidane', rating: 96, position: 'MID', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Zinedine_Zidane_by_Tasnim_03.jpg/440px-Zinedine_Zidane_by_Tasnim_03.jpg' }
    ],
    teams: JSON.parse(localStorage.getItem('jogo_teams')) || [
        { id: 1, name: 'Legends FC', manager: 'Sir Alex Ferguson' }
    ]
};

// DOM Elements
const navLinks = document.querySelectorAll('.nav-links a');
const views = document.querySelectorAll('.view-section');
const adminToggleBtn = document.getElementById('admin-toggle-btn');
const loginModal = document.getElementById('login-modal');
const closeBtn = document.querySelector('.close-btn');
const loginSubmitBtn = document.getElementById('login-submit-btn');
const adminPasswordInput = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');
const adminOnlyElements = document.querySelectorAll('.admin-only');

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');

        const targetId = e.target.getAttribute('data-target');
        views.forEach(view => {
            view.classList.remove('active');
            if (view.id === targetId) {
                view.classList.add('active');
            }
        });
    });
});

// Admin Auth
adminToggleBtn.addEventListener('click', () => {
    if (state.isAdmin) {
        // Logout
        state.isAdmin = false;
        adminToggleBtn.textContent = 'Admin Login';
        updateAdminUI();
    } else {
        // Show login
        loginModal.classList.add('show');
    }
});

closeBtn.addEventListener('click', () => {
    loginModal.classList.remove('show');
    loginError.textContent = '';
    adminPasswordInput.value = '';
});

loginSubmitBtn.addEventListener('click', () => {
    if (adminPasswordInput.value === '6989') {
        state.isAdmin = true;
        loginModal.classList.remove('show');
        adminToggleBtn.textContent = 'Logout Admin';
        loginError.textContent = '';
        adminPasswordInput.value = '';
        updateAdminUI();
    } else {
        loginError.textContent = 'Incorrect password.';
    }
});

function updateAdminUI() {
    adminOnlyElements.forEach(el => {
        if (state.isAdmin) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
}

// Data Rendering
function renderPlayers(filter = 'ALL') {
    const grid = document.getElementById('players-grid');
    grid.innerHTML = '';
    
    let filteredPlayers = state.players;
    if (filter !== 'ALL') {
        filteredPlayers = state.players.filter(p => p.position === filter);
    }

    filteredPlayers.forEach(player => {
        const fallbackImg = `https://ui-avatars.com/api/?name=${player.name}&background=d4af37&color=000&size=120`;
        const photoUrl = player.photo ? player.photo : fallbackImg;
        
        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
            <div class="pc-rating">${player.rating}</div>
            <div class="pc-position">${player.position}</div>
            <img class="pc-image" src="${photoUrl}" alt="${player.name}" onerror="this.src='${fallbackImg}'" />
            <div class="pc-name">${player.name}</div>
            <div class="pc-divider"></div>
            <div class="pc-stats">
                <div><strong>PAC</strong>90</div>
                <div><strong>SHO</strong>${Math.min(99, parseInt(player.rating) + 2)}</div>
                <div><strong>PAS</strong>88</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderTeams() {
    const list = document.getElementById('teams-list');
    list.innerHTML = '';
    state.teams.forEach(team => {
        const card = document.createElement('div');
        card.className = 'team-card glass';
        card.innerHTML = `
            <div class="team-icon">${team.name.charAt(0)}</div>
            <div class="team-info">
                <h4>${team.name}</h4>
                <p>Manager: ${team.manager}</p>
            </div>
        `;
        list.appendChild(card);
    });
}

// Form Handlers
document.getElementById('add-player-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('p-name').value;
    const rating = document.getElementById('p-rating').value;
    const position = document.getElementById('p-pos').value;
    const photo = document.getElementById('p-photo').value;

    const newPlayer = {
        id: Date.now(),
        name,
        rating,
        position,
        photo
    };

    state.players.push(newPlayer);
    localStorage.setItem('jogo_players', JSON.stringify(state.players));
    renderPlayers(document.getElementById('player-filter').value);
    e.target.reset();
});

document.getElementById('add-team-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('t-name').value;
    const manager = document.getElementById('t-manager').value;

    const newTeam = {
        id: Date.now(),
        name,
        manager
    };

    state.teams.push(newTeam);
    localStorage.setItem('jogo_teams', JSON.stringify(state.teams));
    renderTeams();
    e.target.reset();
});

// Filters
document.getElementById('player-filter').addEventListener('change', (e) => {
    renderPlayers(e.target.value);
});

// Initial Render
renderPlayers();
renderTeams();
updateAdminUI();
