<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// GET  /api/search.php?limit=5   → top trending searches
// POST /api/search.php            → track a search term

if ($method === 'GET') {
    $limit = min(20, (int) ($_GET['limit'] ?? 5));

    $stmt = $db->prepare("
        SELECT search_term, movie_id, title, poster_url, count
        FROM search_counts
        ORDER BY count DESC
        LIMIT ?
    ");
    $stmt->execute([$limit]);
    respond(true, $stmt->fetchAll());
}

if ($method === 'POST') {
    $body  = getBody();
    $term  = strtolower(sanitize($body['search_term'] ?? ''));
    $mid   = (int) ($body['movie_id'] ?? 0);
    $title = sanitize($body['title'] ?? '');
    $url   = $body['poster_url'] ?? '';

    if (!$term) respond(false, null, 'search_term is required', 422);

    // Upsert: increment count if exists, insert if not
    $stmt = $db->prepare("
        INSERT INTO search_counts (search_term, movie_id, title, poster_url, count)
        VALUES (?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
            count      = count + 1,
            movie_id   = VALUES(movie_id),
            title      = VALUES(title),
            poster_url = VALUES(poster_url)
    ");
    $stmt->execute([$term, $mid ?: null, $title ?: null, $url ?: null]);

    respond(true, ['tracked' => true]);
}

respond(false, null, 'Method not allowed', 405);
