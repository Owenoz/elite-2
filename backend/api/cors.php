<?php
// Allow requests from the mobile app (any origin since it's a native app)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ─── Helper functions ─────────────────────────────────────────────────────────

function respond(bool $success, $data = null, string $error = '', int $code = 200): void {
    http_response_code($code);
    $body = ['success' => $success];
    if ($data !== null)  $body['data']  = $data;
    if ($error !== '')   $body['error'] = $error;
    echo json_encode($body);
    exit();
}

function getBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function requireMethod(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== strtoupper($method)) {
        respond(false, null, 'Method not allowed', 405);
    }
}

function sanitize(string $val): string {
    return htmlspecialchars(strip_tags(trim($val)));
}

function generateReference(): string {
    return 'ELITE-' . strtoupper(bin2hex(random_bytes(6))) . '-' . time();
}

function generateOtp(): string {
    return str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
}
