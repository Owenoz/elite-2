<?php require_once __DIR__ . '/auth.php'; requireAdminAuth(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Downloads — Elite Movies Admin</title>
<link rel="stylesheet" href="assets/admin.css">
</head>
<body>
<?php include __DIR__ . '/partials/nav.php'; ?>
<div class="main">
    <div class="page-header">
        <div><h2>Downloads / Access</h2><p class="sub">Every user who has paid and unlocked a movie</p></div>
    </div>
    <div class="card">
        <div class="table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Movie</th>
                        <th>Archive Stream</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody id="downloadsBody">
                    <tr><td colspan="4" class="loading-row">Loading...</td></tr>
                </tbody>
            </table>
        </div>
        <div class="pagination" id="downloadsPagination"></div>
    </div>
</div>

<script src="assets/admin.js"></script>
<script>
let currentPage = 1;
loadDownloads();

function loadDownloads(page) {
    if (page) currentPage = page;
    adminApi('list_downloads', { page: currentPage }).then(data => {
        const tbody = document.getElementById('downloadsBody');
        if (!data.downloads.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No downloads yet</td></tr>';
            return;
        }
        tbody.innerHTML = data.downloads.map(d => `
            <tr>
                <td>${esc(d.email)}</td>
                <td>${esc(d.movie_title || 'Movie #' + d.movie_id)}</td>
                <td>${d.archive_url
                    ? `<a href="${esc(d.archive_url)}" target="_blank" class="archive-link small">▶ Stream</a>`
                    : '<span class="muted">—</span>'}</td>
                <td class="muted small">${new Date(d.downloaded_at).toLocaleString()}</td>
            </tr>
        `).join('');
        renderPagination('downloadsPagination', currentPage, Math.ceil(data.total / 20), loadDownloads);
    });
}
</script>
</body>
</html>
