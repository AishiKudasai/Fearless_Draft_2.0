/* =========================================================================
   MLBB FEARLESS DRAFT — CORE ENGINE
   Shared by operator.html and viewer.html.
   The <body data-view="operator"|"viewer"> attribute decides which half
   of this file wires itself up.
========================================================================= */

const VIEW = document.body.dataset.view; // 'operator' | 'viewer'
const STORAGE_KEY   = 'mlbb_fearless_draft_state_v1';
const CHANNEL_NAME  = 'mlbb_fearless_draft_channel_v1';


/* =========================================================================
   ASSETS
========================================================================= */

const ASSET_DIRS = {
    icon:     'Assets/hero-icon/',
    portrait: 'Assets/hero-portraits/',
    splash:   'Assets/hero-wp/'
};

const HERO_FILE_OVERRIDES = {
    "X.Borg": "x-borg",
    "Yi Sun-shin": "yi-sun-shin",
    "Popol and Kupa": "popol-and-kupa"
};

function heroSlug(name){
    return (HERO_FILE_OVERRIDES[name] || name)
        .toLowerCase()
        .replace(/[’']/g,'-')
        .replace(/\./g,'-')
        .replace(/\s+/g,'-')
        .replace(/-+/g,'-')
        .replace(/^-|-$/g,'');
}

function heroAsset(type,name){
    const slug = heroSlug(name);
    if(type === 'icon')     return `${ASSET_DIRS.icon}${slug}-icon.webp`;
    if(type === 'portrait') return `${ASSET_DIRS.portrait}${slug}-portrait.webp`;
    return `${ASSET_DIRS.splash}${slug}-wp.webp`;
}

/* Try the canonical slug first, then the display-name casing used by some
 * Windows asset folders. This handles case-only filename mismatches without
 * hiding a missing asset behind a random placeholder. */
function heroAssetCandidates(type,name){
    const slug = heroSlug(name);
    const raw = String(name)
        .replace(/[’']/g,'-')
        .replace(/\./g,'-')
        .replace(/\s+/g,'-')
        .replace(/-+/g,'-')
        .replace(/^-|-$/g,'');
    const suffix = type === 'icon' ? '-icon.webp' : type === 'portrait' ? '-portrait.webp' : '-wp.webp';
    const dir = type === 'icon' ? ASSET_DIRS.icon : type === 'portrait' ? ASSET_DIRS.portrait : ASSET_DIRS.splash;
    return [...new Set([`${dir}${slug}${suffix}`, `${dir}${raw}${suffix}`, `${dir}${String(name)}${suffix}`])];
}

function placeholderSvg(text){
    const escaped = String(text)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;');

    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
            <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop stop-color="#102040"/>
                    <stop offset="1" stop-color="#07101e"/>
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#g)"/>
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                  fill="#5edbff" font-size="22" font-family="Arial">${escaped}</text>
        </svg>
    `);
}

function loadHeroImage(img, hero, types){
    let typeIndex = 0;
    let candidateIndex = 0;
    let candidates = [];
    function next(){
        if(candidateIndex < candidates.length){
            img.onerror = next;
            img.src = candidates[candidateIndex++];
            return;
        }
        if(typeIndex < types.length){
            candidates = heroAssetCandidates(types[typeIndex++], hero);
            candidateIndex = 0;
            next();
            return;
        }
        img.onerror = null;
        img.src = placeholderSvg(hero);
    }
    next();
}

function loadFeaturedImage(imgElement, heroName){
    if(!imgElement || !heroName) return;
    imgElement.style.display = 'block';
    const portraitUrl = heroAsset('portrait', heroName);
    const splashUrl   = heroAsset('splash', heroName);
    imgElement.onerror = function(){
        this.onerror = function(){ this.onerror = null; this.src = placeholderSvg(heroName); };
        this.src = splashUrl;
    };
    imgElement.src = portraitUrl;
}

function escapeHtml(text){
    return String(text)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;');
}


/* =========================================================================
   HERO DATABASE
========================================================================= */

const HEROES = [
"Miya","Balmond","Saber","Alice","Nana","Tigreal","Alucard","Karina","Akai","Franco",
"Bane","Bruno","Clint","Rafaela","Eudora","Zilong","Fanny","Layla","Minotaur","Lolita",
"Hayabusa","Freya","Gord","Natalia","Kagura","Sun","Alpha","Ruby","Yi Sun-Shin","Moskov",
"Johnson","Cyclops","Estes","Hilda","Aurora","Lapu-Lapu","Vexana","Roger","Karrie","Gatotkaca",
"Irithel","Harley","Grock","Argus","Odette","Lancelot","Diggie","Hylos","Zhask","Helcurt",
"Pharsa","Lesley","Jawhead","Angela","Gusion","Valir","Martis","Uranus","Hanabi","Chang'e",
"Kaja","Selena","Aldous","Claude","Vale","Leomord","Lunox","Hanzo","Belerick","Kimmy",
"Thamuz","Harith","Minsitthar","Kadita","Badang","Khufra","Granger","Guinevere","Esmeralda","Terizla",
"X.Borg","Ling","Dyrroth","Wanwan","Silvanna","Cecilion","Carmilla","Atlas","Popol and Kupa","Yu Zhong",
"Luo Yi","Benedetta","Khaleed","Barats","Brody","Yve","Mathilda","Paquito","Gloo","Beatrix",
"Phoveus","Natan","Aulus","Aamon","Valentina","Edith","Floryn","Yin","Melissa","Xavier",
"Julian","Fredrinn","Joy","Novaria","Arlott","Ixia","Nolan","Cici","Chip","Zhuxin",
"Suyou","Lukas","Kalea","Obsidia","Zetian","Marcel","Chou","Baxia","Faramis","Hirara",
"Lylia","Masha","Sora"
];

const ROLE_MAP = {
  "TANK": [
    "Akai","Alice","Atlas","Barats","Baxia","Belerick","Carmilla","Chip",
    "Edith","Esmeralda","Franco","Fredrinn","Gatotkaca","Gloo","Grock",
    "Hilda","Hylos","Johnson","Khufra","Lolita","Masha","Minotaur",
    "Terizla","Tigreal","Uranus"
  ],

  "FIGHTER": [
    "Aldous","Alpha","Alucard","Argus","Arlott","Aulus","Badang","Balmond",
    "Bane","Barats","Cici","Chou","Dyrroth","Fredrinn","Freya","Gatotkaca",
    "Grock","Guinevere","Hilda","Jawhead","Julian","Kalea","Khaleed",
    "Lapu-Lapu","Leomord","Lukas","Martis","Masha","Minsitthar","Paquito",
    "Phoveus","Roger","Ruby","Silvanna","Sora","Sun","Suyou","Terizla",
    "Thamuz","X.Borg","Yin","Yu Zhong","Zilong"
  ],

  "ASSASSIN": [
    "Aamon","Alucard","Arlott","Benedetta","Fanny","Gusion","Hanzo","Harley",
    "Hayabusa","Helcurt","Hirara","Joy","Julian","Kadita","Karina","Lancelot",
    "Lesley","Ling","Mathilda","Natalia","Nolan","Paquito","Saber","Selena",
    "Sora","Suyou","Yi Sun-Shin","Zilong"
  ],

  "MAGE": [
    "Alice","Aurora","Bane","Cecilion","Chang'e","Cyclops","Esmeralda",
    "Eudora","Faramis","Gord","Harith","Harley","Kadita","Kagura","Kimmy",
    "Lunox","Luo Yi","Lylia","Nana","Novaria","Odette","Pharsa","Selena",
    "Vale","Valir","Valentina","Vexana","Xavier","Yve","Zetian","Zhask",
    "Zhuxin"
  ],

  "MARKSMAN": [
    "Beatrix","Brody","Bruno","Claude","Clint","Edith","Granger","Hanabi",
    "Irithel","Ixia","Karrie","Kimmy","Layla","Lesley","Melissa","Miya",
    "Moskov","Natan","Obsidia","Popol and Kupa","Roger","Wanwan",
    "Yi Sun-Shin"
  ],

  "SUPPORT": [
  "Angela","Carmilla","Chip","Diggie","Estes","Faramis","Floryn",
  "Johnson","Kaja","Kalea","Lolita","Marcel","Mathilda","Minotaur",
  "Rafaela"
]
};


function getRoles(hero) {
    const roles = [];

    for (const role in ROLE_MAP) {
        if (ROLE_MAP[role].includes(hero)) {
            roles.push(role);
        }
    }

    return roles;
}

function hasRole(hero, role) {
    return ROLE_MAP[role]?.includes(hero) || false;
}

const LANE_MAP = {
  EXP: [
    "Aldous","Alice","Alpha","Alucard","Argus","Arlott","Badang","Balmond",
    "Bane","Benedetta","Chou","Cici","Dyrroth","Edith","Esmeralda","Freya",
    "Gatotkaca","Gloo","Guinevere","Hilda","Jawhead","Joy","Julian","Khaleed",
    "Lapu-Lapu","Leomord","Lukas","Martis","Masha","Minsitthar","Paquito",
    "Phoveus","Ruby","Silvanna","Sora","Sun","Suyou","Terizla","Thamuz",
    "Uranus","X.Borg","Yin","Yu Zhong","Zilong"
  ],

  GOLD: [
    "Beatrix","Brody","Bruno","Claude","Clint","Hanabi","Harith","Irithel",
    "Ixia","Karrie","Kimmy","Layla","Lesley","Melissa","Miya","Moskov",
    "Natan","Obsidia","Popol and Kupa","Roger","Wanwan"
  ],

  MID: [
    "Alice","Aurora","Cecilion","Chang'e","Cyclops","Esmeralda","Eudora",
    "Faramis","Gord","Harith","Harley","Julian","Kadita","Kagura","Kimmy",
    "Lunox","Luo Yi","Lylia","Nana","Novaria","Odette","Pharsa","Selena",
    "Vale","Valir","Valentina","Vexana","Xavier","Yve","Zetian","Zhask",
    "Zhuxin"
  ],

  ROAM: [
    "Akai","Angela","Atlas","Badang","Baxia","Belerick","Carmilla","Chip",
    "Chou","Diggie","Edith","Estes","Faramis","Floryn","Franco","Gatotkaca",
    "Gloo","Grock","Helcurt","Hilda","Hylos","Jawhead","Johnson","Kaja",
    "Kalea","Khaleed","Khufra","Lolita","Marcel","Mathilda","Minotaur",
    "Minsitthar","Natalia","Rafaela","Saber","Selena","Tigreal"
  ],

  JUNGLE: [
    "Aamon","Akai","Alpha","Alucard","Aulus","Balmond","Bane","Barats",
    "Baxia","Dyrroth","Fanny","Fredrinn","Freya","Granger","Gusion","Hanzo",
    "Harley","Hayabusa","Helcurt","Hirara","Joy","Julian","Karina","Lancelot",
    "Leomord","Ling","Lukas","Martis","Natalia","Nolan","Popol and Kupa",
    "Roger","Saber","Sun","Suyou","Yi Sun-Shin","Yin"
  ]
};


function getLanes(hero) {
    const lanes = [];

    for (const lane in LANE_MAP) {
        if (LANE_MAP[lane].includes(hero)) {
            lanes.push(lane);
        }
    }

    return lanes;
}

function hasLane(hero, lane) {
    return LANE_MAP[lane]?.includes(hero) || false;
}

const SKIP_TOKEN = '__SKIPPED__';


/* =========================================================================
   STATE MODEL

   `state`      -> synced to the other view + autosaved to localStorage.
   `local`      -> operator-only working memory (undo/redo stacks, filters).
                   Never synced, never persisted.
   `viewerLocal`-> viewer-only working memory (connection status, OBS mode).
========================================================================= */

function defaultPlayers(prefix){
    const roles = ['EXP','JUNGLE','MID','GOLD','ROAM'];
    return roles.map((role,i)=>({ name:`Player ${i+1}`, role }));
}

function createDefaultState(){
    return {
        version: 1,
        meta:{
            tournamentName: 'MLBB CHAMPIONSHIP SERIES',
            tournamentLogo: null,
            matchName: 'GRAND FINALS'
        },
        teams:{
            a:{ name:'BLUE TEAM', logo:null, players: defaultPlayers('a') },
            b:{ name:'RED TEAM',  logo:null, players: defaultPlayers('b') }
        },
        format: 'bo3',
        maxGames: 3,
        sequence: ['a','b','b','a','a','b','b','a','a','b'],
        timerMax: 30,
        timer: { remaining: 30, running: false },
        score: { a:0, b:0 },
        currentGameIndex: 1,
        games: [],                                   // completed games: {index,picksA,picksB,winner}
        currentDraft: { picksA:[], picksB:[], turnIndex:0 },
        selectedHero: null,
        phase: 'setup'                                // setup | drafting | game_complete | match_complete
    };
}

let state = createDefaultState();

const local = {
    history: [],
    future: [],
    searchQuery: '',
    filterMode: 'role',   // 'role' | 'lane' — which filter row is active in the hero grid
    roleFilter: 'ALL',
    laneFilter: 'ALL',
    muted: false,
    historyBrowseIndex: null,   // which past game the Match History panel is focused on
    timerInterval: null
};

const viewerLocal = {
    connection: 'DISCONNECTED',
    lastMessageTs: 0,
    obsTransparent: false
};


/* =========================================================================
   PERSISTENCE + SYNC
========================================================================= */

let channel = null;
try{
    channel = new BroadcastChannel(CHANNEL_NAME);
}catch(e){
    channel = null;
}


/* =========================================================================
   SOCKET.IO REALTIME SYNC
========================================================================= */

let socket = null;

if(typeof io === 'function'){
    socket = io({
        transports: ['websocket', 'polling']
    });

    socket.on('connect', ()=>{
    console.log('[Socket.IO] Connected:', socket.id);

    if(VIEW === 'viewer'){
        setConnection('CONNECTED');
    }

    // Operator sends its current state immediately
    // when the Socket.IO connection becomes ready.
    if(VIEW === 'operator'){
        try{
            socket.emit('updateDraft', state);
            console.log('[Socket.IO] Initial draft state sent.');
        }catch(e){
            console.warn('[Socket.IO] Initial state send failed:', e);
        }
    }
});

    socket.on('disconnect', ()=>{
        console.log('[Socket.IO] Disconnected');

        if(VIEW === 'viewer'){
            setConnection('DISCONNECTED');
        }
    });

    socket.on('connect_error', (error)=>{
        console.warn('[Socket.IO] Connection error:', error.message);

        if(VIEW === 'viewer'){
            setConnection('DISCONNECTED');
        }
    });

    socket.on('draftState', (incomingState)=>{
        console.log('[Socket.IO] Draft state received');

        if(VIEW === 'viewer'){
            handleIncomingState(incomingState);
        }
    });
}else{
    console.warn('[Socket.IO] Socket.IO client not available.');
}

function mergeDefaults(incoming){
    const base = createDefaultState();
    if(!incoming || typeof incoming !== 'object') return base;
    return {
        ...base,
        ...incoming,
        meta:  { ...base.meta,  ...(incoming.meta||{}) },
        teams: {
            a: { ...base.teams.a, ...(incoming.teams&&incoming.teams.a||{}) },
            b: { ...base.teams.b, ...(incoming.teams&&incoming.teams.b||{}) }
        },
        timer: { ...base.timer, ...(incoming.timer||{}) },
        score: { ...base.score, ...(incoming.score||{}) },
        currentDraft: { ...base.currentDraft, ...(incoming.currentDraft||{}) },
        games: Array.isArray(incoming.games) ? incoming.games : [],
        sequence: Array.isArray(incoming.sequence) ? incoming.sequence : base.sequence
    };
}

function saveState(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch(e){ console.warn('Autosave failed (storage quota?)', e); }
}

function loadState(){
    try{
        const raw = localStorage.getItem(STORAGE_KEY);
        if(raw) state = mergeDefaults(JSON.parse(raw));
    }catch(e){ console.warn('Could not restore saved state', e); }
}

function broadcastState(){
    saveState();

    /*
     * SOCKET.IO
     * Operator is the authoritative source.
     * Viewer never sends state back.
     */
    if(VIEW === 'operator' && socket && socket.connected){
        try{
            socket.emit('updateDraft', state);
        }catch(e){
            console.warn('[Socket.IO] Failed to send draft state:', e);
        }
    }

    /*
     * KEEP BroadcastChannel as a local fallback.
     */
    if(channel){
        try{
            channel.postMessage({
                type: 'state',
                payload: state,
                ts: Date.now()
            });
        }catch(e){
            /* ignore */
        }
    }
}

function persistAndSync(){
    broadcastState();
}

/* ---- receiving side (viewer, and cross-tab safety for operator) ---- */

function setConnection(status){
    if(VIEW !== 'viewer') return;
    viewerLocal.connection = status;
    renderConnectionBadge();
}

function handleIncomingState(payload){
    state = mergeDefaults(payload);
    viewerLocal.lastMessageTs = Date.now();
    setConnection('SYNCING');
    renderAll();
    clearTimeout(handleIncomingState._t);
    handleIncomingState._t = setTimeout(()=> setConnection('CONNECTED'), 350);
}

if(channel){
    channel.onmessage = (e)=>{
        const msg = e.data;
        if(!msg) return;

        if(msg.type === 'state'){
            /*
             * Local-tab fallback.
             */
            if(VIEW === 'viewer'){
                handleIncomingState(msg.payload);
            }
        }

        /*
         * Do NOT use BroadcastChannel heartbeat to determine
         * the viewer's internet/socket connection.
         *
         * Socket.IO handles the real connection status.
         */
    };
}

window.addEventListener('storage', (e)=>{
    if(e.key === STORAGE_KEY && e.newValue){
        try{ handleIncomingState(JSON.parse(e.newValue)); }catch(err){ /* ignore */ }
    }
});

if(VIEW === 'operator'){
    setInterval(()=>{
        if(channel){ try{ channel.postMessage({type:'heartbeat', ts:Date.now()}); }catch(e){} }
    }, 2000);
}

if(VIEW === 'viewer'){
    setInterval(()=>{
        if(socket && socket.connected){
            if(viewerLocal.lastMessageTs > 0){
                setConnection('CONNECTED');
            }
        }else{
            setConnection('DISCONNECTED');
        }
    }, 1000);
}


/* =========================================================================
   DERIVED DATA
========================================================================= */

function requiredWins(){ return Math.ceil(state.maxGames / 2); }

function computeFearlessLockedSet(){
    const set = new Set();
    state.games.forEach(g=>{
        (g.picksA||[]).forEach(h=>{ if(h && h!==SKIP_TOKEN) set.add(h); });
        (g.picksB||[]).forEach(h=>{ if(h && h!==SKIP_TOKEN) set.add(h); });
    });
    return set;
}

function isHeroLocked(hero){
    return computeFearlessLockedSet().has(hero)
        || state.currentDraft.picksA.includes(hero)
        || state.currentDraft.picksB.includes(hero);
}

function currentTurnTeam(){
    return state.sequence[state.currentDraft.turnIndex] || null;
}

function allPlayers(team){
    return state.teams[team].players;
}


/* =========================================================================
   UNDO / REDO  (snapshot based — robust across phase transitions)
========================================================================= */

function snapshotForHistory(){
    return JSON.parse(JSON.stringify({
        currentDraft: state.currentDraft,
        games: state.games,
        score: state.score,
        phase: state.phase,
        selectedHero: state.selectedHero,
        currentGameIndex: state.currentGameIndex,
        timer: { remaining: state.timer.remaining }
    }));
}

function applySnapshot(snap){
    state.currentDraft     = snap.currentDraft;
    state.games            = snap.games;
    state.score            = snap.score;
    state.phase            = snap.phase;
    state.selectedHero     = snap.selectedHero;
    state.currentGameIndex = snap.currentGameIndex;
    state.timer.remaining  = snap.timer.remaining;
}

function pushHistory(){
    local.history.push(snapshotForHistory());
    if(local.history.length > 100) local.history.shift();
    local.future = [];
}

function undo(){
    if(VIEW !== 'operator') return;
    if(!local.history.length){ showToast('NOTHING TO UNDO'); return; }
    local.future.push(snapshotForHistory());
    applySnapshot(local.history.pop());
    afterStateJump();
    showToast('UNDO');
}

function redo(){
    if(VIEW !== 'operator') return;
    if(!local.future.length){ showToast('NOTHING TO REDO'); return; }
    local.history.push(snapshotForHistory());
    applySnapshot(local.future.pop());
    afterStateJump();
    showToast('REDO');
}

function afterStateJump(){
    if(state.phase === 'drafting'){ startTimer(); }
    else { stopTimer(); }
    renderAll();
    persistAndSync();
}


/* =========================================================================
   DRAFT ENGINE  (operator-only mutations)
========================================================================= */

function beginMatch(setupData){
    state = createDefaultState();
    Object.assign(state.meta, setupData.meta);
    state.teams.a = setupData.teams.a;
    state.teams.b = setupData.teams.b;
    state.format   = setupData.format;
    state.maxGames = setupData.maxGames;
    state.timerMax = setupData.timerMax;
    state.timer    = { remaining: setupData.timerMax, running:false };
    state.phase    = 'drafting';

    local.history = [];
    local.future  = [];

    renderAll();
    startTimer();
    persistAndSync();
    showToast(`GAME 1 — ${state.meta.matchName}`);
}

function backToSetup(){
    if(!confirm('Return to setup? Current match progress will be cleared.')) return;
    stopTimer();
    state = createDefaultState();
    local.history = [];
    local.future  = [];
    renderAll();
    persistAndSync();
    document.getElementById('setupScreen')?.classList.remove('hidden');
    document.getElementById('app')?.classList.add('hidden');
}

function pickHero(hero){
    if(VIEW !== 'operator') return;
    if(state.phase !== 'drafting') return;
    if(isHeroLocked(hero)){ showToast(`${hero} is unavailable`); return; }

    const turn = currentTurnTeam();
    if(!turn) return;

    const bucket = turn === 'a' ? state.currentDraft.picksA : state.currentDraft.picksB;
    if(bucket.length >= 5){ showToast('TEAM HAS COMPLETED ITS PICKS'); return; }

    pushHistory();
    bucket.push(hero);
    state.selectedHero = hero;
    state.currentDraft.turnIndex++;
    playSound('pick');
    resetTimer();
    renderAll();

    if(state.currentDraft.turnIndex >= state.sequence.length){
        setTimeout(finishDraft, 450);
    }
    persistAndSync();
}

function skipTurn(){
    if(VIEW !== 'operator' || state.phase !== 'drafting') return;
    const turn = currentTurnTeam();
    if(!turn) return;
    const bucket = turn === 'a' ? state.currentDraft.picksA : state.currentDraft.picksB;
    if(bucket.length >= 5) return;

    pushHistory();
    bucket.push(SKIP_TOKEN);
    state.selectedHero = null;
    state.currentDraft.turnIndex++;
    resetTimer();
    renderAll();

    if(state.currentDraft.turnIndex >= state.sequence.length){
        setTimeout(finishDraft, 450);
    }
    persistAndSync();
}

function finishDraft(){
    if(state.phase !== 'drafting') return;
    pushHistory();
    stopTimer();

    state.games.push({
        index: state.currentGameIndex,
        picksA: [...state.currentDraft.picksA],
        picksB: [...state.currentDraft.picksB],
        winner: null
    });

    state.phase = 'game_complete';
    renderAll();
    persistAndSync();
    playSound('complete');
}

function declareWinner(team){
    if(VIEW !== 'operator' || state.phase !== 'game_complete') return;
    pushHistory();

    const game = state.games[state.games.length - 1];
    game.winner = team;
    state.score[team]++;

    if(state.score.a >= requiredWins() || state.score.b >= requiredWins()){
        state.phase = 'match_complete';
        stopTimer();
        playSound('complete');
    } else {
        startNextGame();
    }

    renderAll();
    persistAndSync();
}

function startNextGame(){
    state.currentGameIndex++;
    state.currentDraft = { picksA:[], picksB:[], turnIndex:0 };
    state.selectedHero = null;
    state.phase = 'drafting';
    resetTimer();
    showToast(`GAME ${state.currentGameIndex} — FEARLESS DRAFT`);
}

function resetCurrentDraft(){
    if(VIEW !== 'operator' || state.phase !== 'drafting') return;
    if(!confirm('Reset the current draft? All picks in this game will be cleared.')) return;
    pushHistory();
    state.currentDraft = { picksA:[], picksB:[], turnIndex:0 };
    state.selectedHero = null;
    resetTimer();
    renderAll();
    persistAndSync();
}

function resetEntireMatch(){
    if(VIEW !== 'operator') return;
    if(!confirm('Reset the ENTIRE match? Scores and game history will be cleared, teams stay the same.')) return;
    pushHistory();
    state.score = { a:0, b:0 };
    state.games = [];
    state.currentGameIndex = 1;
    state.currentDraft = { picksA:[], picksB:[], turnIndex:0 };
    state.selectedHero = null;
    state.phase = 'drafting';
    resetTimer();
    renderAll();
    persistAndSync();
}

function swapSides(){
    if(VIEW !== 'operator') return;
    if(!confirm('Swap Blue and Red team identities? Names, logos, players and score will switch sides.')) return;
    pushHistory();
    const a = state.teams.a, b = state.teams.b;
    state.teams.a = b; state.teams.b = a;
    const sa = state.score.a; state.score.a = state.score.b; state.score.b = sa;
    renderAll();
    persistAndSync();
    showToast('SIDES SWAPPED');
}


/* =========================================================================
   MATCH HISTORY EDITING  (fearless locks always recalculated, never stored)
========================================================================= */

function deleteGameFromHistory(index){
    if(VIEW !== 'operator') return;
    if(!confirm(`Delete Game ${index} from match history? This frees any heroes it locked.`)) return;
    pushHistory();
    state.games = state.games.filter(g => g.index !== index);
    renderAll();
    persistAndSync();
}

function removeHeroFromHistory(gameIndex, team, hero){
    if(VIEW !== 'operator') return;
    pushHistory();
    const game = state.games.find(g => g.index === gameIndex);
    if(!game) return;
    const key = team === 'a' ? 'picksA' : 'picksB';
    game[key] = game[key].filter(h => h !== hero);
    renderAll();
    persistAndSync();
    showToast(`${hero} REMOVED FROM GAME ${gameIndex} HISTORY`);
}


/* =========================================================================
   TIMER
========================================================================= */

function startTimer(){
    stopTimer();
    if(VIEW !== 'operator' || state.phase !== 'drafting') return;
    state.timer.running = true;
    updatePauseButton();
    renderTimer();

    local.timerInterval = setInterval(()=>{
        if(state.phase !== 'drafting'){ stopTimer(); return; }
        if(!state.timer.running) return;

        if(state.timer.remaining <= 0){
            state.timer.remaining = 0;
            state.timer.running = false;
            stopTimer();
            updatePauseButton();
            renderTimer();
            showToast('PICK TIMER EXPIRED');
            playSound('expire');
            persistAndSync();
            return;
        }

        state.timer.remaining--;
        renderTimer();
        if(state.timer.remaining <= 5 && state.timer.remaining > 0) playSound('tick');
        persistAndSync();

        if(state.timer.remaining <= 0){
            state.timer.running = false;
            stopTimer();
            updatePauseButton();
            renderTimer();
            showToast('PICK TIMER EXPIRED');
            playSound('expire');
            persistAndSync();
        }
    }, 1000);
}

function stopTimer(){
    if(local.timerInterval !== null){ clearInterval(local.timerInterval); local.timerInterval = null; }
}

function toggleTimer(){
    if(VIEW !== 'operator' || state.phase !== 'drafting') return;
    state.timer.running = !state.timer.running;
    updatePauseButton();
    persistAndSync();
}

function addTime(seconds){
    if(VIEW !== 'operator' || state.phase !== 'drafting') return;
    state.timer.remaining = Math.min(180, state.timer.remaining + seconds);
    renderTimer();
    persistAndSync();
}

function resetTimer(){
    state.timer.remaining = state.timerMax;
    state.timer.running = true;
    renderTimer();
    if(VIEW === 'operator') startTimer();
}

function updatePauseButton(){
    const btn = document.getElementById('pauseBtn');
    if(btn) btn.textContent = state.timer.running ? 'PAUSE' : 'RESUME';
}


/* =========================================================================
   SOUND (WebAudio beeps — no external assets required)
========================================================================= */

let audioCtx = null;
function playSound(kind){
    if(VIEW !== 'operator' || local.muted) return;
    try{
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        const freqs = { pick: 520, tick: 880, expire: 220, complete: 660, lock_hero: 740 };
        o.frequency.value = freqs[kind] || 440;
        g.gain.value = 0.06;
        o.start();
        g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
        o.stop(audioCtx.currentTime + 0.2);
    }catch(e){ /* audio not available */ }
}


/* =========================================================================
   EXPORT / IMPORT
========================================================================= */

function exportMatch(){
    const blob = new Blob([JSON.stringify(state, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (state.meta.matchName || 'match').toLowerCase().replace(/[^a-z0-9]+/g,'-');
    a.href = url;
    a.download = `mlbb-fearless-draft-${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('MATCH EXPORTED');
}

function importMatch(file){
    const reader = new FileReader();
    reader.onload = ()=>{
        try{
            const parsed = JSON.parse(reader.result);
            pushHistory();
            state = mergeDefaults(parsed);
            local.history = [];
            local.future = [];
            document.getElementById('setupScreen')?.classList.add('hidden');
            document.getElementById('app')?.classList.remove('hidden');
            renderAll();
            if(state.phase === 'drafting') startTimer();
            persistAndSync();
            showToast('MATCH IMPORTED');
        }catch(e){
            showToast('IMPORT FAILED — INVALID FILE');
        }
    };
    reader.readAsText(file);
}


/* =========================================================================
   TOAST
========================================================================= */

let toastTimeout;
function showToast(message){
    const toast = document.getElementById('toast');
    if(!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(()=> toast.classList.remove('show'), 1800);
}


/* =========================================================================
   PUBLIC HOOKS (bonus: future OCR / OBS / automation integrations)
========================================================================= */

window.MLBBDraftAPI = {
    getState: ()=> JSON.parse(JSON.stringify(state)),
    onChange: (cb)=> { document.addEventListener('mlbb:render', ()=> cb(window.MLBBDraftAPI.getState())); },
    pickHero: (hero)=> pickHero(hero),
    declareWinner: (team)=> declareWinner(team),
    undo, redo
};


/* =========================================================================
   RENDERING — shared between operator & viewer (elements guarded with `?.`)
========================================================================= */

function renderAll(){
    renderScoreboard();
    renderPlayers();
    renderFeatured();
    renderTurn();
    renderFearlessPanels();
    if(document.getElementById('pickHistoryList')) renderPickHistory();
    renderTimer();
    renderProgress();
    renderPhaseUI();

    if(VIEW === 'operator'){
        renderHeroGrid();
        renderMatchHistory();
        renderControlsState();
    }

    document.dispatchEvent(new CustomEvent('mlbb:render'));
}

function renderConnectionBadge(){
    if(VIEW !== 'viewer') return;

    const badge = document.getElementById('connectionBadge');
    if(!badge) return;

    const status = viewerLocal.connection;

    badge.classList.remove(
        'connected',
        'disconnected',
        'syncing'
    );

    if(status === 'CONNECTED'){
        badge.classList.add('connected');
        badge.title = 'Connected';
    }
    else if(status === 'SYNCING'){
        badge.classList.add('syncing');
        badge.title = 'Syncing';
    }
    else{
        badge.classList.add('disconnected');
        badge.title = 'Disconnected';
    }
}

function renderScoreboard(){
    setText('tournamentName', state.meta.tournamentName);
    setText('matchName', state.meta.matchName);
    setImg('tournamentLogo', state.meta.tournamentLogo);

    setText('displayTeamA', state.teams.a.name);
    setText('displayTeamB', state.teams.b.name);
    setText('sideTeamA', state.teams.a.name);
    setText('sideTeamB', state.teams.b.name);
    setImg('teamLogoA', state.teams.a.logo);
    setImg('teamLogoB', state.teams.b.logo);

    setText('scoreA', state.score.a);
    setText('scoreB', state.score.b);

    setText('seriesLabel', state.format.toUpperCase());
    setText('gameProgress', `GAME ${Math.min(state.currentGameIndex, state.maxGames)} OF ${state.maxGames}`);
}

function setText(id, value){
    const el = document.getElementById(id);
    if(el) el.textContent = value;
}
function setImg(id, src){
    const el = document.getElementById(id);
    if(!el) return;
    if(src){ el.src = src; el.style.display = ''; }
    else { el.removeAttribute('src'); el.style.display = 'none'; }
}

function createPlayerSlot(team, index, player){
    const div = document.createElement('div');
    div.className = 'player-slot ' + (team === 'a' ? 'blue' : 'red');
    div.id = `${team}-player-slot-${index}`;
    div.innerHTML = `
        <div class="player-splash"><img class="splash-img" id="${team}-player-splash-${index}" alt="" style="display:none;"></div>
        <div class="player-hero-name" id="${team}-player-hero-${index}"></div>
        <div class="player-name">${escapeHtml(player.name)}</div>
        <div class="player-role">${escapeHtml(player.role)}</div>
    `;
    return div;
}

function renderPlayers(){
    const a = document.getElementById('playersA');
    const b = document.getElementById('playersB');
    if(!a || !b) return;
    a.innerHTML = ''; b.innerHTML = '';
    for(let i=0;i<5;i++){
        a.appendChild(createPlayerSlot('a', i, allPlayers('a')[i]));
        b.appendChild(createPlayerSlot('b', i, allPlayers('b')[i]));
    }
    renderPlayerHeroes();
}

function setPlayerHero(team, index, hero){
    const slot = document.getElementById(`${team}-player-slot-${index}`);
    const splash = document.getElementById(`${team}-player-splash-${index}`);
    const heroNameEl = document.getElementById(`${team}-player-hero-${index}`);
    if(!slot || !splash) return;

    if(hero === SKIP_TOKEN){
        slot.classList.add('skipped');
        if(heroNameEl) heroNameEl.textContent = 'SKIPPED';
        return;
    }
    slot.classList.add('picked');
    splash.style.display = 'block';
    loadHeroImage(splash, hero, ['splash','portrait','icon']);
    if(heroNameEl) heroNameEl.textContent = hero;
}

function clearPlayer(team, index){
    const splash = document.getElementById(`${team}-player-splash-${index}`);
    const slot = document.getElementById(`${team}-player-slot-${index}`);
    const heroNameEl = document.getElementById(`${team}-player-hero-${index}`);
    if(splash){ splash.removeAttribute('src'); splash.style.display = 'none'; }
    if(slot){ slot.classList.remove('picked','active','skipped'); }
    if(heroNameEl) heroNameEl.textContent = '';
}

function renderPlayerHeroes(){
    for(let i=0;i<5;i++){ clearPlayer('a',i); clearPlayer('b',i); }

    state.currentDraft.picksA.forEach((hero,i)=>{ if(i<5) setPlayerHero('a', i, hero); });
    state.currentDraft.picksB.forEach((hero,i)=>{ if(i<5) setPlayerHero('b', i, hero); });

    document.querySelectorAll('.player-slot').forEach(x=>x.classList.remove('active'));

    if(state.phase === 'drafting'){
        const turn = currentTurnTeam();
        if(turn){
            const pickNumber = turn === 'a' ? state.currentDraft.picksA.length : state.currentDraft.picksB.length;
            document.getElementById(`${turn}-player-slot-${pickNumber}`)?.classList.add('active');
        }
    }
}

function renderTurn(){
    const turn = currentTurnTeam();
    document.getElementById('turnA')?.classList.toggle('active', turn === 'a');
    document.getElementById('turnB')?.classList.toggle('active', turn === 'b');
    document.body.classList.toggle('turn-blue', turn === 'a');
    document.body.classList.toggle('turn-red', turn === 'b');
}

function renderFeatured(){
    const img = document.getElementById('featuredImage');
    const name = document.getElementById('featuredName');
    const status = document.getElementById('featuredStatus');
    const backdrop = document.getElementById('centerBackdrop');
    const cardStage = document.getElementById('cardStage');
    const heroCard = cardStage ? cardStage.querySelector('.stage-hero-card') : null;

    if(!state.selectedHero){
        if(img){ img.removeAttribute('src'); img.style.display = 'none'; }
        if(name) name.textContent = '—';
        if(status) status.innerHTML = state.phase === 'setup' ? 'WAITING TO START' : 'WAITING FOR PICK';
        if(backdrop){ backdrop.style.backgroundImage = 'none'; backdrop.style.opacity = '0'; }
        return;
    }

    const hero = state.selectedHero;

    if(img){
        loadFeaturedImage(img, hero);
    }

    // Restart the card-pop animation on the physical card slab, not the <img>,
    // so the frame / glass / glow all pop together as one object.
    if(heroCard){
        heroCard.classList.remove('pop-in');
        void heroCard.offsetWidth;
        heroCard.classList.add('pop-in');
    }

    let playerName = 'PLAYER', teamName = '', teamClass = '';
    const indexA = state.currentDraft.picksA.indexOf(hero);
    const indexB = state.currentDraft.picksB.indexOf(hero);

    if(indexA !== -1){ playerName = allPlayers('a')[indexA]?.name || `PLAYER ${indexA+1}`; teamName = state.teams.a.name; teamClass = 'blue'; }
    else if(indexB !== -1){ playerName = allPlayers('b')[indexB]?.name || `PLAYER ${indexB+1}`; teamName = state.teams.b.name; teamClass = 'red'; }

    // Drive the whole 3D stage's accent theme (halo, ring, pedestal trim,
    // card frame) from a single class on #cardStage.
    if(cardStage){
        cardStage.classList.remove('active-team-blue','active-team-red');
        if(teamClass) cardStage.classList.add(`active-team-${teamClass}`);
    }

    if(name){
        name.innerHTML = `
            <span class="featured-hero-name">${escapeHtml(hero)}</span>
            <span class="featured-player-name">${escapeHtml(playerName)}</span>
        `;
    }

    if(status){
        status.innerHTML = `
            <span class="team-badge ${teamClass}">${escapeHtml(teamName)}</span>
            <span class="role-badge">${escapeHtml(getRoles(hero))}</span>
            <span class="lane-badge">${escapeHtml(getLanes(hero))}</span>
        `;
    }

    if(backdrop){
        const splashUrl = heroAsset('splash', hero);
        const test = new Image();
        test.onload = ()=>{ backdrop.style.backgroundImage = `url("${splashUrl}")`; backdrop.style.opacity = '.24'; };
        test.onerror = ()=>{ backdrop.style.backgroundImage = `url("${heroAsset('portrait',hero)}")`; backdrop.style.opacity = '.20'; };
        test.src = splashUrl;
    }

    // Broadcast audio hook: fires every time a hero is (re)rendered into
    // the featured stage, independent of the "pick" SFX fired on selection.
    playSound('lock_hero');
}

/* =========================================================================
   3D CARD STAGE — mouse parallax / tilt micro-interaction
   Tracks the cursor over #cardStage and tilts the floating .hero-card
   toward it, so the "slab" reads as a physical object catching light,
   independent of the pedestal and ring beneath it.
========================================================================= */
function wireCardStageTilt(){
    const stage = document.getElementById('cardStage');
    const card  = stage ? stage.querySelector('.stage-hero-card') : null;
    if(!stage || !card) return;

    const BASE_RX   = 8;   // resting rotateX, matches the CSS default tilt
    const MAX_RX    = 14;  // extra tilt available toward/away from cursor
    const MAX_RY    = 16;  // left/right tilt range
    const LIFT_Z    = 30;  // resting elevation above the pedestal
    const LIFT_Z_UP = 42;  // elevation while the cursor is over the stage

    let raf = null;
    let targetRX = BASE_RX, targetRY = 0, targetZ = LIFT_Z;
    let curRX = BASE_RX, curRY = 0, curZ = LIFT_Z;

    function apply(){
        // Light easing toward the target each frame for a smooth, physical feel.
        curRX += (targetRX - curRX) * 0.18;
        curRY += (targetRY - curRY) * 0.18;
        curZ  += (targetZ  - curZ)  * 0.18;
        card.style.transform = `rotateX(${curRX.toFixed(2)}deg) rotateY(${curRY.toFixed(2)}deg) translate(-50%, -50%) translateZ(${curZ.toFixed(1)}px)`;

        const settled = Math.abs(targetRX-curRX) < 0.03 && Math.abs(targetRY-curRY) < 0.03 && Math.abs(targetZ-curZ) < 0.05;
        if(settled){ raf = null; return; } // stop the loop once it converges, don't spin forever
        raf = requestAnimationFrame(apply);
    }

    function handleMove(e){
        const rect = stage.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width)  * 2 - 1; // -1 .. 1
        const ny = ((e.clientY - rect.top)  / rect.height) * 2 - 1; // -1 .. 1
        targetRY = Math.max(-1, Math.min(1, nx)) * MAX_RY;
        targetRX = BASE_RX - Math.max(-1, Math.min(1, ny)) * MAX_RX;
        targetZ  = LIFT_Z_UP;
        if(!raf) raf = requestAnimationFrame(apply);
    }

    function handleLeave(){
        targetRX = BASE_RX; targetRY = 0; targetZ = LIFT_Z;
        if(!raf) raf = requestAnimationFrame(apply);
    }

    stage.addEventListener('mousemove', handleMove);
    stage.addEventListener('mouseleave', handleLeave);
}

function renderFearlessPanels(){
    const containerA = document.getElementById('currentIconsA');
    const containerB = document.getElementById('currentIconsB');
    if(containerA) containerA.innerHTML = '';
    if(containerB) containerB.innerHTML = '';

    const lockedA = [], lockedB = [];
    state.games.forEach(game=>{
        (game.picksA||[]).forEach(h=>{ if(h && h!==SKIP_TOKEN && !lockedA.includes(h)) lockedA.push(h); });
        (game.picksB||[]).forEach(h=>{ if(h && h!==SKIP_TOKEN && !lockedB.includes(h)) lockedB.push(h); });
    });

    function makeIcon(hero, teamName){
        const img = document.createElement('img');
        img.className = 'fearless-side-icon';
        img.alt = hero;
        img.title = `${hero} — ${teamName} FEARLESS LOCKED`;
        loadHeroImage(img, hero, ['icon','portrait']);
        return img;
    }

    if(containerA) lockedA.forEach(h => containerA.appendChild(makeIcon(h, state.teams.a.name)));
    if(containerB) lockedB.forEach(h => containerB.appendChild(makeIcon(h, state.teams.b.name)));
}

function renderPickHistory(){
    const list = document.getElementById('pickHistoryList');
    if(!list) return;
    list.innerHTML = '';

    const rows = [];
    state.currentDraft.picksA.forEach(()=>{});
    let ai = 0, bi = 0;
    state.sequence.forEach((team, i)=>{
        const bucket = team === 'a' ? state.currentDraft.picksA : state.currentDraft.picksB;
        const seenSoFar = team === 'a' ? ai : bi;
        if(seenSoFar < bucket.length){
            const hero = bucket[seenSoFar];
            const playerIdx = seenSoFar;
            const player = allPlayers(team)[playerIdx];
            rows.push({ n: i+1, team, hero, player: player ? player.name : '' });
            if(team === 'a') ai++; else bi++;
        }
    });

    if(!rows.length){
        list.innerHTML = '<div class="empty-row">NO PICKS YET</div>';
        return;
    }

    rows.forEach(r=>{
        const row = document.createElement('div');
        row.className = 'pick-history-row ' + (r.team === 'a' ? 'blue' : 'red');
        const heroLabel = r.hero === SKIP_TOKEN ? 'SKIPPED' : escapeHtml(r.hero);
        row.innerHTML = `
            <span class="pick-n">#${r.n}</span>
            <span class="pick-team">${r.team === 'a' ? escapeHtml(state.teams.a.name) : escapeHtml(state.teams.b.name)}</span>
            <span class="pick-player">${escapeHtml(r.player)}</span>
            <span class="pick-hero">${heroLabel}</span>
        `;
        list.appendChild(row);
    });
    list.scrollTop = list.scrollHeight;
}

function renderProgress(){
    const current = state.currentDraft.turnIndex;
    const total = state.sequence.length;
    setText('progressText', `GAME ${state.currentGameIndex} • DRAFT ${current} / ${total}`);
    const fill = document.getElementById('progressFill');
    if(fill) fill.style.width = `${(current / total) * 100}%`;
}

function renderTimer(){
    const timer = document.getElementById('timer');
    if(!timer) return;
    timer.textContent = Math.max(0, state.timer.remaining);
    timer.classList.toggle('warning', state.timer.remaining <= 10 && state.timer.remaining > 5);
    timer.classList.toggle('danger', state.timer.remaining <= 5);
    timer.classList.toggle('paused', !state.timer.running && state.phase === 'drafting');
}

function renderPhaseUI(){
    const resultPanel = document.getElementById('resultPanel');
    const matchOverlay = document.getElementById('matchCompleteOverlay');

    if(resultPanel) resultPanel.classList.toggle('hidden', state.phase !== 'game_complete');
    if(matchOverlay) matchOverlay.classList.toggle('hidden', state.phase !== 'match_complete');

    if(state.phase === 'match_complete'){
        const winner = state.score.a > state.score.b ? 'a' : 'b';
        setText('championName', winner === 'a' ? state.teams.a.name : state.teams.b.name);
        setText('championScore', `${state.score.a} - ${state.score.b}`);
        const overlay = document.getElementById('matchCompleteOverlay');
        overlay?.classList.remove('team-blue','team-red');
        overlay?.classList.add(winner === 'a' ? 'team-blue' : 'team-red');
    }

    if(VIEW === 'operator' && resultPanel && state.phase === 'game_complete'){
        resultPanel.scrollIntoView?.({ behavior:'smooth', block:'nearest' });
    }
}


/* =========================================================================
   OPERATOR-ONLY RENDERING
========================================================================= */

function renderHeroGrid(){
    const grid = document.getElementById('heroGrid');
    if(!grid) return;
    grid.innerHTML = '';

    const lockedSet = computeFearlessLockedSet();

    const heroesToShow = HEROES.filter(hero=>{
        if(local.searchQuery && !hero.toLowerCase().includes(local.searchQuery)) return false;
        if(local.filterMode === 'lane'){
            if(local.laneFilter !== 'ALL' && !hasLane(hero, local.laneFilter)) return false;
        } else {
            if(local.roleFilter !== 'ALL' && !hasRole(hero, local.roleFilter)) return false;
        }
        return true;
    });

    const available = heroesToShow.filter(h => !isHeroLocked(h));
    setText('availableCount', `${available.length} AVAILABLE`);

    heroesToShow.forEach(hero=>{
        const fearlessLocked = lockedSet.has(hero);
        const pickedThisGame = state.currentDraft.picksA.includes(hero) || state.currentDraft.picksB.includes(hero);
        const locked = fearlessLocked || pickedThisGame;

        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'hero-card';
        card.dataset.role = getRoles(hero).join(',');
        card.dataset.lane = getLanes(hero).join(',');
        if(locked) card.classList.add('hero-locked');
        if(pickedThisGame) card.classList.add('hero-picked');
        if(fearlessLocked) card.classList.add('hero-fearless');

        const img = document.createElement('img');
        loadHeroImage(img, hero, ['icon','portrait','splash']);

        const name = document.createElement('div');
        name.className = 'hero-card-name';
        name.textContent = hero;

        card.appendChild(img);
        card.appendChild(name);
        if(fearlessLocked){
            const lock = document.createElement('div');
            lock.className = 'hero-lock-icon';
            lock.textContent = '🔒';
            card.appendChild(lock);
        }

        card.addEventListener('mouseenter', ()=> showHeroPreview(hero, card));
        card.addEventListener('mouseleave', hideHeroPreview);

        card.onclick = ()=>{
            if(locked){ showToast(`${hero} is unavailable`); return; }
            pickHero(hero);
        };

        grid.appendChild(card);
    });
}

function showHeroPreview(hero, card){
    if(!window.matchMedia('(hover:hover)').matches) return;
    const preview = document.getElementById('heroPreview');
    if(!preview) return;
    const img = preview.querySelector('img');
    loadHeroImage(img, hero, ['portrait','splash','icon']);
    preview.querySelector('.hp-name').textContent = hero;
    preview.querySelector('.hp-role').textContent = `${getRoles(hero)} • ${getLanes(hero)}`;
    const rect = card.getBoundingClientRect();
    preview.style.left = Math.min(window.innerWidth - 190, rect.left) + 'px';
    preview.style.top = (rect.top - 210) + 'px';
    preview.classList.add('show');
}
function hideHeroPreview(){ document.getElementById('heroPreview')?.classList.remove('show'); }

function renderMatchHistory(){
    const list = document.getElementById('matchHistoryList');
    if(!list) return;
    list.innerHTML = '';

    if(!state.games.length){
        list.innerHTML = '<div class="empty-row">NO COMPLETED GAMES YET</div>';
        return;
    }

    state.games.forEach(game=>{
        const card = document.createElement('div');
        card.className = 'history-game-card';

        function chips(picks, team){
            return picks.map(hero=>{
                if(hero === SKIP_TOKEN) return `<span class="history-chip skip">SKIP</span>`;
                return `<span class="history-chip" data-team="${team}" data-hero="${escapeHtml(hero)}" data-game="${game.index}">
                            <img alt="">
                            <span>${escapeHtml(hero)}</span>
                            <button type="button" class="chip-remove" title="Remove from history">×</button>
                        </span>`;
            }).join('');
        }

        const winnerLabel = game.winner
            ? (game.winner === 'a' ? escapeHtml(state.teams.a.name) : escapeHtml(state.teams.b.name))
            : 'PENDING';

        card.innerHTML = `
            <div class="history-game-head">
                <span class="history-game-title">GAME ${game.index}</span>
                <span class="history-game-winner">WINNER: ${winnerLabel}</span>
                <button type="button" class="control-btn danger tiny" data-action="delete-game" data-game="${game.index}">DELETE</button>
            </div>
            <div class="history-game-body">
                <div class="history-team blue"><span>${escapeHtml(state.teams.a.name)}</span><div class="history-chips">${chips(game.picksA,'a')}</div></div>
                <div class="history-team red"><span>${escapeHtml(state.teams.b.name)}</span><div class="history-chips">${chips(game.picksB,'b')}</div></div>
            </div>
        `;
        list.appendChild(card);
        card.querySelectorAll('.history-chip').forEach(chip=>{
            const img = chip.querySelector('img');
            if(img) loadHeroImage(img, chip.dataset.hero, ['icon','portrait','splash']);
        });
    });

    list.querySelectorAll('[data-action="delete-game"]').forEach(btn=>{
        btn.addEventListener('click', ()=> deleteGameFromHistory(Number(btn.dataset.game)));
    });
    list.querySelectorAll('.chip-remove').forEach(btn=>{
        btn.addEventListener('click', (e)=>{
            const chip = e.target.closest('.history-chip');
            removeHeroFromHistory(Number(chip.dataset.game), chip.dataset.team, chip.dataset.hero);
        });
    });
}

function renderControlsState(){
    const btn = (id)=> document.getElementById(id);
    if(btn('undoBtn')) btn('undoBtn').disabled = local.history.length === 0;
    if(btn('redoBtn')) btn('redoBtn').disabled = local.future.length === 0;
    if(btn('pauseBtn')) btn('pauseBtn').disabled = state.phase !== 'drafting';
    if(btn('skipBtn')) btn('skipBtn').disabled = state.phase !== 'drafting';
    if(btn('resetDraftBtn')) btn('resetDraftBtn').disabled = state.phase !== 'drafting';
}


/* =========================================================================
   SETUP SCREEN (operator)
========================================================================= */

function renderRoleOptions(select, current){
    ['EXP','JUNGLE','MID','GOLD','ROAM'].forEach(role=>{
        const opt = document.createElement('option');
        opt.value = role; opt.textContent = role;
        if(role === current) opt.selected = true;
        select.appendChild(opt);
    });
}

function buildSetupPlayerRows(team){
    const wrap = document.getElementById(team === 'a' ? 'setupPlayersA' : 'setupPlayersB');
    if(!wrap) return;
    wrap.innerHTML = '';
    for(let i=0;i<5;i++){
        const row = document.createElement('div');
        row.className = 'setup-player-row';
        row.innerHTML = `
            <input class="setup-input player-input-${team}" data-index="${i}" value="Player ${i+1}" placeholder="Player ${i+1} name">
            <select class="setup-role player-role-${team}" data-index="${i}"></select>
        `;
        wrap.appendChild(row);
        renderRoleOptions(row.querySelector('select'), ['EXP','JUNGLE','MID','GOLD','ROAM'][i]);
    }
}

function readLogoInput(inputEl, callback){
    const file = inputEl.files && inputEl.files[0];
    if(!file) return;
    if(file.size > 2 * 1024 * 1024){ showToast('LOGO TOO LARGE (MAX 2MB)'); return; }
    const reader = new FileReader();
    reader.onload = ()=> callback(reader.result);
    reader.readAsDataURL(file);
}

function collectSetupData(){
    const teamA = {
        name: document.getElementById('teamA').value.trim() || 'BLUE TEAM',
        logo: window.__logoA || null,
        players: [...document.querySelectorAll('.player-input-a')].map((el,i)=>({
            name: el.value.trim() || `Player ${i+1}`,
            role: document.querySelectorAll('.player-role-a')[i]?.value || 'EXP'
        }))
    };
    const teamB = {
        name: document.getElementById('teamB').value.trim() || 'RED TEAM',
        logo: window.__logoB || null,
        players: [...document.querySelectorAll('.player-input-b')].map((el,i)=>({
            name: el.value.trim() || `Player ${i+1}`,
            role: document.querySelectorAll('.player-role-b')[i]?.value || 'EXP'
        }))
    };

    const format = document.getElementById('format').value;
    const maxGames = { bo1:1, bo3:3, bo5:5, bo7:7 }[format] || 3;
    const timerMax = Number(document.getElementById('timerSeconds').value) || 30;

    return {
        meta:{
            tournamentName: document.getElementById('tournamentName').value.trim() || 'MLBB CHAMPIONSHIP SERIES',
            tournamentLogo: window.__logoT || null,
            matchName: document.getElementById('matchName').value.trim() || 'GRAND FINALS'
        },
        teams: { a: teamA, b: teamB },
        format, maxGames, timerMax
    };
}


/* =========================================================================
   INIT — OPERATOR
========================================================================= */

function initOperator(){
    loadState();
    buildSetupPlayerRows('a');
    buildSetupPlayerRows('b');

    document.getElementById('tournamentLogoInput')?.addEventListener('change', e=>{
        readLogoInput(e.target, (data)=>{ window.__logoT = data; setImg('setupTournamentLogoPreview', data); });
    });
    document.getElementById('teamLogoInputA')?.addEventListener('change', e=>{
        readLogoInput(e.target, (data)=>{ window.__logoA = data; setImg('setupTeamLogoPreviewA', data); });
    });
    document.getElementById('teamLogoInputB')?.addEventListener('change', e=>{
        readLogoInput(e.target, (data)=>{ window.__logoB = data; setImg('setupTeamLogoPreviewB', data); });
    });

    document.getElementById('startDraftBtn')?.addEventListener('click', ()=>{
        const setup = collectSetupData();
        beginMatch(setup);
        document.getElementById('setupScreen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    });

    // If we restored an in-progress match, jump straight into the app view.
    if(state.phase !== 'setup'){
        document.getElementById('setupScreen')?.classList.add('hidden');
        document.getElementById('app')?.classList.remove('hidden');
        if(state.phase === 'drafting') startTimer();
    }

    wireControls();
    wireFilters();
    wireKeyboard();
    wireCardStageTilt();
    renderAll();
    persistAndSync();
}

function wireControls(){
    const on = (id, fn)=> document.getElementById(id)?.addEventListener('click', fn);

    on('pauseBtn', toggleTimer);
    on('addTimeBtn', ()=> addTime(10));
    on('undoBtn', undo);
    on('redoBtn', redo);
    on('skipBtn', skipTurn);
    on('resetDraftBtn', resetCurrentDraft);
    on('resetMatchBtn', resetEntireMatch);
    on('backToSetupBtn', backToSetup);
    on('swapSidesBtn', swapSides);
    on('exportBtn', exportMatch);
    on('blueWinBtn', ()=> declareWinner('a'));
    on('redWinBtn', ()=> declareWinner('b'));
    on('newSeriesBtn', backToSetup);

    on('matchHistoryBtn', ()=>{
        const panel = document.getElementById('matchHistoryPanel');
        if(panel){
            panel.classList.toggle('hidden');
            if(!panel.classList.contains('hidden')){
                local.historyBrowseIndex = null;
                renderMatchHistory();
            }
        }
    });
    on('closeMatchHistoryBtn', ()=>{
        document.getElementById('matchHistoryPanel')?.classList.add('hidden');
    });
    on('muteBtn', ()=>{
        local.muted = !local.muted;
        document.getElementById('muteBtn').textContent = local.muted ? 'UNMUTE' : 'MUTE';
    });

    document.getElementById('importInput')?.addEventListener('change', e=>{
        const file = e.target.files[0];
        if(file) importMatch(file);
        e.target.value = '';
    });
    document.getElementById('importBtn')?.addEventListener('click', ()=>{
        document.getElementById('importInput')?.click();
    });
}

function wireFilters(){
    document.getElementById('search')?.addEventListener('input', e=>{
        local.searchQuery = e.target.value.toLowerCase();
        renderHeroGrid();
    });

    document.querySelectorAll('#roleFilterBar .role-btn').forEach(btn=>{
        btn.addEventListener('click', ()=>{
            local.roleFilter = btn.dataset.role;
            document.querySelectorAll('#roleFilterBar .role-btn').forEach(b=> b.classList.toggle('active', b === btn));
            renderHeroGrid();
        });
    });

    document.querySelectorAll('#laneFilterBar .role-btn').forEach(btn=>{
        btn.addEventListener('click', ()=>{
            local.laneFilter = btn.dataset.lane;
            document.querySelectorAll('#laneFilterBar .role-btn').forEach(b=> b.classList.toggle('active', b === btn));
            renderHeroGrid();
        });
    });

    document.querySelectorAll('#filterModeToggle .mode-btn').forEach(btn=>{
        btn.addEventListener('click', ()=>{
            local.filterMode = btn.dataset.mode;
            document.querySelectorAll('#filterModeToggle .mode-btn').forEach(b=> b.classList.toggle('active', b === btn));
            document.getElementById('roleFilterBar')?.classList.toggle('hidden', local.filterMode !== 'role');
            document.getElementById('laneFilterBar')?.classList.toggle('hidden', local.filterMode !== 'lane');
            renderHeroGrid();
        });
    });

}

function wireKeyboard(){
    document.addEventListener('keydown', e=>{
        const tag = (e.target.tagName || '').toLowerCase();
        if(tag === 'input' || tag === 'select' || tag === 'textarea') return;

        if(e.key === ' ' && state.phase === 'drafting'){ e.preventDefault(); toggleTimer(); }
        if(e.ctrlKey && e.key.toLowerCase() === 'z'){ e.preventDefault(); undo(); }
        if(e.ctrlKey && e.key.toLowerCase() === 'y'){ e.preventDefault(); redo(); }
        if(e.key === '+'){ addTime(10); }
        if(e.key === 'Escape'){
            document.getElementById('matchHistoryPanel')?.classList.add('hidden');
        }
        if(e.key === 'ArrowLeft'){ browseMatchHistory(-1); }
        if(e.key === 'ArrowRight'){ browseMatchHistory(1); }
    });
}

function browseMatchHistory(direction){
    if(!state.games.length) return;
    const currentIdx = local.historyBrowseIndex ?? state.games.length;
    const next = Math.max(1, Math.min(state.games.length, currentIdx + direction));
    local.historyBrowseIndex = next;
    document.getElementById(`historyCard-${next}`)?.scrollIntoView({ behavior:'smooth', block:'center' });
    showToast(`VIEWING GAME ${next}`);
}


/* =========================================================================
   INIT — VIEWER
========================================================================= */

function initViewer(){
    loadState();

    viewerLocal.connection = 'DISCONNECTED';
    viewerLocal.lastMessageTs = 0;

    renderConnectionBadge();
    renderAll();

    const params = new URLSearchParams(location.search);
    if(params.get('transparent') === '1'){
        document.body.classList.add('obs-transparent');
    }

    document.getElementById('fullscreenBtn')?.addEventListener('click', ()=>{
        if(!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
    });
    document.getElementById('transparentBtn')?.addEventListener('click', ()=>{
        document.body.classList.toggle('obs-transparent');
    });

    // Timer visually keeps counting on the viewer between sync ticks so it
    // doesn't look frozen if a heartbeat is briefly delayed.
    setInterval(()=>{
        if(state.phase === 'drafting' && state.timer.running && state.timer.remaining > 0){
            renderTimer();
        }
    }, 1000);
}


/* =========================================================================
   BOOT
========================================================================= */

if(VIEW === 'operator') initOperator();
else if(VIEW === 'viewer') initViewer();
