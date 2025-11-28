(function () {
    'use strict';

    function initSopaLetras(container) {
        // Prevent double initialization
        if (container.dataset.initialized) return;
        container.dataset.initialized = 'true';

        // Configuration
        const config = JSON.parse(container.dataset.gameConfig);
        const WORDS_AND_CLUES = config.words;
        let GRID_SIZE = config.gridSize; // Make it mutable for dynamic changes

        console.log('Sopa de Letras - Config:', config);
        console.log('Grid Size:', GRID_SIZE);
        console.log('Words:', WORDS_AND_CLUES);

        // Color palette for found words (light pastel colors)
        // Color palette for found words (single light green color as requested)
        const WORD_COLORS = [
            'acfb-bg-green-200'
        ];

        // Game State
        let gameState = {
            grid: [],
            words: [], // { word: "...", start: {r, c}, end: {r, c}, found: false, color: "..." }
            foundWordsCount: 0,
            score: 0,
            errors: 0,
            startTime: null,
            timerInterval: null,
            isSelecting: false,
            selectionStart: null, // {r, c}
            selectionEnd: null, // {r, c}
            selectedCells: [], // Array of {r, c}
            wordColorMap: new Map() // Maps cell positions to colors for found words
        };

        // DOM Elements within this container
        const gridContainer = container.querySelector('.grid-container');
        const clueList = container.querySelector('.clue-list');
        const timerElement = container.querySelector('.timer-display');
        const scoreElement = container.querySelector('.score-display');
        const errorsElement = container.querySelector('.errors-display');
        const foundCountElement = container.querySelector('.found-count');
        const totalCountElement = container.querySelector('.total-count');
        const resetBtn = container.querySelector('.reset-btn');
        const gridSizeBtns = container.querySelectorAll('.grid-size-btn');
        const successModal = container.querySelector('.success-modal');
        const playAgainBtn = container.querySelector('.play-again-btn');
        const finalTimeElement = container.querySelector('.final-time');
        const finalScoreElement = container.querySelector('.final-score');

        // Update grid size buttons visual state
        function updateGridSizeButtons() {
            gridSizeBtns.forEach(btn => {
                const btnSize = parseInt(btn.dataset.gridSize);
                if (btnSize === GRID_SIZE) {
                    btn.classList.remove('acfb-border-2', 'acfb-shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]', 'acfb-bg-purple-300', 'hover:acfb-bg-purple-400');
                    btn.classList.add('acfb-border-4', 'acfb-shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]', 'acfb-bg-lime-300');
                } else {
                    btn.classList.remove('acfb-border-4', 'acfb-shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]', 'acfb-bg-lime-300');
                    btn.classList.add('acfb-border-2', 'acfb-shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]', 'acfb-bg-purple-300', 'hover:acfb-bg-purple-400');
                }
            });
        }

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
            successModal.classList.add('acfb-hidden');
            clearVisualSelection();

            // Generate Grid
            generateGrid();

            // Start Timer
            gameState.timerInterval = setInterval(updateTimer, 1000);

            // Render
            renderGrid();
            renderClues();
            updateCounts();
            updateGridSizeButtons();
        }

        // Logic: Generate Grid & Place Words
        function generateGrid() {
            const size = GRID_SIZE;
            // Initialize empty grid
            gameState.grid = Array(size).fill(null).map(() => Array(size).fill(''));

            // Filter words that fit
            const availableWords = [...WORDS_AND_CLUES].sort(() => 0.5 - Math.random()); // Shuffle

            // Place words
            const placedWords = [];
            for (const item of availableWords) {
                const coords = placeWord(item.word);
                if (coords) {
                    placedWords.push({ ...item, found: false, cells: coords });
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
            const size = GRID_SIZE;
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
                    const wordCells = [];
                    for (let i = 0; i < word.length; i++) {
                        const r = startR + i * dir.r;
                        const c = startC + i * dir.c;
                        gameState.grid[r][c] = word[i];
                        wordCells.push({ r, c });
                    }
                    // Return coordinates to be stored
                    return wordCells;
                }
            }
            return null;
        }

        function canPlaceWord(word, r, c, dir) {
            const size = GRID_SIZE;

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
            const size = GRID_SIZE;
            gridContainer.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
            gridContainer.innerHTML = '';

            console.log('Rendering grid with size:', size);

            // Adjust font size based on grid size - larger for better readability
            let fontSizeClass = 'acfb-text-2xl md:acfb-text-3xl';
            if (size >= 28) fontSizeClass = 'acfb-text-lg';
            else if (size >= 20) fontSizeClass = 'acfb-text-xl';

            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const cell = document.createElement('div');
                    // Neobrutalist styling
                    cell.className = `grid-cell acfb-bg-white acfb-text-black acfb-border-[0.5px] acfb-border-black ${fontSizeClass} acfb-flex acfb-items-center acfb-justify-center acfb-aspect-square acfb-font-black acfb-cursor-pointer hover:acfb-bg-yellow-100 acfb-select-none acfb-transition-all`;
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
            console.log('Grid rendered with', size * size, 'cells');
        }

        function renderClues() {
            clueList.innerHTML = '';
            gameState.words.forEach((item, index) => {
                const li = document.createElement('li');
                const baseClasses = 'acfb-p-3 acfb-border-4 acfb-border-black acfb-transition-all acfb-duration-200';
                const stateClasses = item.found ? 'acfb-bg-green-200 acfb-shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'acfb-bg-white hover:acfb-bg-yellow-100 acfb-shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:acfb-shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]';
                li.className = `${baseClasses} ${stateClasses}`;

                li.innerHTML = `
                    <div class="acfb-flex acfb-items-start acfb-gap-3">
                        <span class="acfb-flex-shrink-0 acfb-w-7 acfb-h-7 acfb-flex acfb-items-center acfb-justify-center acfb-bg-yellow-300 acfb-text-xs acfb-font-black acfb-text-black acfb-border-2 acfb-border-black">
                            ${index + 1}
                        </span>
                        <div class="acfb-flex-grow">
                            <p class="acfb-font-black acfb-text-black acfb-uppercase ${item.found ? 'acfb-line-through' : ''}">${item.clue}</p>
                            <p class="acfb-text-xs acfb-text-black acfb-mt-1 acfb-font-mono acfb-tracking-wider acfb-hidden md:acfb-block acfb-font-bold">
                                ${item.found ? item.word : '_ '.repeat(item.word.length)}
                            </p>
                        </div>
                        ${item.found ? '<span class="acfb-text-black acfb-text-xl acfb-font-black">✓</span>' : ''}
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
            if (target && target.classList.contains('grid-cell') && gridContainer.contains(target)) {
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
            if (target && target.classList.contains('grid-cell') && gridContainer.contains(target)) {
                const r = parseInt(target.dataset.r);
                const c = parseInt(target.dataset.c);
                updateSelection(r, c);
            }
        }

        function updateSelection(currentR, currentC) {
            gameState.selectionEnd = { r: currentR, c: currentC };
            const start = gameState.selectionStart;
            const end = gameState.selectionEnd;
            const dr = end.r - start.r;
            const dc = end.c - start.c;

            if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
                highlightCells(start, end);
            } else {
                clearVisualSelection();
                const cell = getCell(start.r, start.c);
                if (cell) {
                    cell.classList.add('selecting');
                    cell.style.outline = '3px solid #06B6D4';
                    cell.style.outlineOffset = '-3px';
                }
            }
        }

        function highlightCells(start, end) {
            clearVisualSelection();
            const cells = getCellsInLine(start, end);
            gameState.selectedCells = cells;

            cells.forEach(pos => {
                const cell = getCell(pos.r, pos.c);
                if (cell) {
                    cell.classList.add('selecting');
                    cell.style.outline = '3px solid #06B6D4';
                    cell.style.outlineOffset = '-3px';
                }
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
            const selected = gridContainer.querySelectorAll('.selecting');
            selected.forEach(el => {
                el.classList.remove('selecting');
                el.style.outline = '';
                el.style.outlineOffset = '';
            });
        }

        function clearSelection() {
            clearVisualSelection();
            gameState.selectedCells = [];
            gameState.selectionStart = null;
            gameState.selectionEnd = null;
        }

        function getCell(r, c) {
            return gridContainer.querySelector(`.grid-cell[data-r="${r}"][data-c="${c}"]`);
        }

        function checkSelectedWord() {
            if (gameState.selectedCells.length === 0) return;

            const word = gameState.selectedCells.map(pos => gameState.grid[pos.r][pos.c]).join('');
            const reversedWord = word.split('').reverse().join('');
            const match = gameState.words.find(w => !w.found && (w.word === word || w.word === reversedWord));

            if (match) {
                match.found = true;
                gameState.foundWordsCount++;
                gameState.score += match.word.length * 10;

                // Assign a unique color to this word
                const wordColor = WORD_COLORS[gameState.foundWordsCount % WORD_COLORS.length];
                match.color = wordColor;

                gameState.selectedCells.forEach(pos => {
                    const cell = getCell(pos.r, pos.c);
                    const cellKey = `${pos.r}-${pos.c}`;

                    // Remove any previous color and default styles
                    WORD_COLORS.forEach(color => cell.classList.remove(color));
                    cell.classList.remove('acfb-bg-white', 'hover:acfb-bg-yellow-100');

                    // Add unique color for this word
                    cell.classList.add(wordColor, 'acfb-border-4');
                    gameState.wordColorMap.set(cellKey, wordColor);

                    // Temporarily add pulse animation for visual feedback
                    cell.classList.add('acfb-animate-pulse');
                    setTimeout(() => {
                        cell.classList.remove('acfb-animate-pulse');
                    }, 500);
                });

                // Show celebration with dancing cat
                showCelebration(match.word);

                updateCounts();
                renderClues();

                if (gameState.foundWordsCount === gameState.words.length) {
                    handleWin();
                }
            } else {
                gameState.errors++;
                updateCounts();
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

        function showCelebration(word) {
            console.log('=== SHOWING CELEBRATION FOR WORD:', word, '===');

            // Create celebration element
            const celebration = document.createElement('div');
            celebration.className = 'word-celebration acfb-fixed acfb-bottom-8 acfb-right-8 acfb-z-50 acfb-flex acfb-flex-col acfb-items-center acfb-gap-2';
            celebration.style.animation = 'acfb-bounce 0.5s ease-in-out';
            celebration.style.zIndex = '9999'; // Ensure it's on top

            // Create image container with dancing cat
            const catContainer = document.createElement('div');
            catContainer.className = 'acfb-relative acfb-w-32 acfb-h-32';

            const catImg = document.createElement('img');
            const pluginUrl = window.wp_plugin_gutenberg_blocks?.plugin_url || '/wp-content/plugins/wp-plugin-gutenberg-blocks';
            const imagePath = `${pluginUrl}/blocks/sopa-letras/dancing-cat.png`;

            console.log('Plugin URL:', pluginUrl);
            console.log('Full Image Path:', imagePath);

            catImg.src = imagePath;
            catImg.alt = 'Celebrating cat';
            catImg.className = 'acfb-w-full acfb-h-full acfb-object-contain';
            catImg.style.animation = 'acfb-dance 0.5s ease-in-out infinite';

            // Add image load handlers for debugging
            catImg.addEventListener('load', function () {
                console.log('✓ Cat image loaded successfully!');
            });

            catImg.addEventListener('error', function (e) {
                console.error('✗ Failed to load cat image:', imagePath);
                console.error('Error details:', e);
                // Show a fallback emoji if image fails to load
                catContainer.innerHTML = '🎉';
                catContainer.style.fontSize = '96px';
                catContainer.style.textAlign = 'center';
            });

            catContainer.appendChild(catImg);

            // Create word banner
            const banner = document.createElement('div');
            banner.className = 'acfb-bg-white acfb-border-4 acfb-border-black acfb-px-4 acfb-py-2 acfb-shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] acfb-transform acfb-rotate-[-5deg]';
            banner.innerHTML = `
                <div class="acfb-text-center">
                    <p class="acfb-text-sm acfb-font-bold acfb-text-black acfb-m-0">Felicitaciones encontraste la palabra:</p>
                    <p class="acfb-text-xl acfb-font-black acfb-text-black acfb-uppercase acfb-m-0">${word}</p>
                </div>
            `;

            celebration.appendChild(catContainer);
            celebration.appendChild(banner);
            container.appendChild(celebration);

            console.log('✓ Celebration element added to container');
            console.log('Celebration element:', celebration);

            // Add sparkles effect
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const sparkle = document.createElement('div');
                    sparkle.className = 'acfb-absolute acfb-text-2xl';
                    sparkle.textContent = '✨';
                    sparkle.style.left = Math.random() * 100 + 'px';
                    sparkle.style.top = Math.random() * 100 + 'px';
                    sparkle.style.animation = 'acfb-sparkle 1s ease-out';
                    catContainer.appendChild(sparkle);

                    setTimeout(() => sparkle.remove(), 1000);
                }, i * 100);
            }

            // Remove celebration after animation
            setTimeout(() => {
                celebration.style.animation = 'acfb-fade-out 0.5s ease-out';
                setTimeout(() => {
                    celebration.remove();
                    console.log('✓ Celebration removed');
                }, 500);
            }, 2000);

            console.log('=== END CELEBRATION SETUP ===');
        }

        function handleWin() {
            clearInterval(gameState.timerInterval);

            // Reset modal content to show victory message
            const modalTitle = successModal.querySelector('h2');
            const modalText = successModal.querySelector('p');
            const modalIcon = successModal.querySelector('svg');

            // Update modal content for win
            modalTitle.textContent = "¡Felicitaciones!";
            modalText.textContent = "Has encontrado todas las palabras.";

            // Restore check icon
            if (modalIcon) {
                modalIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path>';
            }

            finalScoreElement.textContent = gameState.score;
            finalTimeElement.textContent = timerElement.textContent;
            successModal.classList.remove('acfb-hidden');
        }

        function handleGiveUp() {
            clearInterval(gameState.timerInterval);

            // Highlight unfound words
            gameState.words.forEach(wordObj => {
                if (!wordObj.found) {
                    wordObj.cells.forEach(pos => {
                        const cell = getCell(pos.r, pos.c);
                        if (cell) {
                            // Remove default white background and add light red
                            cell.classList.remove('acfb-bg-white', 'hover:acfb-bg-yellow-100');
                            cell.classList.add('acfb-bg-red-200', 'acfb-border-4');
                        }
                    });
                }
            });

            // Show loss modal with word list
            const modalTitle = successModal.querySelector('h2');
            const modalText = successModal.querySelector('p');
            const modalIcon = successModal.querySelector('svg');

            // Update modal content for loss
            modalTitle.textContent = "Perdiste :(";

            // Create a list of all words with their definitions
            let wordListHTML = '<div class="acfb-text-left acfb-max-h-[50vh] acfb-overflow-y-auto acfb-mb-4">';
            wordListHTML += '<p class="acfb-font-bold acfb-mb-3 acfb-text-center">Lista completa de palabras (20):</p>';
            wordListHTML += '<ul class="acfb-space-y-2">';

            gameState.words.forEach((wordObj, index) => {
                const foundClass = wordObj.found ? 'acfb-text-green-700 acfb-line-through' : 'acfb-text-red-700';
                const foundIcon = wordObj.found ? '✓' : '✗';
                wordListHTML += `
                    <li class="acfb-border-2 acfb-border-black acfb-p-2 acfb-bg-white">
                        <div class="acfb-flex acfb-items-start acfb-gap-2">
                            <span class="acfb-font-black acfb-text-sm ${foundClass}">${foundIcon}</span>
                            <div class="acfb-flex-grow">
                                <p class="acfb-font-black acfb-text-sm ${foundClass}">${index + 1}. ${wordObj.word}</p>
                                <p class="acfb-text-xs acfb-text-gray-700">${wordObj.clue}</p>
                            </div>
                        </div>
                    </li>
                `;
            });

            wordListHTML += '</ul></div>';
            modalText.innerHTML = wordListHTML;

            // Change icon to sad face or X (optional, keeping simple for now or using X path)
            // Using a simple X path for loss
            if (modalIcon) {
                modalIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M6 18L18 6M6 6l12 12"></path>';
            }

            finalScoreElement.textContent = gameState.score;
            finalTimeElement.textContent = timerElement.textContent;
            successModal.classList.remove('acfb-hidden');
        }

        // Event Listeners
        const giveUpBtn = container.querySelector('.give-up-btn');
        if (giveUpBtn) {
            giveUpBtn.addEventListener('click', handleGiveUp);
        }

        resetBtn.addEventListener('click', initGame);
        playAgainBtn.addEventListener('click', initGame);

        // Close modal button
        const closeModalBtn = container.querySelector('.close-modal-btn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                successModal.classList.add('acfb-hidden');
            });
        }

        // Grid size change listeners
        gridSizeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const newSize = parseInt(btn.dataset.gridSize);
                if (newSize !== GRID_SIZE) {
                    GRID_SIZE = newSize;
                    console.log('Grid size changed to:', GRID_SIZE);
                    initGame();
                }
            });
        });

        // Start
        console.log('Initializing game for container:', container);
        initGame();
        console.log('Game initialized successfully');
    }

    // Initialize on DOMContentLoaded and when block is rendered in editor
    if (window.acf) {
        window.acf.addAction('render_block_preview/type=acf/sopa-letras', function (block) {
            console.log('ACF block render triggered', block);
            initSopaLetras(block);
        });
    }

    // Initialize on frontend
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded - Looking for word search blocks');
        const blocks = document.querySelectorAll('.acfb-sopa-letras-block');
        console.log('Found blocks:', blocks.length);
        blocks.forEach(initSopaLetras);
    });

})();
