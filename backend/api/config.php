<?php
// ═══════════════════════════════════════════════════════════════════
// ELITE MOVIES — Server Configuration
// ═══════════════════════════════════════════════════════════════════

// ── Database ─────────────────────────────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'ochira_elite_movies');
define('DB_USER', 'ochira_maki');
define('DB_PASS', 'Owenoz123.');

// ── App ───────────────────────────────────────────────────────────────
define('APP_DOMAIN', 'https://elitemovies.duckdns.org');
define('APP_NAME',   'Elite Movies');

// ── Admin password (change this!) ────────────────────────────────────
define('ADMIN_PASSWORD', 'EliteAdmin2024!');

// ── API security key ─────────────────────────────────────────────────
define('SECRET_KEY', 'elite_movies_ochira_secret_2024_!@#');

// ── TMDB API key (same as in the mobile app) ──────────────────────────
define('TMDB_API_KEY', 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NzJkOWQyMTczM2Q3YWMzMDVkOWI2NGIwMTNmYjkwZiIsIm5iZiI6MTc1MTkwNDI1OS4yMzMsInN1YiI6IjY4NmJmMDAzZTkwOTFiMjlkYTlhNDFmNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.3yujtwat5S53QuiMkaHfFrj6gJZSvUKPu5S_qZp_dnA');

// ── Archive.org S3 Upload Keys ────────────────────────────────────────
// Get yours FREE at: https://archive.org/account/s3.php
// Create a free account at archive.org first, then visit that URL
define('ARCHIVE_ACCESS_KEY', 'w079UAJJqy2u9FLT');
define('ARCHIVE_SECRET_KEY', 'ba9fZsDCpf8NhdjX');

// ── OTP expiry (minutes) ──────────────────────────────────────────────
define('OTP_EXPIRY_MINUTES', 15);

// ── Email sender ──────────────────────────────────────────────────────
define('MAIL_FROM',      'noreply@elitemovies.duckdns.org');
define('MAIL_FROM_NAME', 'Elite Movies');
