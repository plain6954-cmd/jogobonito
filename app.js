// State
let state = {
    isAdmin: false,
    editingPlayerId: null,
    editingTeamId: null,
    players: JSON.parse(localStorage.getItem('jogo_players')) || [
        { id: 1, name: 'Pele', rating: 98, position: 'ATT', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Pele_by_John_Mathew_Smith.jpg/440px-Pele_by_John_Mathew_Smith.jpg', teamId: 1 },
        { id: 2, name: 'Zidane', rating: 96, position: 'MID', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Zinedine_Zidane_by_Tasnim_03.jpg/440px-Zinedine_Zidane_by_Tasnim_03.jpg', teamId: null }
    ],
    teams: JSON.parse(localStorage.getItem('jogo_teams')) || [
        { id: 1, name: 'Legends FC', manager: 'Sir Alex Ferguson', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/1200px-Manchester_United_FC_crest.svg.png', managerPhoto: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Sir_Alex_Ferguson_2011.jpg' }
    ]
};

// Utility to convert Google Drive links to direct image links
function formatImageUrl(url) {
    if (!url) return '';
    const driveMatch = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (url.includes('drive.google.com') && driveMatch) {
        return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    }
    return url;
}

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8IwkUnVgmxd9xmpKVAWx-0UKHam0ltkB1WYl4EjYY-bG9-aEFW5vdlrkTNlwVnyrnxoyoSXzEAbJh/pub?output=csv';

async function fetchGoogleSheetData() {
    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(','));
        rows.shift(); // Remove header

        const googlePlayers = [];
        rows.forEach((row, index) => {
            if (row.length < 5) return;
            const name = row[1]?.trim();
            if (!name) return;
            const rating = row[2]?.trim() || 75;
            const position = row[3]?.trim() || 'ATT';
            const photo = row[4]?.trim() || '';
            
            googlePlayers.push({
                id: `google-${index}`,
                name,
                rating,
                position,
                photo,
                teamId: null
            });
        });

        // Merge keeping local edits (if a local player has the same name, skip the google one to preserve local team assignments)
        const mergedPlayers = [...state.players];
        googlePlayers.forEach(gp => {
            const exists = mergedPlayers.find(p => p.name.toLowerCase() === gp.name.toLowerCase());
            if (!exists) {
                mergedPlayers.push(gp);
            }
        });

        state.players = mergedPlayers;
        renderPlayers(document.getElementById('player-filter').value);
        renderTeams();
    } catch (error) {
        console.error("Error fetching Google Sheet:", error);
    }
}

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

adminPasswordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        loginSubmitBtn.click();
    }
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
        const photoUrl = formatImageUrl(player.photo) || fallbackImg;
        
        let teamLogoHtml = '';
        if (player.teamId) {
            const team = state.teams.find(t => t.id == player.teamId);
            if (team && team.logo) {
                teamLogoHtml = `<img class="pc-team-logo" src="${formatImageUrl(team.logo)}" alt="${team.name}" />`;
            }
        }

        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
            <div class="pc-top">
                <div class="pc-info">
                    <div class="pc-rating">${player.rating}</div>
                    <div class="pc-position">${player.position}</div>
                    ${teamLogoHtml}
                </div>
                <div class="pc-image-wrapper">
                    <img class="pc-image" src="${photoUrl}" alt="${player.name}" onerror="this.src='${fallbackImg}'" />
                </div>
            </div>
            <div class="pc-name">${player.name}</div>
            <div class="pc-divider"></div>
            <div class="pc-stats">
                <div class="stat-col">
                    <div><span class="stat-val">90</span><span class="stat-lbl">PAC</span></div>
                    <div><span class="stat-val">${Math.min(99, parseInt(player.rating) + 2)}</span><span class="stat-lbl">SHO</span></div>
                    <div><span class="stat-val">88</span><span class="stat-lbl">PAS</span></div>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-col">
                    <div><span class="stat-val">92</span><span class="stat-lbl">DRI</span></div>
                    <div><span class="stat-val">36</span><span class="stat-lbl">DEF</span></div>
                    <div><span class="stat-val">78</span><span class="stat-lbl">PHY</span></div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            if (state.isAdmin) {
                editPlayer(player.id);
            }
        });

        grid.appendChild(card);
    });
}

function renderTeams() {
    const list = document.getElementById('teams-list');
    list.innerHTML = '';
    state.teams.forEach(team => {
        // Find players assigned to this team
        const teamPlayers = state.players.filter(p => p.teamId == team.id);
        const playerNames = teamPlayers.map(p => p.name).join(', ') || 'No players assigned yet.';

        const fallbackLogo = `https://ui-avatars.com/api/?name=${team.name}&background=d4af37&color=000&size=50`;
        const fallbackManager = `https://ui-avatars.com/api/?name=${team.manager}&background=333&color=fff&size=50`;
        const logoUrl = formatImageUrl(team.logo) || fallbackLogo;
        const managerPhotoUrl = formatImageUrl(team.managerPhoto) || fallbackManager;

        const card = document.createElement('div');
        card.className = 'team-card glass';
        card.innerHTML = `
            <div class="team-header">
                <img class="team-logo" src="${logoUrl}" alt="${team.name}" onerror="this.src='${fallbackLogo}'" />
                <div class="team-info">
                    <h4>${team.name}</h4>
                    <div class="manager-info">
                        <img class="manager-photo" src="${managerPhotoUrl}" alt="${team.manager}" onerror="this.src='${fallbackManager}'" />
                        <p>Manager: ${team.manager}</p>
                    </div>
                </div>
            </div>
            <div class="team-players">
                <h5>Squad:</h5>
                <p>${playerNames}</p>
            </div>
        `;
        
        card.addEventListener('click', () => {
            if (state.isAdmin) {
                editTeam(team.id);
            }
        });

        list.appendChild(card);
    });
    updateTeamDropdown();
}

function updateTeamDropdown() {
    const dropdown = document.getElementById('p-team');
    dropdown.innerHTML = '<option value="">No Team</option>';
    state.teams.forEach(t => {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = t.name;
        dropdown.appendChild(option);
    });
}

// Form Handlers
function resetPlayerForm() {
    state.editingPlayerId = null;
    document.getElementById('player-form-title').textContent = 'Add New Player';
    document.getElementById('player-form-submit').textContent = 'Add Player';
    document.getElementById('player-form-cancel').classList.add('hidden');
    document.getElementById('player-form-delete').classList.add('hidden');
    document.getElementById('add-player-form').reset();
}

function editPlayer(id) {
    const player = state.players.find(p => p.id === id);
    if (!player) return;

    state.editingPlayerId = id;
    document.getElementById('player-form-title').textContent = 'Edit Player';
    document.getElementById('player-form-submit').textContent = 'Update Player';
    document.getElementById('player-form-cancel').classList.remove('hidden');
    document.getElementById('player-form-delete').classList.remove('hidden');

    document.getElementById('p-name').value = player.name;
    document.getElementById('p-rating').value = player.rating;
    document.getElementById('p-pos').value = player.position;
    document.getElementById('p-photo').value = player.photo || '';
    document.getElementById('p-team').value = player.teamId || '';

    // Scroll to form
    document.getElementById('add-player-form-container').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('player-form-cancel').addEventListener('click', () => {
    resetPlayerForm();
});

document.getElementById('player-form-delete').addEventListener('click', () => {
    if (state.editingPlayerId && confirm('Are you sure you want to delete this player?')) {
        state.players = state.players.filter(p => p.id !== state.editingPlayerId);
        localStorage.setItem('jogo_players', JSON.stringify(state.players));
        renderPlayers(document.getElementById('player-filter').value);
        renderTeams();
        resetPlayerForm();
    }
});

function resetTeamForm() {
    state.editingTeamId = null;
    document.getElementById('team-form-title').textContent = 'Add New Team';
    document.getElementById('team-form-submit').textContent = 'Add Team';
    document.getElementById('team-form-cancel').classList.add('hidden');
    document.getElementById('team-form-delete').classList.add('hidden');
    document.getElementById('add-team-form').reset();
}

function editTeam(id) {
    const team = state.teams.find(t => t.id === id);
    if (!team) return;

    state.editingTeamId = id;
    document.getElementById('team-form-title').textContent = 'Edit Team';
    document.getElementById('team-form-submit').textContent = 'Update Team';
    document.getElementById('team-form-cancel').classList.remove('hidden');
    document.getElementById('team-form-delete').classList.remove('hidden');

    document.getElementById('t-name').value = team.name;
    document.getElementById('t-manager').value = team.manager;
    document.getElementById('t-logo').value = team.logo || '';
    document.getElementById('t-manager-photo').value = team.managerPhoto || '';

    document.getElementById('add-team-form-container').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('team-form-cancel').addEventListener('click', () => {
    resetTeamForm();
});

document.getElementById('team-form-delete').addEventListener('click', () => {
    if (state.editingTeamId && confirm('Are you sure you want to delete this team?')) {
        state.teams = state.teams.filter(t => t.id !== state.editingTeamId);
        // Also remove teamId from players in this team
        state.players = state.players.map(p => p.teamId === state.editingTeamId ? { ...p, teamId: null } : p);
        
        localStorage.setItem('jogo_teams', JSON.stringify(state.teams));
        localStorage.setItem('jogo_players', JSON.stringify(state.players));
        renderTeams();
        renderPlayers(document.getElementById('player-filter').value);
        resetTeamForm();
    }
});

document.getElementById('add-player-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('p-name').value;
    const rating = document.getElementById('p-rating').value;
    const position = document.getElementById('p-pos').value;
    const photo = document.getElementById('p-photo').value;
    const teamId = document.getElementById('p-team').value || null;

    if (state.editingPlayerId) {
        const index = state.players.findIndex(p => p.id === state.editingPlayerId);
        if (index !== -1) {
            state.players[index] = { ...state.players[index], name, rating, position, photo, teamId };
        }
        resetPlayerForm();
    } else {
        const newPlayer = {
            id: Date.now(),
            name,
            rating,
            position,
            photo,
            teamId
        };
        state.players.push(newPlayer);
    }

    localStorage.setItem('jogo_players', JSON.stringify(state.players));
    renderPlayers(document.getElementById('player-filter').value);
    renderTeams(); // Re-render teams to update squad list
    
    if (!state.editingPlayerId) {
        e.target.reset();
    }
});

document.getElementById('add-team-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('t-name').value;
    const manager = document.getElementById('t-manager').value;
    const logo = document.getElementById('t-logo').value;
    const managerPhoto = document.getElementById('t-manager-photo').value;

    if (state.editingTeamId) {
        const index = state.teams.findIndex(t => t.id === state.editingTeamId);
        if (index !== -1) {
            state.teams[index] = { ...state.teams[index], name, manager, logo, managerPhoto };
        }
        resetTeamForm();
    } else {
        const newTeam = {
            id: Date.now(),
            name,
            manager,
            logo,
            managerPhoto
        };
        state.teams.push(newTeam);
    }

    localStorage.setItem('jogo_teams', JSON.stringify(state.teams));
    renderTeams();
    renderPlayers(document.getElementById('player-filter').value);
    
    if (!state.editingTeamId) {
        e.target.reset();
    }
});

// Filters
document.getElementById('player-filter').addEventListener('change', (e) => {
    renderPlayers(e.target.value);
});

// Initial Render
renderPlayers();
renderTeams();
updateAdminUI();
fetchGoogleSheetData();
