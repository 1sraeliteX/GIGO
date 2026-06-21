<?php

function loadEnv(string $path): void
{
    if (!file_exists($path)) {
        return;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) {
            continue;
        }
        $key = trim($parts[0]);
        $value = trim($parts[1]);
        $_ENV[$key] = $value;
        putenv("$key=$value");
    }
}

function env(string $key, mixed $default = null): mixed
{
    return $_ENV[$key] ?? $default;
}

loadEnv(__DIR__ . '/../.env');

define('DB_DRIVER', env('DB_DRIVER', 'sqlite'));
define('DB_PATH', __DIR__ . '/../' . env('DB_PATH', 'data/app.db'));
define('DB_HOST', env('DB_HOST', '127.0.0.1'));
define('DB_PORT', env('DB_PORT', '3306'));
define('DB_NAME', env('DB_NAME', 'magic_dashboard'));
define('DB_USER', env('DB_USER', 'root'));
define('DB_PASS', env('DB_PASS', ''));
define('JWT_SECRET', env('JWT_SECRET', 'change-this'));
define('JWT_EXPIRY', (int) env('JWT_EXPIRY', 86400));
define('APP_URL', env('APP_URL', 'http://localhost:5173'));
define('SMTP_HOST', env('SMTP_HOST', ''));
define('SMTP_PORT', (int) env('SMTP_PORT', 587));
define('SMTP_USER', env('SMTP_USER', ''));
define('SMTP_PASS', env('SMTP_PASS', ''));
define('SMTP_FROM', env('SMTP_FROM', 'noreply@gigo.app'));
define('SMTP_FROM_NAME', env('SMTP_FROM_NAME', 'GIGO'));
