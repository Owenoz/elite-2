<?php require_once __DIR__ . '/auth.php'; requireAdminAuth(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Add Movie — Elite Movies Admin</title>
<link rel="stylesheet" href="assets/admin.css">
</head>
<body>
<?php include __DIR__ . '/partials/nav.php'; ?>

<div class="main">
    <div class="page-header">
        <div>
            <h2>Add / Edit Movie</h2>
            <p class="sub">Auto-fetches metadata from TMDB · Auto-searches archive.org</p>
        </div>
        <a href="movies.php" class="btn btn-outline">← Back to Movies</a>
    </div>

    <!-- Step 1: Find Movie on TMDB -->
    <div class="card" id="step1">
        <div class="card-header">
            <h3><span class="step-num">1</span> Find Movie on TMDB</h3>
        </div>
        <div class="card-body">
            <div class="row-inline">
                <input type="text" id="tmdbSearch" placeholder="Search by title e.g. The General" class="input flex-1">
                <span class="or-sep">or</span>
                <input type="number" id="tmdbId" placeholder="TMDB ID e.g. 1578" class="input w-200">
                <button onclick="searchTMDB()" class="btn btn-gold">Search TMDB</button>
            </div>
            <div id="tmdbResults" class="results-grid mt-4" style="display:none"></div>
        </div>
    </div>

    <!-- Step 2: Movie Details (auto-filled from TMDB) -->
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
                    <input type="text" id="f_poster_path" class="input" placeholder="/abc123.jpg">
                </div>
                <div class="field">
                    <label>Backdrop Path</label>
                    <input type="text" id="f_backdrop_path" class="input" placeholder="/xyz789.jpg">
                </div>
            </div>
        </div>
    </div>

    <!-- Step 3: Archive.org -->
    <div class="card mt-4" id="step3" style="display:none">
        <div class="card-header">
            <h3><span class="step-num">3</span> Find on Archive.org <span class="badge badge-auto">Auto-searched</span></h3>
        </div>
        <div class="card-body">
            <div class="row-inline mb-4">
                <input type="text" id="archiveSearch" placeholder="Search archive.org..." class="input flex-1">
                <button onclick="searchArchive()" class="btn btn-outline">Search Archive.org</button>
            </div>

            <div id="archiveResults" class="archive-grid mt-4" style="display:none"></div>

            <div id="archiveSelected" class="selected-archive mt-4" style="display:none">
                <h4>Selected Archive Item</h4>
                <div id="archiveSelectedInfo"></div>
                <div class="form-grid mt-3">
                    <div class="field">
                        <label>Archive Identifier <span class="badge badge-auto">Auto-filled</span></label>
                        <input type="text" id="f_archive_identifier" class="input" placeholder="e.g. TheGeneralBuster1926">
                    </div>
                    <div class="field">
                        <label>Best Stream URL <span class="badge badge-auto">Auto-selected</span></label>
                        <input type="text" id="f_archive_url" class="input" placeholder="https://archive.org/download/...">
                    </div>
                </div>
                <div id="archiveFiles" class="file-list mt-3" style="display:none">
                    <p class="file-list-title">Available video files (click to select):</p>
                    <div id="fileListItems"></div>
                </div>
            </div>

            <!-- Or enter manually -->
            <details class="mt-4">
                <summary class="link">Or enter Archive.org identifier manually</summary>
                <div class="row-inline mt-3">
                    <input type="text" id="manualIdentifier" placeholder="e.g. TheGeneralBuster1926" class="input flex-1">
                    <button onclick="loadArchiveById()" class="btn btn-outline">Load Metadata</button>
                </div>
            </details>
        </div>
    </div>

    <!-- Step 4: Save -->
    <div class="card mt-4" id="step4" style="display:none">
        <div class="card-header">
            <h3><span class="step-num">4</span> Save to Catalogue</h3>
        </div>
        <div class="card-body">
            <div class="final-preview" id="finalPreview"></div>
            <div class="field mt-4">
                <label>
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
</body>
</html>
