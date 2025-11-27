// Word Search Game Logic

// Configuration
const WORDS_AND_CLUES = [
    { word: "JAVASCRIPT", clue: "Lenguaje de programación web" },
    { word: "HTML", clue: "Lenguaje de marcado para la web" },
    { word: "CSS", clue: "Hojas de estilo en cascada" },
    { word: "TAILWIND", clue: "Framework de CSS utilitario" },
    { word: "VARIABLE", clue: "Contenedor para almacenar datos" },
    { word: "FUNCION", clue: "Bloque de código reutilizable" },
    { word: "ARRAY", clue: "Lista ordenada de elementos" },
    { word: "OBJETO", clue: "Colección de pares clave-valor" },
    { word: "BUCLE", clue: "Repetición de un bloque de código" },
    { word: "EVENTO", clue: "Acción que ocurre en el sistema" },
    { word: "DOM", clue: "Modelo de Objetos del Documento" },
    { word: "API", clue: "Interfaz de Programación de Aplicaciones" },
    { word: "DEBUG", clue: "Proceso de encontrar errores" },
    { word: "RESPONSIVE", clue: "Diseño adaptable a dispositivos" },
    { word: "BROWSER", clue: "Navegador web" }
];

// Game State
let gameState = {
    gridSize: 16,
    grid: [],
    words: [], // { word: "...", start: {r, c}, end: {r, c}, found: false }
    foundWordsCount: 0,
    score: 0,
    errors: 0,
    startTime: null,
    timerInterval: null,
    isSelecting: false,
    selectionStart: null, // {r, c}
    selectionEnd: null, // {r, c}
    selectedCells: [] // Array of {r, c}
};

// DOM Elements
const gridContainer = document.getElementById('grid-container');
const clueList = document.getElementById('clue-list');
const timerElement = document.getElementById('timer');
const scoreElement = document.getElementById('score');
const errorsElement = document.getElementById('errors');
const foundCountElement = document.getElementById('found-count');
const totalCountElement = document.getElementById('total-count');
const gridSizeSelect = document.getElementById('grid-size');
const resetBtn = document.getElementById('reset-btn');
const successModal = document.getElementById('success-modal');
const playAgainBtn = document.getElementById('play-again-btn');
const finalTimeElement = document.getElementById('final-time');
const finalScoreElement = document.getElementById('final-score');

// Initialization
function initGame() {
    // Reset state
    clearInterval(gameState.timerInterval);
    gameState.score = 0;
    gameState.errors = 0;
    gameState.foundWordsCount = 0;
    gameState.startTime = Date.now();
    gameState.words = [];
    gameState.selectedCells = [];
    gameState.isSelecting = false;

    // UI Reset
    scoreElement.textContent = "0";
    errorsElement.textContent = "0";
    timerElement.textContent = "00:00";
    successModal.classList.add('hidden');

    // Get settings
    gameState.gridSize = parseInt(gridSizeSelect.value);

    // Generate Grid
    generateGrid();

    // Start Timer
    gameState.timerInterval = setInterval(updateTimer, 1000);

    // Render
    renderGrid();
    renderClues();
    updateCounts();
}

// Logic: Generate Grid & Place Words
function generateGrid() {
    const size = gameState.gridSize;
    // Initialize empty grid
    gameState.grid = Array(size).fill(null).map(() => Array(size).fill(''));

    // Filter words that fit (just in case, though our words are short enough for 16x16)
    const availableWords = [...WORDS_AND_CLUES].sort(() => 0.5 - Math.random()); // Shuffle

    // Place words
    const placedWords = [];
    for (const item of availableWords) {
        if (placeWord(item.word)) {
            placedWords.push({ ...item, found: false });
        }
    }
    gameState.words = placedWords;

    // Fill empty spaces with random letters
    const alphabet = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (gameState.grid[r][c] === '') {
                gameState.grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }
    }
}

function placeWord(word) {
    const size = gameState.gridSize;
    const directions = [
        { r: 0, c: 1 },  // Horizontal
        { r: 1, c: 0 },  // Vertical
        { r: 1, c: 1 },  // Diagonal Down-Right
        { r: 1, c: -1 }  // Diagonal Down-Left
    ];

    // Try random positions and directions
    for (let attempt = 0; attempt < 100; attempt++) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const startR = Math.floor(Math.random() * size);
        const startC = Math.floor(Math.random() * size);

        if (canPlaceWord(word, startR, startC, dir)) {
            // Place it
            for (let i = 0; i < word.length; i++) {
                gameState.grid[startR + i * dir.r][startC + i * dir.c] = word[i];
            }
            // Store word metadata for validation
            // We don't strictly need to store exact coordinates for validation if we validate by string content,
            // but storing them helps with "reverse" selection or precise highlighting.
            // For this implementation, we'll validate by checking if the selected cells form a valid word.
            return true;
        }
    }
    return false;
}

function canPlaceWord(word, r, c, dir) {
    const size = gameState.gridSize;

    // Check bounds
    const endR = r + (word.length - 1) * dir.r;
    const endC = c + (word.length - 1) * dir.c;

    if (endR < 0 || endR >= size || endC < 0 || endC >= size) return false;

    // Check collisions
    for (let i = 0; i < word.length; i++) {
        const curR = r + i * dir.r;
        const curC = c + i * dir.c;
        const currentCell = gameState.grid[curR][curC];

        if (currentCell !== '' && currentCell !== word[i]) {
            return false;
        }
    }
    return true;
}

// Rendering
function renderGrid() {
    const size = gameState.gridSize;
    gridContainer.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
    gridContainer.innerHTML = '';

    // Adjust font size based on grid size
    const fontSize = size >= 28 ? 'text-xs' : (size >= 20 ? 'text-sm' : 'text-base md:text-lg');

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell', 'bg-white', 'text-gray-700', fontSize);
            cell.dataset.r = r;
            cell.dataset.c = c;
            cell.textContent = gameState.grid[r][c];

            // Events
            cell.addEventListener('mousedown', handleMouseDown);
            cell.addEventListener('mouseenter', handleMouseEnter);
            cell.addEventListener('mouseup', handleMouseUp);
            // Touch support
            cell.addEventListener('touchstart', handleTouchStart, { passive: false });
            cell.addEventListener('touchmove', handleTouchMove, { passive: false });
            cell.addEventListener('touchend', handleMouseUp);

            gridContainer.appendChild(cell);
        }
    }
}

function renderClues() {
    clueList.innerHTML = '';
    gameState.words.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = `p-3 bg-gray-50 rounded-lg border border-gray-100 transition-all duration-300 ${item.found ? 'opacity-50 bg-green-50' : 'hover:bg-gray-100'}`;
        li.id = `clue-${item.word}`;

        li.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white rounded-full text-xs font-bold text-gray-400 border border-gray-200 shadow-sm">
                    ${index + 1}
                </span>
                <div class="flex-grow">
                    <p class="font-semibold text-gray-800 ${item.found ? 'line-through text-green-600' : ''}">${item.clue}</p>
                    <p class="text-xs text-gray-400 mt-1 font-mono tracking-wider hidden md:block">
                        ${item.found ? item.word : '_ '.repeat(item.word.length)}
                    </p>
                </div>
                ${item.found ? '<span class="text-green-500">✓</span>' : ''}
            </div>
        `;
        clueList.appendChild(li);
    });
}

// Interaction
function handleMouseDown(e) {
    gameState.isSelecting = true;
    const r = parseInt(e.target.dataset.r);
    const c = parseInt(e.target.dataset.c);
    gameState.selectionStart = { r, c };
    updateSelection(r, c);
}

function handleMouseEnter(e) {
    if (!gameState.isSelecting) return;
    const r = parseInt(e.target.dataset.r);
    const c = parseInt(e.target.dataset.c);
    updateSelection(r, c);
}

function handleMouseUp() {
    if (!gameState.isSelecting) return;
    gameState.isSelecting = false;
    checkSelectedWord();
    clearSelection();
}

// Touch Handling
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('grid-cell')) {
        gameState.isSelecting = true;
        const r = parseInt(target.dataset.r);
        const c = parseInt(target.dataset.c);
        gameState.selectionStart = { r, c };
        updateSelection(r, c);
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!gameState.isSelecting) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('grid-cell')) {
        const r = parseInt(target.dataset.r);
        const c = parseInt(target.dataset.c);
        updateSelection(r, c);
    }
}

function updateSelection(currentR, currentC) {
    gameState.selectionEnd = { r: currentR, c: currentC };

    // Calculate line
    const start = gameState.selectionStart;
    const end = gameState.selectionEnd;

    // Determine direction and valid line
    const dr = end.r - start.r;
    const dc = end.c - start.c;

    // We only allow horizontal, vertical, or perfect diagonal
    if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
        // Valid line
        highlightCells(start, end);
    } else {
        // Invalid line - maybe just highlight start? Or do nothing?
        // For better UX, we could project to the nearest valid axis, but for now let's just ignore invalid moves visually or clear
        // Actually, let's just highlight the start cell if invalid
        clearVisualSelection();
        const cell = getCell(start.r, start.c);
        if (cell) cell.classList.add('selected');
    }
}

function highlightCells(start, end) {
    clearVisualSelection();

    const cells = getCellsInLine(start, end);
    gameState.selectedCells = cells;

    cells.forEach(pos => {
        const cell = getCell(pos.r, pos.c);
        if (cell) cell.classList.add('selected');
    });
}

function getCellsInLine(start, end) {
    const cells = [];
    const dr = Math.sign(end.r - start.r);
    const dc = Math.sign(end.c - start.c);

    let r = start.r;
    let c = start.c;

    const steps = Math.max(Math.abs(end.r - start.r), Math.abs(end.c - start.c));

    for (let i = 0; i <= steps; i++) {
        cells.push({ r, c });
        r += dr;
        c += dc;
    }
    return cells;
}

function clearVisualSelection() {
    const selected = document.querySelectorAll('.grid-cell.selected');
    selected.forEach(el => el.classList.remove('selected'));
}

function clearSelection() {
    clearVisualSelection();
    gameState.selectedCells = [];
    gameState.selectionStart = null;
    gameState.selectionEnd = null;
}

function getCell(r, c) {
    return document.querySelector(`.grid-cell[data-r="${r}"][data-c="${c}"]`);
}

function checkSelectedWord() {
    if (gameState.selectedCells.length === 0) return;

    // Construct word from selected cells
    const word = gameState.selectedCells.map(pos => gameState.grid[pos.r][pos.c]).join('');
    const reversedWord = word.split('').reverse().join('');

    // Check if it matches any target word
    const match = gameState.words.find(w => !w.found && (w.word === word || w.word === reversedWord));

    if (match) {
        // Found!
        match.found = true;
        gameState.foundWordsCount++;
        gameState.score += match.word.length * 10;

        // Mark cells as found permanently
        gameState.selectedCells.forEach(pos => {
            const cell = getCell(pos.r, pos.c);
            // Only add 'found' class if not already there (though adding it again is harmless)
            // We might want to handle intersections visually. 
            // Simple approach: just add class.
            cell.classList.add('found');
            // Remove event listeners to prevent re-selection? No, intersections are allowed.
        });

        // Update UI
        updateCounts();
        renderClues(); // Updates the list

        // Check Win
        if (gameState.foundWordsCount === gameState.words.length) {
            handleWin();
        }
    } else {
        // Not a match
        gameState.errors++;
        updateCounts();

        // Optional: Visual feedback for error (shake or red flash)
        // For now, just the counter update
    }
}

function updateCounts() {
    scoreElement.textContent = gameState.score;
    errorsElement.textContent = gameState.errors;
    foundCountElement.textContent = gameState.foundWordsCount;
    totalCountElement.textContent = gameState.words.length;
}

function updateTimer() {
    const now = Date.now();
    const diff = Math.floor((now - gameState.startTime) / 1000);
    const m = Math.floor(diff / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    timerElement.textContent = `${m}:${s}`;
}

function handleWin() {
    clearInterval(gameState.timerInterval);
    finalScoreElement.textContent = gameState.score;
    finalTimeElement.textContent = timerElement.textContent;
    successModal.classList.remove('hidden');
    triggerConfetti();
}

function triggerConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const random = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

// Event Listeners
gridSizeSelect.addEventListener('change', initGame);
resetBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', initGame);

// Start
initGame();
