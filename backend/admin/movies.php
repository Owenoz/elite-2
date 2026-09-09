<?php require_once __DIR__ . '/auth.php'; requireAdminAuth(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Movies — Elite Movies Admin</title>
<link rel="stylesheet" href="assets/admin.css">
</head>
<body>
<?php include __DIR__ . '/partials/nav.php'; ?>
<div class="main">
    <div class="page-header">
        <div><h2>Movies Catalogue</h2><p class="sub">All movies in the database</p></div>
        <a href="add-movie.php" class="btn btn-gold">+ Add Movie</a>
    </div>

    <div class="card">
        <div class="card-header">
            <input type="text" id="movieSearch" placeholder="Search movies..." class="input w-300" oninput="debounce(loadMovies,400)()">
            <span id="movieCount" class="muted"></span>
        </div>
        <div class="table-wrap">
            <table class="table" id="moviesTable">
                <thead>
                    <tr>
                        <th>Poster</th>
                        <th>Title</th>
                        <th>Year</th>
                        <th>Rating</th>
                        <th>Archive</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="moviesBody">
                    <tr><td colspan="7" class="loading-row">Loading movies...</td></tr>
                </tbody>
            </table>
        </div>
        <div class="pagination" id="moviesPagination"></div>
    </div>
</div>

<!-- Delete confirm modal -->
<div class="modal" id="deleteModal" style="display:none">
    <div class="modal-box">
        <h3>Delete Movie?</h3>
        <p id="deleteMovieName" class="mt-2 muted"></p>
        <p class="mt-2">This will remove it from the app immediately. Cannot be undone.</p>
        <div class="modal-btns mt-4">
            <button onclick="closeModal('deleteModal')" class="btn btn-outline">Cancel</button>
            <button onclick="confirmDelete()" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
        </div>
    </div>
</div>

<script src="assets/admin.js"></script>
<script>
let currentPage = 1;
let deleteId = null;

loadMovies();

function loadMovies(page) {
    if (page) currentPage = page;
    const search = document.getElementById('movieSearch').value;
    adminApi('list_movies', { page: currentPage, search })
        .then(data => {
            const count = data.total;
            document.getElementById('movieCount').textContent = `${count} movie${count !== 1 ? 's' : ''}`;
            const tbody = document.getElementById('moviesBody');
            if (!data.movies.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No movies found</td></tr>';
                return;
            }
            tbody.innerHTML = data.movies.map(m => `
                <tr>
                    <td><img src="${m.poster_path ? 'https://image.tmdb.org/t/p/w92'+m.poster_path : 'https://placehold.co/46x68/1C1B2E/D4AF37?text=?'}" class="poster-thumb" alt="${m.title}"></td>
                    <td>
                        <strong>${esc(m.title)}</strong>
                        <div class="muted small">TMDB: ${m.tmdb_id}</div>
                    </td>
                    <td>${m.release_year || '—'}</td>
                    <td><span class="rating">⭐ ${m.vote_average || '—'}</span></td>
                    <td>${m.archive_identifier
                        ? `<a href="https://archive.org/details/${m.archive_identifier}" target="_blank" class="archive-link">📼 ${esc(m.archive_identifier)}</a>`
                        : '<span class="badge badge-warn">No archive</span>'}</td>
                    <td>
                        <button onclick="toggleAvailable(${m.id})" class="badge ${m.is_available ? 'badge-green' : 'badge-red'} cursor">
                            ${m.is_available ? '✅ Live' : '⛔ Hidden'}
                        </button>
                    </td>
                    <td>
                        <div class="action-btns">
                            <a href="add-movie.php?edit=${m.tmdb_id}" class="btn btn-sm btn-outline">Edit</a>
                            <button onclick="deleteMovie(${m.id}, '${esc(m.title)}')" class="btn btn-sm btn-danger">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
            renderPagination('moviesPagination', currentPage, Math.ceil(count / 20), loadMovies);
        });
}

function toggleAvailable(id) {
    adminApi('toggle_available', { id }).then(() => loadMovies());
}

function deleteMovie(id, title) {
    deleteId = id;
    document.getElementById('deleteMovieName').textContent = title;
    document.getElementById('deleteModal').style.display = 'flex';
}

function confirmDelete() {
    adminApi('delete_movie', { id: deleteId }).then(() => {
        closeModal('deleteModal');
        loadMovies();
    });
}
</script>
</body>
</html>
