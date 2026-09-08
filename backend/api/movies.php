<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

// GET /api/movies.php                   → all available movies
// GET /api/movies.php?tmdb_id=123       → single movie by TMDB id
// GET /api/movies.php?search=batman     → movies matching title
// POST /api/movies.php                  → add/update movie (admin)

if ($method === 'GET') {

    // Single movie by TMDB id
    if (!empty($_GET['tmdb_id'])) {
        $tmdb_id = (int) $_GET['tmdb_id'];
        $stmt = $db->prepare("SELECT * FROM movies WHERE tmdb_id = ?");
        $stmt->execute([$tmdb_id]);
        $movie = $stmt->fetch();
        if (!$movie) {
            respond(true, null); // not in catalogue — that's fine
        }
        respond(true, $movie);
    }

    // Search by title
    if (!empty($_GET['search'])) {
        $q = '%' . sanitize($_GET['search']) . '%';
        $stmt = $db->prepare("SELECT * FROM movies WHERE title LIKE ? AND is_available = 1 ORDER BY title LIMIT 20");
        $stmt->execute([$q]);
        respond(true, $stmt->fetchAll());
    }

    // All available movies (optionally paginated)
    $page  = max(1, (int) ($_GET['page'] ?? 1));
    $limit = min(50, (int) ($_GET['limit'] ?? 20));
    $offset = ($page - 1) * $limit;

    $total = $db->query("SELECT COUNT(*) FROM movies WHERE is_available = 1")->fetchColumn();

    $stmt = $db->prepare("SELECT * FROM movies WHERE is_available = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?");
    $stmt->execute([$limit, $offset]);
    $movies = $stmt->fetchAll();

    respond(true, [
        'movies'     => $movies,
        'total'      => (int) $total,
        'page'       => $page,
        'limit'      => $limit,
        'has_more'   => ($offset + $limit) < $total,
    ]);
}

if ($method === 'POST') {
    // Simple admin key check — change this in config.php
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if ($auth !== 'Bearer ' . SECRET_KEY) {
        respond(false, null, 'Unauthorized', 401);
    }

    $body = getBody();

    $required = ['tmdb_id', 'title'];
    foreach ($required as $field) {
        if (empty($body[$field])) {
            respond(false, null, "Missing required field: $field", 422);
        }
    }

    $stmt = $db->prepare("
        INSERT INTO movies (tmdb_id, title, overview, poster_path, backdrop_path,
                            release_year, vote_average, runtime, archive_identifier,
                            archive_url, is_available)
        VALUES (:tmdb_id, :title, :overview, :poster_path, :backdrop_path,
                :release_year, :vote_average, :runtime, :archive_identifier,
                :archive_url, :is_available)
        ON DUPLICATE KEY UPDATE
            title              = VALUES(title),
            overview           = VALUES(overview),
            poster_path        = VALUES(poster_path),
            backdrop_path      = VALUES(backdrop_path),
            release_year       = VALUES(release_year),
            vote_average       = VALUES(vote_average),
            runtime            = VALUES(runtime),
            archive_identifier = VALUES(archive_identifier),
            archive_url        = VALUES(archive_url),
            is_available       = VALUES(is_available)
    ");

    $stmt->execute([
        ':tmdb_id'            => (int) $body['tmdb_id'],
        ':title'              => sanitize($body['title']),
        ':overview'           => $body['overview'] ?? '',
        ':poster_path'        => $body['poster_path'] ?? '',
        ':backdrop_path'      => $body['backdrop_path'] ?? '',
        ':release_year'       => (int) ($body['release_year'] ?? 0),
        ':vote_average'       => (float) ($body['vote_average'] ?? 0),
        ':runtime'            => (int) ($body['runtime'] ?? 0),
        ':archive_identifier' => $body['archive_identifier'] ?? null,
        ':archive_url'        => $body['archive_url'] ?? null,
        ':is_available'       => (int) ($body['is_available'] ?? 0),
    ]);

    $id = $db->lastInsertId();
    $movie = $db->prepare("SELECT * FROM movies WHERE id = ?")->execute([$id]) ? $db->query("SELECT * FROM movies WHERE id = $id")->fetch() : null;
    respond(true, $movie, '', 201);
}

respond(false, null, 'Method not allowed', 405);
