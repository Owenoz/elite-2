<?php require_once __DIR__ . '/auth.php'; requireAdminAuth(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Add Movie — Elite Movies Admin</title>
<link rel="stylesheet" href="assets/admin.css">
<style>
.tab-bar { display:flex; gap:0; border-bottom:1px solid var(--border); margin-bottom:0; }
.tab-btn {
    padding:10px 22px; font-size:13px; font-weight:700; cursor:pointer;
    background:transparent; border:none; color:var(--muted);
    border-bottom:2px solid transparent; transition:color .15s,border-color .15s;
}
.tab-btn.active { color:var(--gold); border-bottom-color:var(--gold); }
.tab-pane { display:none; padding:20px; }
.tab-pane.active { display:block; }

/* Upload drag-drop zone */
.drop-zone {
    border:2px dashed var(--border); border-radius:14px;
    padding:48px 24px; text-align:center; cursor:pointer;
    transition:border-color .2s, background .2s;
    background: var(--bg2);
}
.drop-zone:hover, .drop-zone.dragover { border-color:var(--gold); background:var(--gold-dim); }
.drop-zone .drop-icon { font-size:40px; margin-bottom:12px; }
.drop-zone h4 { font-size:16px; font-weight:700; margin-bottom:6px; }
.drop-zone p  { font-size:12px; color:var(--muted); }
.drop-zone input[type=file] { display:none; }

/* Upload progress */
.progress-wrap { display:none; margin-top:16px; }
.progress-bar-bg {
    background:var(--bg2); border-radius:20px; height:10px;
    overflow:hidden; border:1px solid var(--border);
}
.progress-bar-fill {
    height:100%; background:var(--gold); border-radius:20px;
    transition:width .3s; width:0%;
}
.progress-label { font-size:12px; color:var(--muted2); margin-top:6px; display:flex; justify-content:space-between; }

/* Selected file preview */
.file-preview {
    display:none; background:var(--bg2); border:1px solid var(--border);
    border-radius:10px; padding:14px 16px; margin-top:12px;
    flex-direction:row; align-items:center; gap:14px;
}
.file-preview-icon { font-size:32px; }
.file-preview-info h4 { font-size:14px; font-weight:700; }
.file-preview-info p  { font-size:11px; color:var(--muted); margin-top:2px; }
.file-preview-remove { margin-left:auto; cursor:pointer; color:var(--muted); font-size:18px; }
.file-preview-remove:hover { color:var(--red); }
</style>
</head>
<body>
<?php include __DIR__ . '/partials/nav.php'; ?>

<div class="main">
    <div class="page-header">
        <div>
            <h2>Add / Edit Movie</h2>
            <p class="sub">Upload video → auto-sends to archive.org CDN · Auto-fetches TMDB metadata</p>
        </div>
        <a href="movies.php" class="btn btn-outline">← Back to Movies</a>
    </div>

    <!-- ══ STEP 1: TMDB ══════════════════════════════════════════════════════ -->
    <div class="card" id="step1">
        <div class="card-header">
            <h3><span class="step-num">1</span> Find Movie on TMDB</h3>
        </div>
        <div class="card-body">
            <div class="row-inline">
                <input type="text" id="tmdbSearch" placeholder="Search by title e.g. The Avengers" class="input flex-1">
                <span class="or-sep">or</span>
                <input type="number" id="tmdbId" placeholder="TMDB ID" class="input w-200">
                <button onclick="searchTMDB()" class="btn btn-gold">Search TMDB</button>
            </div>
            <div id="tmdbResults" class="results-grid mt-4" style="display:none"></div>
        </div>
    </div>

    <!-- ══ STEP 2: Movie Details ══════════════════════════════════════════════ -->
    <div class="card mt-4" id="step2" style="display:none">
        <div class="card-header">
            <h3><span class="step-num">2</span> Movie Details <span class="badge badge-auto">Auto-filled from TMDB</span></h3>
        </div>
        <div class="card-body">
            <div class="movie-preview" id="moviePreview"></div>
            <div class="form-grid">
                <input type="hidden" id="f_tmdb_id">
                <div class="field">
                    <label>Title *</label>
                    <input type="text" id="f_title" class="input">
                </div>
                <div class="field">
                    <label>Release Year</label>
                    <input type="number" id="f_release_year" class="input">
                </div>
                <div class="field">
                    <label>Rating</label>
                    <input type="number" step="0.1" id="f_vote_average" class="input">
                </div>
                <div class="field">
                    <label>Runtime (mins)</label>
                    <input type="number" id="f_runtime" class="input">
                </div>
                <div class="field full">
                    <label>Overview</label>
                    <textarea id="f_overview" class="input" rows="3"></textarea>
                </div>
                <div class="field">
                    <label>Poster Path</label>
                    <input type="text" id="f_poster_path" class="input">
                </div>
                <div class="field">
                    <label>Backdrop Path</label>
                    <input type="text" id="f_backdrop_path" class="input">
                </div>
            </div>
        </div>
    </div>

    <!-- ══ STEP 3: Video Source ═══════════════════════════════════════════════ -->
    <div class="card mt-4" id="step3" style="display:none">
        <div class="card-header">
            <h3><span class="step-num">3</span> Video Source</h3>
        </div>

        <!-- Tab bar -->
        <div class="tab-bar">
            <button class="tab-btn active" onclick="switchTab('upload', this)">📤 Upload Video File</button>
            <button class="tab-btn"        onclick="switchTab('search', this)">🔍 Search Archive.org</button>
            <button class="tab-btn"        onclick="switchTab('manual', this)">✏️ Manual Identifier</button>
        </div>

        <!-- ── TAB: Upload ─────────────────────────────────────────────────── -->
        <div class="tab-pane active" id="tab-upload">
            <div class="drop-zone" id="dropZone" onclick="document.getElementById('videoFileInput').click()">
                <div class="drop-icon">🎬</div>
                <h4>Drop your video file here</h4>
                <p>or click to browse · MP4, MKV, AVI, MOV · Max 4 GB</p>
                <input type="file" id="videoFileInput" accept="video/*" onchange="handleFileSelect(this.files[0])">
            </div>

            <!-- Selected file preview -->
            <div class="file-preview" id="filePreview">
                <span class="file-preview-icon">🎞️</span>
                <div class="file-preview-info">
                    <h4 id="previewFileName">—</h4>
                    <p id="previewFileSize">—</p>
                </div>
                <span class="file-preview-remove" onclick="clearFile()" title="Remove">✕</span>
            </div>

            <!-- Progress bar (shown during upload) -->
            <div class="progress-wrap" id="progressWrap">
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" id="progressFill"></div>
                </div>
                <div class="progress-label">
                    <span id="progressText">Uploading to archive.org CDN…</span>
                    <span id="progressPct">0%</span>
                </div>
            </div>

            <div id="uploadMsg" class="alert mt-3" style="display:none"></div>

            <button onclick="startUpload()" class="btn btn-gold btn-lg mt-4" id="uploadBtn" style="display:none">
                📤 Upload to archive.org CDN
            </button>

            <div class="mt-3" style="background:var(--bg2);border-radius:10px;padding:14px;border:1px solid var(--border)">
                <p style="font-size:12px;color:var(--muted);line-height:1.8">
                    <strong style="color:var(--muted2)">How it works:</strong><br>
                    Your video is uploaded directly to <strong style="color:var(--gold)">archive.org CDN</strong> — a free, permanent storage network.<br>
                    After upload, the stream URL is auto-filled below and saved to your database.<br>
                    Users stream the movie from archive.org inside the app after paying 5,000 UGX.<br><br>
                    <strong style="color:var(--gold)">⚠ Requires:</strong> archive.org S3 keys in config.php.
                    Get them free at <a href="https://archive.org/account/s3.php" target="_blank">archive.org/account/s3.php</a>
                </p>
            </div>
        </div>

        <!-- ── TAB: Search archive.org ─────────────────────────────────────── -->
        <div class="tab-pane" id="tab-search">
            <div class="row-inline mb-4">
                <input type="text" id="archiveSearch" placeholder="Search archive.org…" class="input flex-1">
                <button onclick="searchArchive()" class="btn btn-outline">Search Archive.org</button>
            </div>
            <div id="archiveResults" class="archive-grid" style="display:none"></div>

            <div id="archiveSelected" class="selected-archive mt-4" style="display:none">
                <h4>Selected Archive Item</h4>
                <div id="archiveSelectedInfo"></div>
                <div class="form-grid mt-3">
                    <div class="field">
                        <label>Archive Identifier <span class="badge badge-auto">Auto-filled</span></label>
                        <input type="text" id="f_archive_identifier" class="input" placeholder="e.g. TheGeneralBuster1926">
                    </div>
                    <div class="field">
                        <label>Stream URL <span class="badge badge-auto">Auto-selected</span></label>
                        <input type="text" id="f_archive_url" class="input">
                    </div>
                </div>
                <div id="archiveFiles" class="file-list mt-3" style="display:none">
                    <p class="file-list-title">Available video files (click to select):</p>
                    <div id="fileListItems"></div>
                </div>
            </div>
        </div>

        <!-- ── TAB: Manual ────────────────────────────────────────────────── -->
        <div class="tab-pane" id="tab-manual">
            <p class="muted small mb-4">Enter an existing archive.org item identifier to load its metadata automatically.</p>
            <div class="form-grid">
                <div class="field">
                    <label>Archive.org Identifier</label>
                    <input type="text" id="manualIdentifier" class="input" placeholder="e.g. TheGeneralBuster1926">
                </div>
                <div style="display:flex;align-items:flex-end">
                    <button onclick="loadArchiveById()" class="btn btn-outline">Load Metadata →</button>
                </div>
                <div class="field">
                    <label>Stream URL <span class="badge badge-auto">Auto-filled after load</span></label>
                    <input type="text" id="f_archive_identifier" class="input" placeholder="auto-filled">
                </div>
                <div class="field">
                    <label>Direct MP4 URL</label>
                    <input type="text" id="f_archive_url" class="input" placeholder="https://archive.org/download/...">
                </div>
            </div>
        </div>
    </div>

    <!-- ══ STEP 4: Save ═══════════════════════════════════════════════════════ -->
    <div class="card mt-4" id="step4" style="display:none">
        <div class="card-header">
            <h3><span class="step-num">4</span> Save to Catalogue</h3>
        </div>
        <div class="card-body">
            <div class="final-preview" id="finalPreview"></div>
            <div class="field mt-4">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                    <input type="checkbox" id="f_is_available" checked>
                    <span>Make available immediately in the app</span>
                </label>
            </div>
            <div id="saveMsg" class="alert mt-3" style="display:none"></div>
            <button onclick="saveMovie()" class="btn btn-gold btn-lg mt-3" id="saveBtn">
                💾 Save Movie to Elite Movies
            </button>
        </div>
    </div>
</div>

<script src="assets/admin.js"></script>
<script src="assets/add-movie.js"></script>
<script>
// ── Tab switching ─────────────────────────────────────────────────────────────
function switchTab(name, el) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('tab-' + name).classList.add('active');
}

// ── Drag & drop ───────────────────────────────────────────────────────────────
const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('video/')) handleFileSelect(f);
    else alert('Please drop a video file (MP4, MKV, AVI, etc.)');
});

let selectedVideoFile = null;

function handleFileSelect(file) {
    if (!file) return;
    selectedVideoFile = file;
    document.getElementById('previewFileName').textContent = file.name;
    document.getElementById('previewFileSize').textContent = (file.size / 1024 / 1024).toFixed(1) + ' MB · ' + file.type;
    document.getElementById('filePreview').style.display = 'flex';
    document.getElementById('uploadBtn').style.display = 'inline-flex';
    document.getElementById('uploadMsg').style.display = 'none';
}

function clearFile() {
    selectedVideoFile = null;
    document.getElementById('videoFileInput').value = '';
    document.getElementById('filePreview').style.display = 'none';
    document.getElementById('uploadBtn').style.display = 'none';
    document.getElementById('progressWrap').style.display = 'none';
}

// ── Upload to archive.org via upload.php ──────────────────────────────────────
function startUpload() {
    if (!selectedVideoFile) return alert('Select a video file first');
    if (!document.getElementById('f_tmdb_id').value) return alert('Find the movie on TMDB first (Step 1)');

    const btn     = document.getElementById('uploadBtn');
    const msg     = document.getElementById('uploadMsg');
    const progWrap= document.getElementById('progressWrap');
    const fill    = document.getElementById('progressFill');
    const pct     = document.getElementById('progressPct');
    const txt     = document.getElementById('progressText');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Uploading…';
    msg.style.display = 'none';
    progWrap.style.display = 'block';
    fill.style.width = '0%';

    const formData = new FormData();
    formData.append('video',    selectedVideoFile);
    formData.append('title',    document.getElementById('f_title').value || selectedVideoFile.name);
    formData.append('year',     document.getElementById('f_release_year').value || new Date().getFullYear());
    formData.append('tmdb_id',  document.getElementById('f_tmdb_id').value);

    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', e => {
        if (!e.lengthComputable) return;
        const p = Math.round((e.loaded / e.total) * 100);
        fill.style.width = p + '%';
        pct.textContent  = p + '%';
        txt.textContent  = p < 100
            ? `Uploading to archive.org CDN… ${(e.loaded/1024/1024).toFixed(1)} / ${(e.total/1024/1024).toFixed(1)} MB`
            : 'Processing on archive.org…';
    });

    xhr.addEventListener('load', () => {
        btn.disabled = false;
        btn.innerHTML = '📤 Upload to archive.org CDN';

        try {
            const res = JSON.parse(xhr.responseText);
            if (res.success) {
                const d = res.data;
                // Auto-fill archive fields
                document.getElementById('f_archive_identifier').value = d.identifier;
                document.getElementById('f_archive_url').value        = d.stream_url;

                fill.style.width = '100%';
                pct.textContent  = '100%';
                txt.textContent  = '✅ Upload complete!';

                msg.className = 'alert alert-success mt-3';
                msg.style.display = 'block';
                msg.innerHTML = `
                    ✅ <strong>Uploaded to archive.org!</strong> ${d.size_mb} MB in ${d.duration_s}s<br>
                    ${d.movie_saved
                        ? '<strong style="color:#4ade80">🎬 Movie auto-saved to database — now LIVE in the app!</strong><br>'
                        : ''
                    }
                    <span class="muted small">Archive ID: <code>${d.identifier}</code></span>
                    &nbsp;<a href="https://archive.org/details/${d.identifier}" target="_blank" class="link small">View on archive.org ↗</a>
                    <br><span class="muted small">archive.org takes ~5 min to process. Movie streams once processing is done.</span>
                `;

                // Show save step
                updateFinalPreview();
                document.getElementById('step4').style.display = 'block';

                if (d.movie_saved) {
                    const saveBtn = document.getElementById('saveBtn');
                    saveBtn.innerHTML = '🎬 Movie is Live! View in Catalogue';
                    saveBtn.style.background = '#16a34a';
                    saveBtn.onclick = () => window.location.href = 'movies.php';
                }

                document.getElementById('step4').scrollIntoView({ behavior:'smooth', block:'start' });

            } else {
                throw new Error(res.error || 'Upload failed');
            }
        } catch(e) {
            msg.className = 'alert alert-error mt-3';
            msg.style.display = 'block';
            msg.textContent = '❌ ' + e.message;
        }
    });

    xhr.addEventListener('error', () => {
        btn.disabled = false;
        btn.innerHTML = '📤 Upload to archive.org CDN';
        msg.className = 'alert alert-error mt-3';
        msg.style.display = 'block';
        msg.textContent = '❌ Network error during upload. Check your connection.';
    });

    xhr.open('POST', 'upload.php');
    xhr.send(formData);
}
</script>
</body>
</html>
