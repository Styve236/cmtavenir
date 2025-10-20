<?php
// Afficher les erreurs pour le debug
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Connexion à la base de données
$host = "localhost";
$user = "root";
$pass = "";
$db = "cmtavenir";

$conn = new mysqli($host, $user, $pass, $db);
if($conn->connect_error) die("Connexion échouée: ".$conn->connect_error);

// Récupération des données du formulaire
$nom = $_POST['nom'];
$prenom = $_POST['prenom'];
$email = $_POST['email'];
$password = password_hash($_POST['password'], PASSWORD_BCRYPT);
$role = $_POST['role'];

// Enregistrement dans la base de données
$sql = "INSERT INTO utilisateurs (nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sssss", $nom, $prenom, $email, $password, $role);

if($stmt->execute()) {

    // === Envoi de l'email de confirmation avec PHPMailer ===
    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\Exception;

    require 'PHPMailer/src/Exception.php';
    require 'PHPMailer/src/PHPMailer.php';
    require 'PHPMailer/src/SMTP.php';

    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'brondronfouenang@gmail.com'; // Remplace par ton email
        $mail->Password   = 'mamacheri';    // Mot de passe d'application Gmail
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        $mail->setFrom('ton.email@gmail.com', 'CMT Avenir');
        $mail->addAddress($email, $prenom . " " . $nom);

        $mail->isHTML(true);
        $mail->Subject = 'Confirmation d\'inscription';
        $mail->Body    = "
            Bonjour $prenom $nom,<br><br>
            Votre inscription sur <strong>CMT Avenir</strong> est confirmée !<br><br>
            Bienvenue dans notre communauté.<br><br>
            -- CMT Avenir
        ";

        $mail->send();
        echo "Inscription réussie et email de confirmation envoyé ! <a href='../index.html'>Retour à l'accueil</a>";
    } catch (Exception $e) {
        echo "Inscription réussie mais email non envoyé : {$mail->ErrorInfo} <br><a href='../index.html'>Retour à l'accueil</a>";
    }

} else {
    echo "Erreur lors de l'inscription : ".$stmt->error;
}

$stmt->close();
$conn->close();
?>
