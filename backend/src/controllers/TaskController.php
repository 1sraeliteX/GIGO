<?php

require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

function handleGetTasks(): void
{
    requireAuth();

    $tasks = [];
    for ($i = 1; $i <= 10; $i++) {
        $tasks[] = [
            'id' => $i,
            'title' => "Task {$i}",
        ];
    }

    jsonResponse(['tasks' => $tasks]);
}
