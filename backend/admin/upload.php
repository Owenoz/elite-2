<?php
/**
 * Elite Movies — Archive.org Upload Handler
 *
 * Flow:
 *   1. Admin selects video from local storage on add-movie.php
 *   2. File uploads here via XHR (chunked with progress)
 *   3. Script streams it to archive.org S3 API
 *   4. Returns identifier + stream URL to admin JS
 *   5. Admin JS auto-saves to DB → movie appears in app instantly
 */

// Allow large uploads
@ini_set('upload_max_filesize', '4096M');
@ini_set('post_max_size',       '4096M');
@ini_set('max_execution_time',  '7200');
@ini_set('memory_limit',        '512M');

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/../api/db.php';

requireAdminAuth();

header('Content-Type: application/json; charset=UTF-8');

// ── Helpers ───────────────────────────────────────────────────────────────────
function uploadOk($data): void  { echo json_encode(['success' => true,  'data'  => $data]);  exit(); }
function uploadErr($msg): void  { echo json_encode(['success' => false, 'error' => $msg]);   exit(); }

// ── Check keys configured ─────────────────────────────────────────────────────
if (!defined('ARCHIVE_ACCESS_KEY') || !defined('ARCHIVE_SECRET_KEY') ||
    ARCHIVE_ACCESS_KEY === 'YOUR_ACCESS_KEY') {
    uploadErr('Archive.org S3 keys not configured. Go to https://archive.org/account/s3.php and add them to config.php');
}

// ── Validate upload ───────────────────────────────────────────────────────────
if (empty($_FILES['video'])) {
    uploadErr('No video file received');
}

$file      = $_FILES['video'];
$title     = trim($_POST['title']     ?? 'Untitled Movie');
$year      = trim($_POST['year']      ?? date('Y'));
$tmdb_id   = trim($_POST['tmdb_id']  ?? '');
$mediatype = 'movies';

if ($file['error'] !== UPLOAD_ERR_OK) {
    $errors = [
        UPLOAD_ERR_INI_SIZE   => 'File too large (server limit)',
        UPLOAD_ERR_FORM_SIZE  => 'File too large (form limit)',
        UPLOAD_ERR_PARTIAL    => 'Upload was partial',
        UPLOAD_ERR_NO_FILE    => 'No file sent',
        UPLOAD_ERR_NO_TMP_DIR => 'No temp directory',
        UPLOAD_ERR_CANT_WRITE => 'Cannot write to disk',
        UPLOAD_ERR_EXTENSION  => 'Extension blocked upload',
    ];
    uploadErr($errors[$file['error']] ?? 'Upload error ' . $file['error']);
}

// Allow only video files
$allowed_types = ['video/mp4', 'video/mpeg', 'video/x-msvideo', 'video/quicktime',
                  'video/x-matroska', 'video/webm', 'video/ogg'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime  = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mime, $allowed_types)) {
    uploadErr("Invalid file type: $mime. Only video files allowed.");
}

$max_size = 4 * 1024 * 1024 * 1024; // 4 GB
if ($file['size'] > $max_size) {
    uploadErr('File too large. Maximum 4 GB.');
}

// ── Build archive.org identifier ──────────────────────────────────────────────
// Identifier must be unique, URL-safe, no spaces
$clean_title = preg_replace('/[^a-zA-Z0-9_-]/', '_', $title);
$identifier  = 'EliteMovies_' . $clean_title . '_' . $year . '_' . time();
$filename    = basename($file['name']);

// ── Upload to archive.org via S3 API ─────────────────────────────────────────
// Archive.org S3 endpoint: https://s3.us.archive.org
$s3_host   = 's3.us.archive.org';
$s3_bucket = $identifier;  // bucket = identifier on archive.org
$s3_key    = $filename;

$upload_url = "https://{$s3_host}/{$s3_bucket}/{$s3_key}";

// Archive.org metadata headers (set item info during upload)
$archive_headers = [
    "Authorization: LOW " . ARCHIVE_ACCESS_KEY . ":" . ARCHIVE_SECRET_KEY,
    "x-archive-meta-mediatype: $mediatype",
    "x-archive-meta-title: $title",
    "x-archive-meta-year: $year",
    "x-archive-meta-subject: movies;film;elite-movies",
    "x-archive-meta-description: $title ($year) — Uploaded via Elite Movies Admin",
    "x-archive-auto-make-bucket: 1",   // create the item automatically
    "Content-Type: $mime",
    "Content-Length: " . $file['size'],
];

if ($tmdb_id) {
    $archive_headers[] = "x-archive-meta-external-identifier: tmdb:$tmdb_id";
}

// Stream file to archive.org using cURL
$fp = fopen($file['tmp_name'], 'rb');
if (!$fp) uploadErr('Cannot open temp file for reading');

// Progress tracking via output buffering
$upload_start = time();

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $upload_url,
    CURLOPT_PUT            => true,
    CURLOPT_INFILE         => $fp,
    CURLOPT_INFILESIZE     => $file['size'],
    CURLOPT_HTTPHEADER     => $archive_headers,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 3600,  // 1 hour for large files
    CURLOPT_CONNECTTIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_VERBOSE        => false,
]);

$response    = curl_exec($ch);
$http_code   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error  = curl_error($ch);
curl_close($ch);
fclose($fp);

if ($curl_error) {
    uploadErr("Upload failed (cURL): $curl_error");
}

if ($http_code !== 200) {
    uploadErr("Archive.org returned HTTP $http_code. Response: " . substr($response, 0, 300));
}

// ── Build URLs ────────────────────────────────────────────────────────────────
$stream_url  = "https://archive.org/download/{$identifier}/{$filename}";
$embed_url   = "https://archive.org/embed/{$identifier}";
$details_url = "https://archive.org/details/{$identifier}";
$duration    = time() - $upload_start;

// ── Auto-save to DB if tmdb_id was provided ───────────────────────────────────
$movie_saved = false;
if ($tmdb_id) {
    try {
        $db = getDB();

        // Fetch TMDB metadata to auto-fill movie details
        $tmdb_api_key = defined('TMDB_API_KEY') ? TMDB_API_KEY : '';
        $tmdb_data = null;
        if ($tmdb_api_key) {
            $ctx = stream_context_create(['http' => [
                'method'  => 'GET',
                'header'  => "Authorization: Bearer $tmdb_api_key\r\nAccept: application/json",
                'timeout' => 10,
            ]]);
            $raw = @file_get_contents("https://api.themoviedb.org/3/movie/$tmdb_id", false, $ctx);
            if ($raw) $tmdb_data = json_decode($raw, true);
        }

        $stmt = $db->prepare("
            INSERT INTO movies (tmdb_id, title, overview, poster_path, backdrop_path,
                release_year, vote_average, runtime, archive_identifier, archive_url, is_available)
            VALUES (:tmdb_id,:title,:overview,:poster_path,:backdrop_path,
                :release_year,:vote_average,:runtime,:archive_identifier,:archive_url,1)
            ON DUPLICATE KEY UPDATE
                archive_identifier=VALUES(archive_identifier),
                archive_url=VALUES(archive_url),
                is_available=1,
                title=IF(title='',VALUES(title),title)
        ");
        $stmt->execute([
            ':tmdb_id'            => (int)$tmdb_id,
            ':title'              => $tmdb_data['title']         ?? $title,
            ':overview'           => $tmdb_data['overview']      ?? '',
            ':poster_path'        => $tmdb_data['poster_path']   ?? '',
            ':backdrop_path'      => $tmdb_data['backdrop_path'] ?? '',
            ':release_year'       => isset($tmdb_data['release_date'])
                                      ? (int)substr($tmdb_data['release_date'], 0, 4)
                                      : (int)$year,
            ':vote_average'       => (float)($tmdb_data['vote_average'] ?? 0),
            ':runtime'            => (int)($tmdb_data['runtime'] ?? 0),
            ':archive_identifier' => $identifier,
            ':archive_url'        => $stream_url,
        ]);
        $movie_saved = true;
    } catch (\Exception $e) {
        // Non-fatal — upload succeeded, DB save can be done manually
        error_log("Elite Movies DB save after upload failed: " . $e->getMessage());
    }
}

uploadOk([
    'identifier'   => $identifier,
    'stream_url'   => $stream_url,
    'embed_url'    => $embed_url,
    'details_url'  => $details_url,
    'filename'     => $filename,
    'size_mb'      => round($file['size'] / 1024 / 1024, 1),
    'duration_s'   => $duration,
    'movie_saved'  => $movie_saved,
    'message'      => "✅ Uploaded to archive.org in {$duration}s."
        . ($movie_saved ? " Movie saved to database — live in app!" : " Save metadata manually."),
]);
