let allSpells = [];
let currentFilteredSpells = [];

// Elements
const spellGrid = document.getElementById('spellGrid');
const spellList = document.getElementById('spellList');
const searchInput = document.getElementById('searchInput');
const classFilter = document.getElementById('classFilter');
const levelFilter = document.getElementById('levelFilter');
const spellModal = document.getElementById('spellModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close-modal');
const printPreviewBtn = document.getElementById('printPreviewBtn');
const printPreviewModal = document.getElementById('printPreviewModal');
const printPreviewContent = document.getElementById('printPreviewContent');
const closePreviewBtn = document.getElementById('closePreviewBtn');
const confirmPrintBtn = document.getElementById('confirmPrintBtn');

// Cards Elements
const cardsPreviewBtn = document.getElementById('cardsPreviewBtn');
const cardsPreviewModal = document.getElementById('cardsPreviewModal');
const cardsPreviewContent = document.getElementById('cardsPreviewContent');
const closeCardsPreviewBtn = document.getElementById('closeCardsPreviewBtn');
const confirmCardsPrintBtn = document.getElementById('confirmCardsPrintBtn');

// Tab logic
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.tab;

        // Update buttons
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update content
        tabContents.forEach(content => content.classList.remove('active'));
        if (target === 'grid') {
            document.getElementById('gridTab').classList.add('active');
        } else if (target === 'list') {
            document.getElementById('listTab').classList.add('active');
        } else {
            document.getElementById('cardsTab').classList.add('active');
        }

        renderSpells(currentFilteredSpells);
    });
});

// Load Data
async function loadSpells() {
    try {
        // Agora usamos os dados embarcados no spellsData.js
        if (typeof SPELLS_DATA !== 'undefined') {
            allSpells = SPELLS_DATA;
            currentFilteredSpells = allSpells;
            renderSpells(allSpells);
        } else {
            throw new Error('SPELLS_DATA não encontrado');
        }
    } catch (error) {
        console.error('Erro ao carregar magias:', error);
        spellGrid.innerHTML = `<div class="error">Erro ao carregar magias. Verifique o console.</div>`;
    }
}

function renderSpells(spells) {
    // Determine active tab
    const isGridActive = document.getElementById('gridTab').classList.contains('active');

    if (isGridActive) {
        // Render Grid View
        if (spells.length === 0) {
            spellGrid.innerHTML = `<div class="no-results">Nenhuma magia encontrada com esses filtros.</div>`;
        } else {
            spellGrid.innerHTML = spells.map((spell, index) => `
                <div class="spell-card" onclick="openModal(${allSpells.indexOf(spell)})">
                    <div class="level-tag">${spell.level === 0 ? 'Truque' : 'Nível ' + spell.level}</div>
                    <h3>${spell.name}</h3>
                    <div class="school">${spell.school}</div>
                    <p class="description-snippet">${spell.description}</p>
                    <div class="card-footer">
                        <div class="class-badges">
                            ${spell.classes.slice(0, 3).map(c => `<span class="badge">${c}</span>`).join('')}
                            ${spell.classes.length > 3 ? `<span class="badge">+${spell.classes.length - 3}</span>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } else {
        // Render List View (Simple list for screen)
        if (spells.length === 0) {
            spellList.innerHTML = `<div class="no-results">Nenhuma magia encontrada para listagem.</div>`;
        } else {
            spellList.innerHTML = spells.map((spell, idx) => `
                <div class="spell-full-card">
                    <div class="card-header-print">
                        <h2>${spell.name}</h2>
                        <span class="level-info">${spell.level === 0 ? 'Truque' : 'Nível ' + spell.level} | ${spell.school}</span>
                    </div>
                    <div class="full-description">${spell.description}</div>
                </div>
            `).join('');
        }
    }
}

function filterSpells() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedClass = classFilter.value;
    const selectedLevel = levelFilter.value;

    currentFilteredSpells = allSpells.filter(spell => {
        const matchesSearch = spell.name.toLowerCase().includes(searchTerm);
        const matchesClass = selectedClass === "" || spell.classes.includes(selectedClass);
        const matchesLevel = selectedLevel === "" || spell.level.toString() === selectedLevel;

        return matchesSearch && matchesClass && matchesLevel;
    });

    renderSpells(currentFilteredSpells);
}

// ==========================================
// PAGINATION & PREVIEW LOGIC
// ==========================================

async function generatePrintPreview() {
    // Re-apply filters to guarantee currentFilteredSpells is up to date
    filterSpells();

    // Show Loading
    printPreviewContent.innerHTML = '<div class="loader">Gerando páginas...</div>';
    printPreviewModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Wait a bit for UI update
    await new Promise(r => setTimeout(r, 100));

    const spells = currentFilteredSpells;

    // Create a hidden container to measure cards
    // Uses measure-print-styles class (same fonts as print-page, but NO transform!)
    const measureContainer = document.createElement('div');
    measureContainer.className = 'measure-print-styles';
    measureContainer.style.width = '90mm'; // Column width (approx half A4 minus gap)
    measureContainer.style.visibility = 'hidden';
    measureContainer.style.position = 'absolute';
    measureContainer.style.top = '-9999px';
    measureContainer.style.left = '-9999px';
    measureContainer.style.background = 'white';
    document.body.appendChild(measureContainer);

    // Helper to create card HTML
    const getCardHtml = (spell) => `
        <article class="spell-full-card">
            <div class="card-header-print">
                <h2>${spell.name}</h2>
                <span class="level-info">${spell.level === 0 ? 'Truque' : 'Nível ' + spell.level} | ${spell.school}</span>
            </div>
            <div class="meta-grid-print">
                <div><strong>Tempo:</strong> ${spell.meta.castTime}</div>
                <div><strong>Alcance:</strong> ${spell.meta.range}</div>
                <div><strong>Comp:</strong> ${spell.meta.components}</div>
                <div><strong>Duração:</strong> ${spell.meta.duration}</div>
            </div>
            ${spell.materials ? `<div class="materials-print"><strong>Materiais:</strong> ${spell.materials}</div>` : ''}
            <div class="full-description">
                ${spell.description}
            </div>
        </article>
    `;

    // Measure the MAX column height in px.
    // A4 = 297mm, @page margin = 10mm top + 10mm bottom = 20mm
    // Screen padding = 1cm top + 1cm bottom = 20mm
    // Usable content = 297mm - 20mm(@page) - 20mm(page number space) = 257mm
    const heightMeasure = document.createElement('div');
    heightMeasure.className = 'measure-print-styles';
    heightMeasure.style.width = '90mm';
    heightMeasure.style.height = '257mm'; // Conservative usable A4 height
    heightMeasure.style.visibility = 'hidden';
    heightMeasure.style.position = 'absolute';
    document.body.appendChild(heightMeasure);
    const MAX_COL_HEIGHT_PX = heightMeasure.offsetHeight;
    document.body.removeChild(heightMeasure);

    console.log(`Max column height: ${MAX_COL_HEIGHT_PX}px`);

    // 1. Measure each card's height
    const cardHeights = [];
    for (let i = 0; i < spells.length; i++) {
        measureContainer.innerHTML = getCardHtml(spells[i]);
        // Get the height of the card element itself
        const cardEl = measureContainer.firstElementChild;
        cardHeights.push(cardEl.offsetHeight);
    }
    measureContainer.innerHTML = '';

    console.log(`Sample card heights: ${cardHeights.slice(0, 5).join(', ')}px`);

    // 2. Generate Cover HTML
    const selectedClass = classFilter.value || 'Compêndio Completo';
    const selectedLevel = levelFilter.value ? (levelFilter.value === '0' ? 'Truques' : `Nível ${levelFilter.value}`) : 'Todos os Níveis';

    const coverHtml = `
        <div class="print-page print-cover-page" style="padding: 0; overflow: hidden;">
            <!-- Decorative border frame -->
            <div style="
                position: absolute; top: 1.5cm; left: 1.5cm; right: 1.5cm; bottom: 1.5cm;
                border: 3px double #333;
                pointer-events: none;
            "></div>
            <div style="
                position: absolute; top: 1.8cm; left: 1.8cm; right: 1.8cm; bottom: 1.8cm;
                border: 1px solid #666;
                pointer-events: none;
            "></div>

            <!-- Content -->
            <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 3cm;">
                
                <!-- Ornamental top -->
                <div style="font-size: 28pt; color: #444; margin-bottom: 0.8cm; letter-spacing: 8px;">✦ ✦ ✦</div>

                <h1 style="
                    font-family: 'Cinzel', serif;
                    font-size: 36pt;
                    color: #1a1a1a;
                    letter-spacing: 4px;
                    text-transform: uppercase;
                    margin-bottom: 0.3cm;
                    line-height: 1.1;
                ">Grimório</h1>
                <h1 style="
                    font-family: 'Cinzel', serif;
                    font-size: 28pt;
                    color: #1a1a1a;
                    letter-spacing: 6px;
                    text-transform: uppercase;
                    margin-bottom: 0.8cm;
                ">de Magias</h1>

                <!-- Decorative line -->
                <div style="width: 60%; height: 2px; background: linear-gradient(to right, transparent, #333, transparent); margin-bottom: 0.8cm;"></div>

                <h2 style="
                    font-family: 'Cinzel', serif;
                    font-weight: 400;
                    font-size: 18pt;
                    color: #333;
                    letter-spacing: 3px;
                    margin-bottom: 2cm;
                ">Dungeons & Dragons — 5ª Edição</h2>

                <!-- Info block -->
                <div style="
                    font-family: 'Inter', sans-serif;
                    font-size: 13pt;
                    color: #222;
                    line-height: 2.2;
                    border-top: 1px solid #999;
                    border-bottom: 1px solid #999;
                    padding: 0.6cm 1.5cm;
                ">
                    <div><strong style="text-transform: uppercase; letter-spacing: 2px; font-size: 10pt; color: #555;">Classe</strong><br>${selectedClass}</div>
                    <div style="margin-top: 0.4cm;"><strong style="text-transform: uppercase; letter-spacing: 2px; font-size: 10pt; color: #555;">Nível</strong><br>${selectedLevel}</div>
                    <div style="margin-top: 0.4cm;"><strong style="text-transform: uppercase; letter-spacing: 2px; font-size: 10pt; color: #555;">Total de Magias</strong><br>${spells.length}</div>
                </div>

                <!-- Ornamental bottom -->
                <div style="font-size: 28pt; color: #444; margin-top: 1cm; letter-spacing: 8px;">✦ ✦ ✦</div>
            </div>
        </div>
    `;

    // 3. Distribute Spells into Pages (Two-Column Layout)
    let pages = [];
    let currentPage = { leftCol: [], rightCol: [], leftHeight: 0, rightHeight: 0 };
    const CARD_GAP = 5; // gap between cards in px (matches 5pt margin-bottom approx)

    for (let i = 0; i < spells.length; i++) {
        const h = cardHeights[i] + CARD_GAP;

        // Try LEFT column first
        if (currentPage.leftHeight + h <= MAX_COL_HEIGHT_PX) {
            currentPage.leftCol.push(spells[i]);
            currentPage.leftHeight += h;
        }
        // Then try RIGHT column
        else if (currentPage.rightHeight + h <= MAX_COL_HEIGHT_PX) {
            currentPage.rightCol.push(spells[i]);
            currentPage.rightHeight += h;
        }
        // Neither fits => start a new page
        else {
            pages.push(currentPage);
            currentPage = { leftCol: [spells[i]], rightCol: [], leftHeight: h, rightHeight: 0 };
        }
    }
    // Push last page
    if (currentPage.leftCol.length > 0 || currentPage.rightCol.length > 0) {
        pages.push(currentPage);
    }

    document.body.removeChild(measureContainer);

    console.log(`Total pages: ${pages.length}`);
    pages.forEach((p, i) => console.log(`  Page ${i + 1}: left=${p.leftCol.length} right=${p.rightCol.length}`));

    // 4. Calculate index pages count by measuring index items
    // We need to know how many pages the index takes BEFORE assigning page numbers
    const indexMeasure = document.createElement('div');
    indexMeasure.className = 'measure-print-styles';
    indexMeasure.style.width = '210mm';      // Full A4 width for index
    indexMeasure.style.padding = '1cm';
    indexMeasure.style.visibility = 'hidden';
    indexMeasure.style.position = 'absolute';
    indexMeasure.style.top = '-9999px';
    document.body.appendChild(indexMeasure);

    // Measure header height
    indexMeasure.innerHTML = '<h2 style="text-align: center; border-bottom: 2px solid black; margin-bottom: 1rem;">Índice</h2>';
    const indexHeaderHeight = indexMeasure.offsetHeight;

    // Measure a single index item height
    indexMeasure.innerHTML = `
        <ul class="index-list" style="column-count:3; column-gap:0.5cm; font-size:8pt; list-style:none; padding:0;">
            <li style="border-bottom:1px dotted #999; display:flex; justify-content:space-between; margin-bottom:2pt;">
                <span>Test Spell</span><span>99</span>
            </li>
        </ul>`;
    const singleItemHeight = indexMeasure.querySelector('li').offsetHeight + 3; // +3 for margin

    document.body.removeChild(indexMeasure);

    // Calculate how many items fit per index page (3 columns)
    const indexUsableHeight = MAX_COL_HEIGHT_PX - indexHeaderHeight;
    const itemsPerColumn = Math.floor(indexUsableHeight / singleItemHeight);
    const itemsPerPage = itemsPerColumn * 3; // 3 columns
    const indexPagesCount = Math.max(1, Math.ceil(spells.length / itemsPerPage));

    console.log(`Index: ${singleItemHeight}px/item, ${itemsPerColumn}/col, ${itemsPerPage}/page => ${indexPagesCount} index pages`);

    // 5. Map spells to their final page numbers
    let spellPageMap = {};
    const pageOffset = 1 + indexPagesCount + 1; // Cover(1) + Index(N) + first spell page

    pages.forEach((p, pIdx) => {
        const pageNum = pageOffset + pIdx;
        [...p.leftCol, ...p.rightCol].forEach(spell => {
            spellPageMap[spell.name] = pageNum;
        });
    });

    // 6. Generate Paginated Index HTML
    const sortedSpells = [...spells].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    let indexHtml = '';
    for (let ip = 0; ip < indexPagesCount; ip++) {
        const startIdx = ip * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, sortedSpells.length);
        const pageSpells = sortedSpells.slice(startIdx, endIdx);
        const indexPageNum = 2 + ip; // Cover is page 1
        const showTitle = ip === 0; // Only show title on first index page

        indexHtml += `
            <div class="print-page print-index-page">
                ${showTitle ? '<h2 style="text-align: center; border-bottom: 2px solid black; margin-bottom: 1rem;">Índice</h2>' : ''}
                <ul class="index-list">
                    ${pageSpells.map(spell => `
                        <li>
                            <span>${spell.name}</span>
                            <span class="index-page-num">${spellPageMap[spell.name] || 'N/A'}</span>
                        </li>
                    `).join('')}
                </ul>
                <div class="print-page-number">${indexPageNum}</div>
            </div>
        `;
    }

    // 7. Render EVERYTHING to Preview
    let finalHtml = coverHtml + indexHtml;

    pages.forEach((p, idx) => {
        const pageNum = pageOffset + idx;
        const leftContent = p.leftCol.map(getCardHtml).join('');
        const rightContent = p.rightCol.map(getCardHtml).join('');

        finalHtml += `
            <div class="print-page">
                <div style="display: flex; gap: 0.5cm; height: calc(100% - 1cm); align-items: flex-start;">
                    <div style="flex: 1;">${leftContent}</div>
                    <div style="flex: 1;">${rightContent}</div>
                </div>
                <div class="print-page-number">${pageNum}</div>
            </div>
        `;
    });

    printPreviewContent.innerHTML = finalHtml;
}

// Event Listeners for Preview
if (printPreviewBtn) {
    printPreviewBtn.addEventListener('click', generatePrintPreview);
}

closePreviewBtn.addEventListener('click', () => {
    printPreviewModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
});

confirmPrintBtn.addEventListener('click', () => {
    window.print();
});

// Modal Logic
function openModal(index) {
    const spell = allSpells[index];
    modalBody.innerHTML = `
        <h2 class="modal-spell-title">${spell.name}</h2>
        <div class="modal-school-info">${spell.school} | ${spell.level === 0 ? 'Truque' : 'Nível ' + spell.level}</div>
        
        <div class="modal-meta-grid">
            <div class="meta-box">
                <h4>Tempo de Conjuração</h4>
                <p>${spell.meta.castTime || 'N/A'}</p>
            </div>
            <div class="meta-box">
                <h4>Alcance</h4>
                <p>${spell.meta.range || 'N/A'}</p>
            </div>
            <div class="meta-box">
                <h4>Componentes</h4>
                <p>${spell.meta.components || 'N/A'}</p>
            </div>
            <div class="meta-box">
                <h4>Duração</h4>
                <p>${spell.meta.duration || 'N/A'}</p>
            </div>
        </div>

        ${spell.materials ? `
        <div class="materials-box" style="margin-bottom: 1.5rem; font-style: italic; color: #aaa;">
            <strong>Materiais:</strong> ${spell.materials}
        </div>` : ''}

        <div class="modal-description">
            ${spell.description}
        </div>

        <div class="modal-classes" style="margin-top: 2rem; border-top: 1px solid #333; padding-top: 1rem;">
            <h4 style="color: #66fcf1; font-size: 0.8rem; text-transform: uppercase;">Classes</h4>
            <div class="class-badges" style="margin-top: 0.5rem">
                ${spell.classes.map(c => `<span class="badge">${c}</span>`).join('')}
            </div>
        </div>
    `;
    spellModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scroll
}


searchInput.addEventListener('input', filterSpells);
classFilter.addEventListener('change', filterSpells);
levelFilter.addEventListener('change', filterSpells);

closeModal.onclick = () => {
    spellModal.style.display = 'none';
    document.body.style.overflow = 'auto';
};

window.onclick = (event) => {
    if (event.target == spellModal) {
        spellModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

// ==========================================
// CARD GENERATION (A7)
// ==========================================

const THEME_CONFIG = {
    schools: {
        'Abjuração': { color: '#3498db', emoji: '🛡️' },
        'Adivinhação': { color: '#9b59b6', emoji: '🔮' },
        'Conjuração': { color: '#f1c40f', emoji: '🌀' },
        'Encantamento': { color: '#e91e63', emoji: '😍' },
        'Evocação': { color: '#e74c3c', emoji: '💥' },
        'Ilusão': { color: '#1abc9c', emoji: '🎭' },
        'Necromancia': { color: '#2c3e50', emoji: '💀' },
        'Transmutação': { color: '#e67e22', emoji: '🧪' }
    },
    classes: {
        'Bardo': '#ab47bc',
        'Bruxo': '#7b1fa2',
        'Clérigo': '#95a5a6',
        'Druida': '#2ecc71',
        'Feiticeiro': '#c0392b',
        'Guerreiro': '#7f8c8d',
        'Ladino': '#34495e',
        'Mago': '#2980b9',
        'Monge': '#3498db',
        'Paladino': '#f39c12',
        'Patrulheiro': '#27ae60'
    },
    default: { color: '#333', emoji: '✨' }
};

function getCardTheme(spell, activeClassFilter) {
    const schoolKey = Object.keys(THEME_CONFIG.schools).find(s => spell.school.includes(s));
    const schoolTheme = THEME_CONFIG.schools[schoolKey] || THEME_CONFIG.default;
    let color = schoolTheme.color;

    if (activeClassFilter && THEME_CONFIG.classes[activeClassFilter]) {
        color = THEME_CONFIG.classes[activeClassFilter];
    }
    return { color, emoji: schoolTheme.emoji };
}

async function generateCardsPreview() {
    // Re-apply filters
    filterSpells();

    // Get active class context for theming
    const activeClass = classFilter.value;

    // Show Loading
    cardsPreviewContent.innerHTML = '<div class="loader">Gerando cartas...</div>';
    cardsPreviewModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Wait for UI to update (100ms)
    await new Promise(r => setTimeout(r, 100));

    const spells = currentFilteredSpells;

    // Create a hidden container for measuring text fit
    const measureBox = document.createElement('div');
    measureBox.className = 'spell-a7-card'; // Use card class for dimensions
    measureBox.style.position = 'absolute';
    measureBox.style.visibility = 'hidden';
    measureBox.style.top = '-9999px';
    // Must be in DOM to have dimensions
    document.body.appendChild(measureBox);

    // Generate Card HTML for each spell
    const cardsHtml = spells.map(spell => {
        // Calculate Theme
        const theme = getCardTheme(spell, activeClass);
        const cardStyle = `--card-theme-color: ${theme.color};`;

        // Base Font Size Logic
        let fontSize = 7; // Start at 7pt
        const minFontSize = 4.5; // Don't go below 4.5pt
        let contentHtml = '';

        // Loop to find best fit
        // Note: We use a loop that tries progressively smaller fonts
        // We render the FULL inner content first to check height
        for (let size = fontSize; size >= minFontSize; size -= 0.5) {
            contentHtml = `
                <div class="a7-inner-border">
                    <div class="a7-card-header">
                        <div class="a7-card-title">
                            ${spell.name}
                        </div>
                        <div class="a7-card-level">${spell.level === 0 ? 'Truque' : 'Nível ' + spell.level} | <span class="school-emoji">${theme.emoji}</span> ${spell.school}</div>
                    </div>
                    
                    <div class="a7-card-meta">
                        <div><strong>Tempo:</strong> ${spell.meta.castTime}</div>
                        <div><strong>Alcance:</strong> ${spell.meta.range}</div>
                        <div><strong>Comp:</strong> ${spell.meta.components}</div>
                        <div><strong>Duração:</strong> ${spell.meta.duration}</div>
                    </div>

                    <div class="a7-card-content" style="font-size: ${size}pt">
                        ${spell.description}
                        ${spell.materials ? `<div class="a7-card-materials">Mat: ${spell.materials}</div>` : ''}
                    </div>
                </div>
            `;

            measureBox.innerHTML = contentHtml;
            const contentDiv = measureBox.querySelector('.a7-card-content');

            // Check overflow: scrollHeight > clientHeight?
            // We enable overflow hidden in CSS, so scrollHeight will be > clientHeight if it overflows
            if (contentDiv.scrollHeight <= contentDiv.clientHeight) {
                fontSize = size;
                break; // It fits!
            }

            // If even at min size it doesn't fit, we stick with min size
            if (size <= minFontSize) {
                fontSize = minFontSize;
            }
        }

        // Return final HTML for this card
        return `<div class="spell-a7-card" style="${cardStyle}">${contentHtml}</div>`;
    });

    document.body.removeChild(measureBox);

    // For direct A7 printing, we don't group into A4 pages.
    // Each card is its own "page".
    const finalHtml = cardsHtml.join('');

    cardsPreviewContent.innerHTML = finalHtml || '<div class="no-results">Nenhuma carta gerada.</div>';

    // Add specific class for A7 printing styling
}

// Event Listeners for Cards Preview
if (cardsPreviewBtn) {
    cardsPreviewBtn.addEventListener('click', generateCardsPreview);
}

const printA7Btn = document.getElementById('printA7Btn');
const printA4Btn = document.getElementById('printA4Btn');

if (closeCardsPreviewBtn) {
    closeCardsPreviewBtn.addEventListener('click', () => {
        cardsPreviewModal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore scroll
        document.body.classList.remove('printing-cards-a7');
        document.body.classList.remove('printing-cards-a4');
    });
}

if (printA7Btn) {
    printA7Btn.addEventListener('click', () => {
        document.body.classList.remove('printing-cards-a4');
        document.body.classList.add('printing-cards-a7');
        window.print();
    });
}

if (printA4Btn) {
    printA4Btn.addEventListener('click', () => {
        document.body.classList.remove('printing-cards-a7');
        document.body.classList.add('printing-cards-a4');
        window.print();
    });
}

// Start
loadSpells();
