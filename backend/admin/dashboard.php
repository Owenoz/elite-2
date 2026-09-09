<?php require_once __DIR__ . '/auth.php'; requireAdminAuth(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard — Elite Movies Admin</title>
<link rel="stylesheet" href="assets/admin.css">
</head>
<body>
<?php include __DIR__ . '/partials/nav.php'; ?>

<div class="main">
    <div class="page-header">
        <div>
            <h2>Dashboard</h2>
            <p class="sub">Live overview of Elite Movies</p>
        </div>
        <a href="add-movie.php" class="btn btn-gold">+ Add Movie</a>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid" id="statsGrid">
        <div class="stat-card loading"><span class="stat-icon">🎬</span><div class="stat-val">—</div><div class="stat-label">Movies Available</div></div>
        <div class="stat-card loading"><span class="stat-icon">💰</span><div class="stat-val">—</div><div class="stat-label">Total Revenue (UGX)</div></div>
        <div class="stat-card loading"><span class="stat-icon">📅</span><div class="stat-val">—</div><div class="stat-label">Today's Revenue</div></div>
        <div class="stat-card loading"><span class="stat-icon">✅</span><div class="stat-val">—</div><div class="stat-label">Completed Payments</div></div>
        <div class="stat-card loading"><span class="stat-icon">📥</span><div class="stat-val">—</div><div class="stat-label">Total Downloads</div></div>
        <div class="stat-card loading"><span class="stat-icon">⏳</span><div class="stat-val">—</div><div class="stat-label">Pending Payments</div></div>
    </div>

    <!-- Recent Payments -->
    <div class="card mt-6">
        <div class="card-header">
            <h3>Recent Payments</h3>
            <a href="payments.php" class="link">View all →</a>
        </div>
        <div id="recentPayments">
            <div class="loading-row">Loading...</div>
        </div>
    </div>

    <!-- Quick Links -->
    <div class="quick-grid mt-6">
        <a href="add-movie.php" class="quick-card">
            <span>🎬</span>
            <strong>Add New Movie</strong>
            <p>Upload to archive.org + add to catalogue</p>
        </a>
        <a href="movies.php" class="quick-card">
            <span>📋</span>
            <strong>Manage Movies</strong>
            <p>Edit, toggle visibility, remove</p>
        </a>
        <a href="payments.php" class="quick-card">
            <span>💳</span>
            <strong>Payments</strong>
            <p>View all transactions</p>
        </a>
        <a href="downloads.php" class="quick-card">
            <span>📥</span>
            <strong>Downloads</strong>
            <p>Who has access to what</p>
        </a>
    </div>
</div>

<script src="assets/admin.js"></script>
<script>
loadStats();
</script>
</body>
</html>
