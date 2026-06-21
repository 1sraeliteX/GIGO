<?php

require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

function handleGetProfile(): void
{
    $user = requireAuth();
    jsonResponse(['user' => $user]);
}

function handleUpdateProfile(): void
{
    $user = requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    $name = trim($input['name'] ?? '');

    if ($name === '') {
        errorResponse('Name is required');
    }

    $db = getDB();
    $stmt = $db->prepare('UPDATE users SET name = ?, updated_at = datetime("now") WHERE id = ?');
    $stmt->execute([$name, $user['id']]);

    $user['name'] = $name;
    jsonResponse(['user' => $user]);
}
