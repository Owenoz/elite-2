<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// GET    /api/favorites.php?email=x              → all favorites for email
// GET    /api/favorites.php?email=x&movie_id=y   → check if favorited
// POST   /api/favorites.php                       → add favorite
// DELETE /api/favorites.php                       → remove favorite

if ($method === 'GET') {
    $email    = strtolower(sanitize($_GET['email'] ?? ''));
    $movie_id = (int) ($_GET['movie_id'] ?? 0);

    if (!$email) respond(false, null, 'email is required', 422);

    // Check single movie
    if ($movie_id) {
        $stmt = $db->prepare("SELECT id FROM favorites WHERE user_email = ? AND movie_id = ? LIMIT 1");
        $stmt->execute([$email, $movie_id]);
        respond(true, ['is_favorited' => (bool) $stmt->fetch()]);
    }

    // All favorites
    $stmt = $db->prepare("SELECT * FROM favorites WHERE user_email = ? ORDER BY created_at DESC");
    $stmt->execute([$email]);
    respond(true, $stmt->fetchAll());
}

if ($method === 'POST') {
    $body     = getBody();
    $email    = strtolower(sanitize($body['email'] ?? ''));
    $movie_id = (int) ($body['movie_id'] ?? 0);

    if (!$email || !$movie_id) respond(false, null, 'email and movie_id are required', 422);

    $stmt = $db->prepare("
        INSERT INTO favorites (user_email, movie_id, title, poster_url, vote_average, release_year)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            title        = VALUES(title),
            poster_url   = VALUES(poster_url),
            vote_average = VALUES(vote_average),
            release_year = VALUES(release_year)
    ");
    $stmt->execute([
        $email,
        $movie_id,
        sanitize($body['title'] ?? ''),
        $body['poster_url'] ?? '',
        (float) ($body['vote_average'] ?? 0),
        (int) ($body['release_year'] ?? 0),
    ]);

    respond(true, ['saved' => true], '', 201);
}

if ($method === 'DELETE') {
    $body     = getBody();
    $email    = strtolower(sanitize($body['email'] ?? ''));
    $movie_id = (int) ($body['movie_id'] ?? 0);

    if (!$email || !$movie_id) respond(false, null, 'email and movie_id are required', 422);

    $stmt = $db->prepare("DELETE FROM favorites WHERE user_email = ? AND movie_id = ?");
    $stmt->execute([$email, $movie_id]);
    respond(true, ['removed' => true]);
}

respond(false, null, 'Method not allowed', 405);
