// --- 1. STATE & LOCALSTORAGE ENGINE ---
let novels = JSON.parse(localStorage.getItem('nusa_novels')) || [];
let currentNovelId = null;

function saveToStorage() {
    localStorage.setItem('nusa_novels', JSON.stringify(novels));
}

// --- 2. LOGIKA INTIP & FORMALISASI PARAGRAF (OTOMATIS DI LATAR BELAKANG) ---
function cleanAndFormatParagraphs(text) {
    const lines = text.split(/\r?\n/);
    const cleanedLines = lines
        .map(line => line.trim())
        .filter(line => line.length > 0);
    return cleanedLines.map(line => `<p>${line}</p>`).join('');
}

// --- 3. DYNAMIC REAL-TIME BACKGROUND ENGINE ---
const canvas = document.getElementById('sky-canvas');
const ctx = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
}

function initStars() {
    stars = [];
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5,
            alpha: Math.random(),
            speed: Math.random() * 0.02
        });
    }
}

function updateSkyBackground() {
    const now = new Date();
    const hours = now.getHours();
    const timeString = now.toLocaleTimeString('id-ID');
    document.getElementById('clock-text').innerText = timeString;

    const isNight = hours >= 18 || hours < 6;
    const timeIcon = document.getElementById('time-icon');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isNight) {
        timeIcon.setAttribute('data-lucide', 'moon');
        document.body.style.backgroundColor = '#030712';

        ctx.fillStyle = '#ffffff';
        stars.forEach(star => {
            star.alpha += star.speed;
            if (star.alpha > 1 || star.alpha < 0) star.speed = -star.speed;
            ctx.globalAlpha = Math.abs(star.alpha);
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    } else {
        timeIcon.setAttribute('data-lucide', 'sun');
        document.body.style.backgroundColor = '#0f172a';

        const gradient = ctx.createRadialGradient(
            canvas.width - 100, 100, 10,
            canvas.width - 100, 100, 300
        );
        gradient.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    lucide.createIcons();
    requestAnimationFrame(updateSkyBackground);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
updateSkyBackground();

// --- 4. VIEWS & RENDER ENGINE ---
function showView(viewName) {
    document.getElementById('view-library').classList.add('hidden');
    document.getElementById('view-detail').classList.add('hidden');
    document.getElementById('view-reader').classList.add('hidden');

    if (viewName === 'library') {
        renderLibrary();
        document.getElementById('view-library').classList.remove('hidden');
    } else if (viewName === 'detail') {
        renderDetail();
        document.getElementById('view-detail').classList.remove('hidden');
    } else if (viewName === 'reader') {
        document.getElementById('view-reader').classList.remove('hidden');
    }
}

function renderLibrary() {
    const grid = document.getElementById('novel-grid');
    grid.innerHTML = '';

    if (novels.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-slate-400 space-y-3">
                <i data-lucide="book-x" class="w-12 h-12 mx-auto text-slate-500"></i>
                <p>Belum ada novel di koleksi. Klik "Tambah Novel" untuk memulai.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    novels.forEach(novel => {
        const card = document.createElement('div');
        card.className = 'group backdrop-blur-md bg-black/40 border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-amber-400/50 transition duration-300';
        card.onclick = () => openNovelDetail(novel.id);
        card.innerHTML = `
            <div class="aspect-[2/3] overflow-hidden relative">
                <img src="${novel.cover}" alt="${novel.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <span class="absolute bottom-2 left-2 text-[10px] bg-amber-500/90 text-slate-950 font-bold px-2 py-0.5 rounded">
                    ${novel.chapters.length} Bab
                </span>
            </div>
            <div class="p-3">
                <h3 class="font-bold text-white text-sm line-clamp-1 group-hover:text-amber-400 transition">${novel.title}</h3>
                <p class="text-xs text-amber-400/80 line-clamp-1">${novel.author}</p>
            </div>
        `;
        grid.appendChild(card);
    });
    lucide.createIcons();
}

function openNovelDetail(id) {
    currentNovelId = id;
    showView('detail');
}

function renderDetail() {
    const novel = novels.find(n => n.id === currentNovelId);
    if (!novel) return;

    document.getElementById('detail-cover').src = novel.cover;
    document.getElementById('detail-title').innerText = novel.title;
    document.getElementById('detail-author').innerText = `Penulis: ${novel.author}`;
    document.getElementById('detail-synopsis').innerText = novel.synopsis;

    const chapterList = document.getElementById('chapter-list');
    chapterList.innerHTML = '';

    if (novel.chapters.length === 0) {
        chapterList.innerHTML = `<p class="text-sm text-slate-400 py-4 text-center">Belum ada bab yang ditambahkan.</p>`;
        return;
    }

    novel.chapters.forEach((chap, idx) => {
        const item = document.createElement('div');
        item.className = 'py-3 flex justify-between items-center hover:bg-white/5 px-2 rounded-lg cursor-pointer transition';
        item.onclick = () => readChapter(idx);
        item.innerHTML = `
            <span class="text-sm font-medium text-slate-200">${chap.title}</span>
            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-500"></i>
        `;
        chapterList.appendChild(item);
    });
    lucide.createIcons();
}

function readChapter(index) {
    const novel = novels.find(n => n.id === currentNovelId);
    const chapter = novel.chapters[index];

    document.getElementById('reader-title').innerText = chapter.title;
    document.getElementById('reader-content').innerHTML = chapter.content;

    showView('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setReaderTheme(theme) {
    const box = document.getElementById('reader-box');
    const content = document.getElementById('reader-content');

    if (theme === 'sepia') {
        box.className = 'bg-[#f4ecd8] border border-amber-900/20 rounded-2xl p-8 space-y-6 shadow-2xl';
        content.className = 'novel-text text-slate-900';
    } else {
        box.className = 'backdrop-blur-md bg-black/60 border border-white/10 rounded-2xl p-8 space-y-6';
        content.className = 'novel-text text-slate-200';
    }
}

// --- 5. MODALS & HANDLERS ---
function openNovelModal() { document.getElementById('modal-novel').classList.remove('hidden'); }
function openChapterModal() { document.getElementById('modal-chapter').classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function saveNovel(e) {
    e.preventDefault();
    const newNovel = {
        id: Date.now(),
        title: document.getElementById('input-novel-title').value,
        author: document.getElementById('input-novel-author').value,
        cover: document.getElementById('input-novel-cover').value,
        synopsis: document.getElementById('input-novel-synopsis').value,
        chapters: []
    };

    novels.push(newNovel);
    saveToStorage();
    closeModal('modal-novel');
    e.target.reset();
    renderLibrary();
}

function saveChapter(e) {
    e.preventDefault();
    const novel = novels.find(n => n.id === currentNovelId);
    
    const rawContent = document.getElementById('input-chapter-content').value;
    const formattedContent = cleanAndFormatParagraphs(rawContent);

    const newChapter = {
        title: document.getElementById('input-chapter-title').value,
        content: formattedContent
    };

    novel.chapters.push(newChapter);
    saveToStorage();
    closeModal('modal-chapter');
    e.target.reset();
    renderDetail();
}

function deleteCurrentNovel() {
    if (confirm("Apakah Anda yakin ingin menghapus novel ini?")) {
        novels = novels.filter(n => n.id !== currentNovelId);
        saveToStorage();
        showView('library');
    }
}

showView('library');
          
