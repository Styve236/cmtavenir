<?php
// php/traitement_contact.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

// Récupération des données POST
$nom = $_POST['nom'];
$email = $_POST['email'];
$sujet = $_POST['sujet'];
$message = $_POST['message'];

// Validation simple côté serveur
if(empty($nom) || empty($email) || empty($sujet) || empty($message)) {
    die("Tous les champs sont requis !");
}

// Préparer l'envoi par mail (exemple)
$to = "contact@cmtavenir.com"; // Remplace par ton email
$headers = "From: $email\r\nReply-To: $email\r\n";
$body = "Nom: $nom\nEmail: $email\nSujet: $sujet\nMessage:\n$message";

if(mail($to, $sujet, $body, $headers)) {
    echo "Merci ! Votre message a été envoyé.<br><a href='../index.html'>Retour à l'accueil</a>";
} else {
    echo "Erreur lors de l'envoi. Veuillez réessayer.";
}
?>
