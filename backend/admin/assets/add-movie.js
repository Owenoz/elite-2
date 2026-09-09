/* ─── Elite Movies Admin — Add Movie Page (Auto-coordination) ─────────────── */

let selectedMovie  = null;  // TMDB movie data
let selectedArchive = null; // Archive.org item data
let selectedFile   = null;  // Best archive file

// ── STEP 1: Search / Fetch from TMDB ─────────────────────────────────────────
async function searchTMDB() {
    const tmdbId = document.getElementById('tmdbId').value.trim();
    const query  = document.getElementById('tmdbSearch').value.trim();
    if (!tmdbId && !query) return alert('Enter a movie title or TMDB ID');

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
        if (tmdbId) {
            // Direct TMDB id → single movie
            const movie = await adminApi('tmdb_fetch', { tmdb_id: parseInt(tmdbId) });
            selectTMDBMovie(movie);
        } else {
            // Search results → show grid
            const results = await adminApi('tmdb_fetch', { query });
            renderTMDBResults(results);
        }
    } catch(e) {
        alert('TMDB error: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Search TMDB';
    }
}

function renderTMDBResults(movies) {
    const el = document.getElementById('tmdbResults');
    if (!movies.length) { el.style.display = 'block'; el.innerHTML = '<p class="muted">No results found on TMDB.</p>'; return; }
    el.style.display = 'grid';
    el.innerHTML = movies.slice(0, 12).map(m => `
        <div class="result-card" onclick="selectTMDBMovie(${JSON.stringify(m).replace(/"/g, '&quot;')})">
            <img src="${m.poster_path ? 'https://image.tmdb.org/t/p/w185'+m.poster_path : 'https://placehold.co/185x280/1C1B2E/D4AF37?text=?'}"
                 alt="${esc(m.title)}" loading="lazy">
            <div class="result-card-info">
                <div class="result-card-title">${esc(m.title)}</div>
                <div class="result-card-year">${(m.release_date||'').substring(0,4)}</div>
                <div class="result-card-rating">⭐ ${m.vote_average?.toFixed(1)||'—'}</div>
            </div>
        </div>
    `).join('');
}

function selectTMDBMovie(movie) {
    selectedMovie = movie;

    // Highlight selected card
    document.querySelectorAll('.result-card').forEach(c => c.classList.remove('active'));

    // Fill form fields
    document.getElementById('f_tmdb_id').value        = movie.id;
    document.getElementById('f_title').value           = movie.title || '';
    document.getElementById('f_overview').value        = movie.overview || '';
    document.getElementById('f_release_year').value    = (movie.release_date || '').substring(0,4);
    document.getElementById('f_vote_average').value    = movie.vote_average?.toFixed(1) || '';
    document.getElementById('f_runtime').value         = movie.runtime || '';
    document.getElementById('f_poster_path').value     = movie.poster_path || '';
    document.getElementById('f_backdrop_path').value   = movie.backdrop_path || '';

    // Show movie preview
    const posterUrl = movie.poster_path
        ? 'https://image.tmdb.org/t/p/w185' + movie.poster_path
        : 'https://placehold.co/70x105/1C1B2E/D4AF37?text=?';
    document.getElementById('moviePreview').innerHTML = `
        <img src="${posterUrl}" alt="${esc(movie.title)}" style="width:70px;border-radius:6px;flex-shrink:0">
        <div class="movie-preview-info">
            <h4>${esc(movie.title)}</h4>
            <p>${(movie.release_date||'').substring(0,4)} · ${movie.runtime||'?'}min</p>
            <div class="stars">⭐ ${movie.vote_average?.toFixed(1)||'—'}/10</div>
            <p style="margin-top:6px;font-size:11px;color:var(--muted)">TMDB ID: ${movie.id}</p>
        </div>
    `;

    // Show steps 2 & 3
    document.getElementById('step2').style.display = 'block';
    document.getElementById('step3').style.display = 'block';

    // ── AUTO-SEARCH Archive.org using movie title ─────────────────────────────
    document.getElementById('archiveSearch').value = movie.title + ' ' + (movie.release_date||'').substring(0,4);
    autoSearchArchive(movie.title, (movie.release_date||'').substring(0,4));

    document.getElementById('step2').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── STEP 3: Archive.org auto/manual search ────────────────────────────────────
async function autoSearchArchive(title, year) {
    try {
        const results = await adminApi('archive_search', { query: `${title} ${year}`.trim() });
        renderArchiveResults(results, true);
    } catch(e) {
        console.warn('Archive auto-search failed:', e.message);
    }
}

async function searchArchive() {
    const q = document.getElementById('archiveSearch').value.trim();
    if (!q) return;
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Searching…';
    try {
        const results = await adminApi('archive_search', { query: q });
        renderArchiveResults(results, false);
    } catch(e) {
        alert('Archive search error: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Search Archive.org';
    }
}

function renderArchiveResults(results, autoSelect) {
    const el = document.getElementById('archiveResults');
    if (!results.length) {
        el.style.display = 'block';
        el.innerHTML = '<p class="muted small">No results on archive.org. Try a different title or enter the identifier manually below.</p>';
        return;
    }
    el.style.display = 'grid';
    el.innerHTML = results.map((r, i) => `
        <div class="archive-card ${i === 0 && autoSelect ? 'active' : ''}"
             onclick="selectArchiveItem('${esc(r.identifier)}', this)">
            <h4>${esc(r.title || r.identifier)}</h4>
            <div class="archive-id">📼 ${esc(r.identifier)}</div>
            <div class="archive-year">${r.year || ''}</div>
        </div>
    `).join('');

    // Auto-select first result when triggered by TMDB selection
    if (autoSelect && results.length) {
        selectArchiveItem(results[0].identifier, el.querySelector('.archive-card'));
    }
}

async function selectArchiveItem(identifier, cardEl) {
    // Highlight card
    document.querySelectorAll('.archive-card').forEach(c => c.classList.remove('active'));
    if (cardEl) cardEl.classList.add('active');

    // Load metadata
    try {
        const meta = await adminApi('archive_metadata', { identifier });
        selectedArchive = meta;
        selectedFile    = meta.best_file;

        document.getElementById('f_archive_identifier').value = identifier;
        document.getElementById('f_archive_url').value = meta.best_file?.url || '';

        const infoEl = document.getElementById('archiveSelectedInfo');
        infoEl.innerHTML = `
            <div style="display:flex;gap:12px;align-items:flex-start;margin-top:8px">
                <div>
                    <strong>${esc(meta.meta.title || identifier)}</strong>
                    <div class="archive-id mt-2">📼 ${esc(identifier)}</div>
                    <div class="muted small mt-2">${meta.files.length} video file${meta.files.length !== 1 ? 's' : ''} found</div>
                    <a href="${esc(meta.details_url)}" target="_blank" class="link small mt-2" style="display:inline-block">
                        View on archive.org ↗
                    </a>
                </div>
            </div>
        `;
        document.getElementById('archiveSelected').style.display = 'block';

        // Show file selector if multiple files
        if (meta.files.length > 1) {
            renderFileList(meta.files, meta.best_file);
        }

        // Show save step
        updateFinalPreview();
        document.getElementById('step4').style.display = 'block';
        document.getElementById('step4').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch(e) {
        alert('Could not load archive metadata: ' + e.message);
    }
}

async function loadArchiveById() {
    const id = document.getElementById('manualIdentifier').value.trim();
    if (!id) return alert('Enter an archive.org identifier');
    await selectArchiveItem(id, null);
}

function renderFileList(files, best) {
    const container = document.getElementById('archiveFiles');
    const items     = document.getElementById('fileListItems');
    container.style.display = 'block';
    items.innerHTML = files.map(f => `
        <div class="file-item ${f.url === best?.url ? 'active' : ''}"
             onclick="selectFile(${JSON.stringify(f).replace(/"/g, '&quot;')}, this)">
            <span class="file-name">${esc(f.name)}</span>
            <span class="file-size">${f.size}</span>
        </div>
    `).join('');
}

function selectFile(file, el) {
    document.querySelectorAll('.file-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    selectedFile = file;
    document.getElementById('f_archive_url').value = file.url;
    updateFinalPreview();
}

// ── Final preview update ──────────────────────────────────────────────────────
function updateFinalPreview() {
    if (!selectedMovie) return;
    const archiveId  = document.getElementById('f_archive_identifier').value;
    const archiveUrl = document.getElementById('f_archive_url').value;
    const posterUrl  = selectedMovie.poster_path
        ? 'https://image.tmdb.org/t/p/w185' + selectedMovie.poster_path
        : 'https://placehold.co/80x120/1C1B2E/D4AF37?text=?';

    document.getElementById('finalPreview').innerHTML = `
        <img src="${posterUrl}" alt="${esc(selectedMovie.title)}">
        <div class="final-info">
            <h3>${esc(selectedMovie.title)}</h3>
            <p>${document.getElementById('f_release_year').value} · ⭐ ${selectedMovie.vote_average?.toFixed(1)||'—'}</p>
            ${archiveId
                ? `<div class="archive-badge">📼 ${esc(archiveId)}</div>`
                : '<div class="archive-badge" style="background:rgba(220,38,38,0.1);color:#f87171;border-color:rgba(220,38,38,0.3)">⚠ No archive linked</div>'}
            ${archiveUrl ? `<div class="muted small" style="margin-top:6px;word-break:break-all">${esc(archiveUrl.substring(0,60))}…</div>` : ''}
        </div>
    `;
}

// Keep final preview in sync as user edits fields
['f_archive_identifier','f_archive_url','f_title','f_release_year'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateFinalPreview);
});

// ── STEP 4: Save movie ────────────────────────────────────────────────────────
async function saveMovie() {
    if (!selectedMovie) return alert('Please select a movie from TMDB first.');

    const btn = document.getElementById('saveBtn');
    const msg = document.getElementById('saveMsg');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Saving…';
    msg.style.display = 'none';

    try {
        const payload = {
            tmdb_id:            parseInt(document.getElementById('f_tmdb_id').value),
            title:              document.getElementById('f_title').value,
            overview:           document.getElementById('f_overview').value,
            poster_path:        document.getElementById('f_poster_path').value,
            backdrop_path:      document.getElementById('f_backdrop_path').value,
            release_year:       parseInt(document.getElementById('f_release_year').value) || 0,
            vote_average:       parseFloat(document.getElementById('f_vote_average').value) || 0,
            runtime:            parseInt(document.getElementById('f_runtime').value) || 0,
            archive_identifier: document.getElementById('f_archive_identifier').value,
            archive_url:        document.getElementById('f_archive_url').value,
            is_available:       document.getElementById('f_is_available').checked ? 1 : 0,
        };

        const movie = await adminApi('add_movie', payload);

        msg.className = 'alert alert-success mt-3';
        msg.style.display = 'block';
        msg.innerHTML = `
            ✅ <strong>${esc(movie.title)}</strong> saved successfully!
            ${movie.is_available ? ' It is now <strong>live in the app</strong>.' : ' It is hidden — toggle it live from the Movies page.'}
            <br><a href="movies.php" class="link" style="margin-top:6px;display:inline-block">View in Movies →</a>
        `;

        btn.innerHTML = '✅ Saved!';
        btn.style.background = '#16a34a';

        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = '💾 Save Another Movie';
            btn.style.background = '';
        }, 3000);

    } catch(e) {
        msg.className = 'alert alert-error mt-3';
        msg.style.display = 'block';
        msg.textContent = '❌ Error: ' + e.message;
        btn.disabled = false;
        btn.innerHTML = '💾 Save Movie to Elite Movies';
    }
}

// ── Pre-fill from URL if editing ──────────────────────────────────────────────
const editId = new URLSearchParams(location.search).get('edit');
if (editId) {
    document.getElementById('tmdbId').value = editId;
    searchTMDB();
}
