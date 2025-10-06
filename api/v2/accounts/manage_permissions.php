<?php
require_once("../configs/configs.php");
header('Content-Type: application/json');

$input_data = file_get_contents("php://input");
$data = json_decode($input_data, true);

// Validate required fields
if (empty($data['token']) || empty($data['user_id']) || empty($data['account_id'])) {
    http_response_code(400);
    echo json_encode([
        "code" => 400,
        "status" => "error",
        "message" => "Token, user_id, and account_id are required."
    ]);
    exit;
}

$token = mysqli_real_escape_string($connection, $data['token']);
$targetUserId = intval($data['user_id']);
$accountId = intval($data['account_id']);

// Validate admin permissions
$adminQuery = mysqli_query($connection, "
    SELECT u.id AS user_id, ua.account_id, ua.role, ua.permissions
    FROM users u
    JOIN user_accounts ua ON ua.user_id = u.id
    WHERE u.token = '$token' 
      AND u.status = 'active'
      AND ua.status = 'active'
    LIMIT 1
");

if (!$adminQuery || mysqli_num_rows($adminQuery) === 0) {
    http_response_code(403);
    echo json_encode([
        "code" => 403,
        "status" => "error",
        "message" => "Unauthorized. Invalid token."
    ]);
    exit;
}

$admin = mysqli_fetch_assoc($adminQuery);

// Check if admin has permission to manage users
$adminPermissions = $admin['permissions'] ? json_decode($admin['permissions'], true) : [];
if (!in_array('manage_users', $adminPermissions) && $admin['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode([
        "code" => 403,
        "status" => "error",
        "message" => "Insufficient permissions to manage users."
    ]);
    exit;
}

// Check if target user exists and has access to the account
$targetUserQuery = mysqli_query($connection, "
    SELECT 
        u.id, u.name, u.email,
        ua.role, ua.permissions, ua.status
    FROM users u
    JOIN user_accounts ua ON ua.user_id = u.id
    WHERE u.id = $targetUserId
      AND ua.account_id = $accountId
      AND u.status = 'active'
    LIMIT 1
");

if (!$targetUserQuery || mysqli_num_rows($targetUserQuery) === 0) {
    http_response_code(404);
    echo json_encode([
        "code" => 404,
        "status" => "error",
        "message" => "User not found or doesn't have access to this account."
    ]);
    exit;
}

$targetUser = mysqli_fetch_assoc($targetUserQuery);

// Determine action type
$action = !empty($data['action']) ? $data['action'] : 'update';

if ($action === 'update') {
    // Update role and permissions
    $newRole = !empty($data['role']) ? mysqli_real_escape_string($connection, $data['role']) : $targetUser['role'];
    $newPermissions = !empty($data['permissions']) ? json_encode($data['permissions']) : $targetUser['permissions'];
    $newStatus = !empty($data['status']) ? mysqli_real_escape_string($connection, $data['status']) : $targetUser['status'];
    
    $updateQuery = "
        UPDATE user_accounts 
        SET role = '$newRole',
            permissions = " . ($newPermissions ? "'$newPermissions'" : "NULL") . ",
            status = '$newStatus'
        WHERE user_id = $targetUserId 
          AND account_id = $accountId
    ";
    
    if (mysqli_query($connection, $updateQuery)) {
        echo json_encode([
            "code" => 200,
            "status" => "success",
            "message" => "User permissions updated successfully.",
            "data" => [
                "user_id" => $targetUserId,
                "user_name" => $targetUser['name'],
                "account_id" => $accountId,
                "updated_permissions" => [
                    "role" => $newRole,
                    "permissions" => $data['permissions'] ?? json_decode($targetUser['permissions'], true),
                    "status" => $newStatus
                ]
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "code" => 500,
            "status" => "error",
            "message" => "Failed to update user permissions.",
            "db_error" => mysqli_error($connection)
        ]);
    }
    
} elseif ($action === 'revoke') {
    // Revoke account access
    $revokeQuery = "
        UPDATE user_accounts 
        SET status = 'inactive'
        WHERE user_id = $targetUserId 
          AND account_id = $accountId
    ";
    
    if (mysqli_query($connection, $revokeQuery)) {
        echo json_encode([
            "code" => 200,
            "status" => "success",
            "message" => "User account access revoked successfully.",
            "data" => [
                "user_id" => $targetUserId,
                "user_name" => $targetUser['name'],
                "account_id" => $accountId,
                "action" => "revoked"
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "code" => 500,
            "status" => "error",
            "message" => "Failed to revoke user access.",
            "db_error" => mysqli_error($connection)
        ]);
    }
    
} elseif ($action === 'grant') {
    // Grant access to existing user
    $newRole = !empty($data['role']) ? mysqli_real_escape_string($connection, $data['role']) : 'user';
    $newPermissions = !empty($data['permissions']) ? json_encode($data['permissions']) : null;
    
    // Check if access already exists
    $existingAccessQuery = mysqli_query($connection, "
        SELECT id FROM user_accounts 
        WHERE user_id = $targetUserId 
          AND account_id = $accountId
    ");
    
    if ($existingAccessQuery && mysqli_num_rows($existingAccessQuery) > 0) {
        // Update existing access
        $updateQuery = "
            UPDATE user_accounts 
            SET role = '$newRole',
                permissions = " . ($newPermissions ? "'$newPermissions'" : "NULL") . ",
                status = 'active'
            WHERE user_id = $targetUserId 
              AND account_id = $accountId
        ";
        
        if (mysqli_query($connection, $updateQuery)) {
            echo json_encode([
                "code" => 200,
                "status" => "success",
                "message" => "User account access updated successfully.",
                "data" => [
                    "user_id" => $targetUserId,
                    "user_name" => $targetUser['name'],
                    "account_id" => $accountId,
                    "action" => "updated"
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "code" => 500,
                "status" => "error",
                "message" => "Failed to update user access.",
                "db_error" => mysqli_error($connection)
            ]);
        }
    } else {
        // Create new access
        $insertQuery = "
            INSERT INTO user_accounts (
                user_id, account_id, role, permissions, status, created_at
            ) VALUES (
                $targetUserId,
                $accountId,
                '$newRole',
                " . ($newPermissions ? "'$newPermissions'" : "NULL") . ",
                'active',
                NOW()
            )
        ";
        
        if (mysqli_query($connection, $insertQuery)) {
            echo json_encode([
                "code" => 201,
                "status" => "success",
                "message" => "User account access granted successfully.",
                "data" => [
                    "user_id" => $targetUserId,
                    "user_name" => $targetUser['name'],
                    "account_id" => $accountId,
                    "action" => "granted"
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "code" => 500,
                "status" => "error",
                "message" => "Failed to grant user access.",
                "db_error" => mysqli_error($connection)
            ]);
        }
    }
    
} else {
    http_response_code(400);
    echo json_encode([
        "code" => 400,
        "status" => "error",
        "message" => "Invalid action. Use 'update', 'revoke', or 'grant'."
    ]);
}
?>
