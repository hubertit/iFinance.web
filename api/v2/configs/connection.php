<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

$db_host="localhost";
$db_user="root";
$db_password="mysql";
$db_name="gemura";

$connection = mysqli_connect($db_host,$db_user,$db_password,$db_name) or die(mysqli_error($connection));
?>
