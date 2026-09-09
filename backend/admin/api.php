<?php
/**
 * Admin AJAX API
 * All endpoints require session auth (cookie-based from admin login).
 * Called via fetch() from the admin JS.
 *
 * Actions (POST JSON body):
 *   action=stats              → dashboard counts
 *   action=tmdb_fetch         → auto-fetch movie metadata from TMDB
 *   action=archive_search     → search archive.org for a movie
 *   action=archive_metadata   → get files list for an archive identifier
 *   action=add_movie          → upsert movie into DB
 *   action=toggle_available   → toggle is_available for a movie
 *   action=delete_movie       → remove movie from DB
 *   action=list_movies        → paginated movie list
 *   action=list_payments      → paginated payments
 *   action=list_downloads     → all downloads
 */

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/../api/db.php';

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

// Require admin session
if (empty($_SESSION[ADMIN_SESSION_KEY])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit();
}

$body   = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $body['action'] ?? $_GET['action'] ?? '';
$db     = getDB();

// ─── Helper ──────────────────────────────────────────────────────────────────
function ok($data = null): void {
    echo json_encode(['success' => true, 'data' => $data]);
    exit();
}
function fail(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $msg]);
    exit();
}

// ─── Stats ───────────────────────────────────────────────────────────────────
if ($action === 'stats') {
    $movies    = $db->query("SELECT COUNT(*) FROM movies WHERE is_available=1")->fetchColumn();
    $total_m   = $db->query("SELECT COUNT(*) FROM movies")->fetchColumn();
    $payments  = $db->query("SELECT COUNT(*) FROM payments WHERE status='completed'")->fetchColumn();
    $revenue   = $db->query("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='completed'")->fetchColumn();
    $downloads = $db->query("SELECT COUNT(*) FROM downloads")->fetchColumn();
    $pending   = $db->query("SELECT COUNT(*) FROM payments WHERE status='pending'")->fetchColumn();
    $today_rev = $db->query("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='completed' AND DATE(created_at)=CURDATE()")->fetchColumn();
    $recent    = $db->query("SELECT p.movie_title, p.email, p.amount, p.created_at FROM payments p WHERE p.status='completed' ORDER BY p.created_at DESC LIMIT 5")->fetchAll();
    ok([
        'movies_available' => (int)$movies,
        'movies_total'     => (int)$total_m,
        'payments'         => (int)$payments,
        'revenue_ugx'      => (int)$revenue,
        'today_revenue'    => (int)$today_rev,
        'downloads'        => (int)$downloads,
        'pending_payments' => (int)$pending,
        'recent_payments'  => $recent,
    ]);
}

// ─── TMDB Auto-Fetch ─────────────────────────────────────────────────────────
if ($action === 'tmdb_fetch') {
    $tmdb_id = (int)($body['tmdb_id'] ?? 0);
    $query   = trim($body['query'] ?? '');
    $api_key = defined('TMDB_API_KEY') ? TMDB_API_KEY : (getenv('TMDB_API_KEY') ?: '');

    if (!$api_key) {
        // Use the key from the mobile app .env
        $api_key = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NzJkOWQyMTczM2Q3YWMzMDVkOWI2NGIwMTNmYjkwZiIsIm5iZiI6MTc1MTkwNDI1OS4yMzMsInN1YiI6IjY4NmJmMDAzZTkwOTFiMjlkYTlhNDFmNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.3yujtwat5S53QuiMkaHfFrj6gJZSvUKPu5S_qZp_dnA';
    }

    $headers = ["Authorization: Bearer $api_key", "Accept: application/json"];
    $opts = ['http' => ['method' => 'GET', 'header' => implode("\r\n", $headers), 'timeout' => 10]];
    $ctx  = stream_context_create($opts);

    if ($tmdb_id) {
        $url  = "https://api.themoviedb.org/3/movie/$tmdb_id";
        $raw  = @file_get_contents($url, false, $ctx);
        $data = $raw ? json_decode($raw, true) : null;
        if (!$data || isset($data['success']) && $data['success'] === false) fail('Movie not found on TMDB');
        ok($data);
    } elseif ($query) {
        $q   = urlencode($query);
        $url = "https://api.themoviedb.org/3/search/movie?query=$q&page=1";
        $raw = @file_get_contents($url, false, $ctx);
        $data = $raw ? json_decode($raw, true) : null;
        if (!$data) fail('TMDB search failed');
        ok($data['results'] ?? []);
    } else {
        fail('Provide tmdb_id or query');
    }
}

// ─── Archive.org Search ───────────────────────────────────────────────────────
if ($action === 'archive_search') {
    $query = trim($body['query'] ?? '');
    if (!$query) fail('query is required');

    $q   = urlencode("title:($query) AND mediatype:movies");
    $url = "https://archive.org/advancedsearch.php?q=$q&fl[]=identifier&fl[]=title&fl[]=year&fl[]=description&fl[]=downloads&rows=8&output=json";
    $raw = @file_get_contents($url, false, stream_context_create(['http' => ['timeout' => 10]]));
    if (!$raw) fail('Archive.org search failed');

    $data = json_decode($raw, true);
    ok($data['response']['docs'] ?? []);
}

// ─── Archive.org Metadata (files list for an identifier) ─────────────────────
if ($action === 'archive_metadata') {
    $identifier = trim($body['identifier'] ?? '');
    if (!$identifier) fail('identifier is required');

    $url = "https://archive.org/metadata/$identifier";
    $raw = @file_get_contents($url, false, stream_context_create(['http' => ['timeout' => 10]]));
    if (!$raw) fail('Could not fetch archive metadata');

    $data  = json_decode($raw, true);
    $files = $data['files'] ?? [];

    // Filter video files only, pick best quality MP4
    $videos = array_filter($files, fn($f) =>
        isset($f['format']) && (
            stripos($f['format'], 'mp4') !== false ||
            stripos($f['format'], 'mpeg4') !== false ||
            stripos($f['format'], 'h.264') !== false
        )
    );

    $result = array_values(array_map(fn($f) => [
        'name'   => $f['name'],
        'format' => $f['format'],
        'size'   => isset($f['size']) ? round($f['size'] / 1024 / 1024, 1) . ' MB' : 'unknown',
        'url'    => "https://archive.org/download/$identifier/{$f['name']}",
    ], $videos));

    // Auto-pick best file: prefer 512kb or medium quality
    $best = null;
    foreach ($result as $f) {
        if (stripos($f['name'], '512') !== false || stripos($f['name'], '256') !== false) { $best = $f; break; }
    }
    if (!$best && !empty($result)) $best = $result[0];

    ok([
        'files'        => $result,
        'best_file'    => $best,
        'embed_url'    => "https://archive.org/embed/$identifier",
        'details_url'  => "https://archive.org/details/$identifier",
        'identifier'   => $identifier,
        'meta'         => [
            'title'       => $data['metadata']['title'] ?? '',
            'description' => $data['metadata']['description'] ?? '',
            'year'        => $data['metadata']['year'] ?? '',
        ],
    ]);
}

// ─── Add / Update Movie ───────────────────────────────────────────────────────
if ($action === 'add_movie') {
    $tmdb_id    = (int)($body['tmdb_id'] ?? 0);
    $title      = trim($body['title'] ?? '');
    $archive_id = trim($body['archive_identifier'] ?? '');
    $archive_url= trim($body['archive_url'] ?? '');

    if (!$tmdb_id || !$title) fail('tmdb_id and title are required');

    $stmt = $db->prepare("
        INSERT INTO movies (tmdb_id, title, overview, poster_path, backdrop_path,
            release_year, vote_average, runtime, archive_identifier, archive_url, is_available)
        VALUES (:tmdb_id,:title,:overview,:poster_path,:backdrop_path,
            :release_year,:vote_average,:runtime,:archive_identifier,:archive_url,:is_available)
        ON DUPLICATE KEY UPDATE
            title=VALUES(title), overview=VALUES(overview),
            poster_path=VALUES(poster_path), backdrop_path=VALUES(backdrop_path),
            release_year=VALUES(release_year), vote_average=VALUES(vote_average),
            runtime=VALUES(runtime), archive_identifier=VALUES(archive_identifier),
            archive_url=VALUES(archive_url), is_available=VALUES(is_available)
    ");
    $stmt->execute([
        ':tmdb_id'            => $tmdb_id,
        ':title'              => $title,
        ':overview'           => $body['overview'] ?? '',
        ':poster_path'        => $body['poster_path'] ?? '',
        ':backdrop_path'      => $body['backdrop_path'] ?? '',
        ':release_year'       => (int)($body['release_year'] ?? 0),
        ':vote_average'       => (float)($body['vote_average'] ?? 0),
        ':runtime'            => (int)($body['runtime'] ?? 0),
        ':archive_identifier' => $archive_id ?: null,
        ':archive_url'        => $archive_url ?: null,
        ':is_available'       => (int)($body['is_available'] ?? 1),
    ]);

    $id    = $db->lastInsertId() ?: $db->query("SELECT id FROM movies WHERE tmdb_id=$tmdb_id")->fetchColumn();
    $movie = $db->query("SELECT * FROM movies WHERE id=$id")->fetch();
    ok($movie);
}

// ─── Toggle Available ─────────────────────────────────────────────────────────
if ($action === 'toggle_available') {
    $id = (int)($body['id'] ?? 0);
    if (!$id) fail('id required');
    $db->prepare("UPDATE movies SET is_available = 1 - is_available WHERE id=?")->execute([$id]);
    $movie = $db->query("SELECT * FROM movies WHERE id=$id")->fetch();
    ok($movie);
}

// ─── Delete Movie ─────────────────────────────────────────────────────────────
if ($action === 'delete_movie') {
    $id = (int)($body['id'] ?? 0);
    if (!$id) fail('id required');
    $db->prepare("DELETE FROM movies WHERE id=?")->execute([$id]);
    ok(['deleted' => true]);
}

// ─── List Movies ─────────────────────────────────────────────────────────────
if ($action === 'list_movies') {
    $page    = max(1, (int)($body['page'] ?? 1));
    $limit   = 20;
    $search  = trim($body['search'] ?? '');
    $offset  = ($page - 1) * $limit;

    if ($search) {
        $q     = "%$search%";
        $total = $db->prepare("SELECT COUNT(*) FROM movies WHERE title LIKE ?")->execute([$q]) ? $db->prepare("SELECT COUNT(*) FROM movies WHERE title LIKE ?")->execute([$q]) && 0 : 0;
        $stmt  = $db->prepare("SELECT * FROM movies WHERE title LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?");
        $stmt->execute([$q, $limit, $offset]);
        $count = $db->prepare("SELECT COUNT(*) FROM movies WHERE title LIKE ?");
        $count->execute([$q]);
        $total = $count->fetchColumn();
    } else {
        $total = $db->query("SELECT COUNT(*) FROM movies")->fetchColumn();
        $stmt  = $db->prepare("SELECT * FROM movies ORDER BY created_at DESC LIMIT ? OFFSET ?");
        $stmt->execute([$limit, $offset]);
    }

    ok(['movies' => $stmt->fetchAll(), 'total' => (int)$total, 'page' => $page]);
}

// ─── List Payments ────────────────────────────────────────────────────────────
if ($action === 'list_payments') {
    $page   = max(1, (int)($body['page'] ?? 1));
    $limit  = 20;
    $offset = ($page - 1) * $limit;
    $status = $body['status'] ?? '';

    if ($status) {
        $total = $db->prepare("SELECT COUNT(*) FROM payments WHERE status=?")->execute([$status]) ? 0 : 0;
        $c = $db->prepare("SELECT COUNT(*) FROM payments WHERE status=?"); $c->execute([$status]); $total = $c->fetchColumn();
        $stmt = $db->prepare("SELECT * FROM payments WHERE status=? ORDER BY created_at DESC LIMIT ? OFFSET ?");
        $stmt->execute([$status, $limit, $offset]);
    } else {
        $total = $db->query("SELECT COUNT(*) FROM payments")->fetchColumn();
        $stmt  = $db->prepare("SELECT * FROM payments ORDER BY created_at DESC LIMIT ? OFFSET ?");
        $stmt->execute([$limit, $offset]);
    }
    ok(['payments' => $stmt->fetchAll(), 'total' => (int)$total, 'page' => $page]);
}

// ─── List Downloads ───────────────────────────────────────────────────────────
if ($action === 'list_downloads') {
    $page   = max(1, (int)($body['page'] ?? 1));
    $limit  = 20;
    $offset = ($page - 1) * $limit;
    $total  = $db->query("SELECT COUNT(*) FROM downloads")->fetchColumn();
    $stmt   = $db->prepare("SELECT * FROM downloads ORDER BY downloaded_at DESC LIMIT ? OFFSET ?");
    $stmt->execute([$limit, $offset]);
    ok(['downloads' => $stmt->fetchAll(), 'total' => (int)$total, 'page' => $page]);
}

fail("Unknown action: $action");
