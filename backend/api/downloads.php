<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// GET  /api/downloads.php?email=x           → all downloads for email
// GET  /api/downloads.php?email=x&movie_id=y → check single movie access
// POST /api/downloads.php                    → manually record download (internal)

if ($method === 'GET') {
    $email    = strtolower(sanitize($_GET['email'] ?? ''));
    $movie_id = (int) ($_GET['movie_id'] ?? 0);

    if (!$email) {
        respond(false, null, 'email is required', 422);
    }

    // Check single movie access
    if ($movie_id) {
        $stmt = $db->prepare("SELECT d.*, m.archive_identifier, m.archive_url AS movie_archive_url
            FROM downloads d
            LEFT JOIN movies m ON m.tmdb_id = d.movie_id
            WHERE d.email = ? AND d.movie_id = ? LIMIT 1");
        $stmt->execute([$email, $movie_id]);
        $row = $stmt->fetch();
        respond(true, [
            'has_access'         => (bool) $row,
            'archive_url'        => $row['archive_url'] ?? $row['movie_archive_url'] ?? null,
            'archive_identifier' => $row['archive_identifier'] ?? null,
        ]);
    }

    // All downloads for email — join with movies for archive info
    $stmt = $db->prepare("
        SELECT d.*,
               m.archive_identifier,
               m.poster_path,
               m.backdrop_path,
               m.overview,
               m.vote_average,
               m.runtime
        FROM downloads d
        LEFT JOIN movies m ON m.tmdb_id = d.movie_id
        WHERE d.email = ?
        ORDER BY d.downloaded_at DESC
    ");
    $stmt->execute([$email]);
    respond(true, $stmt->fetchAll());
}

if ($method === 'POST') {
    $body     = getBody();
    $email    = strtolower(sanitize($body['email'] ?? ''));
    $movie_id = (int) ($body['movie_id'] ?? 0);
    $title    = sanitize($body['movie_title'] ?? '');
    $url      = $body['archive_url'] ?? '';

    if (!$email || !$movie_id) {
        respond(false, null, 'email and movie_id are required', 422);
    }

    $stmt = $db->prepare("
        INSERT IGNORE INTO downloads (email, movie_id, movie_title, archive_url)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$email, $movie_id, $title, $url]);

    respond(true, ['recorded' => true], '', 201);
}

respond(false, null, 'Method not allowed', 405);
