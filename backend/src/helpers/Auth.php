<?php

require_once __DIR__ . '/../../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function generateToken(array $payload): string
{
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;
    return JWT::encode($payload, JWT_SECRET, 'HS256');
}

function decodeToken(string $token): ?object
{
    try {
        return JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
    } catch (\Exception) {
        return null;
    }
}

function getAuthUser(): ?array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
        return null;
    }

    $decoded = decodeToken($matches[1]);
    if (!$decoded || !isset($decoded->user_id)) {
        return null;
    }

    $db = getDB();
    $stmt = $db->prepare('SELECT id, email, name FROM users WHERE id = ?');
    $stmt->execute([$decoded->user_id]);
    return $stmt->fetch() ?: null;
}

function requireAuth(): array
{
    $user = getAuthUser();
    if (!$user) {
        errorResponse('Unauthorized', 401);
    }
    return $user;
}
