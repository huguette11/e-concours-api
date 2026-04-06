import { prisma } from "../prisma.js";
import bcrypt from "bcrypt";
import { response } from "express";
import jwt from "jsonwebtoken";
import { contactTemplate } from "../services/templates/Mail/contactUs.js"
import { sendMailContact } from "../config/mailer.js";
export class AuthController {
  constructor(notificationService) {
    this.notificationService = notificationService;

    this.Login = this.Login.bind(this);
    this.Register = this.Register.bind(this);
    this.VerifierOtp = this.VerifierOtp.bind(this);
    this.ForgotPassword = this.ForgotPassword.bind(this);
    this.Logout = this.Logout.bind(this);
  }

  async Login(req, res) {
    try {
      const { email, mot_de_passe } = req.body;

      if (!email || !mot_de_passe) {
        return res.status(400).json({ error: "Email et mot de passe requis" });
      }

      const candidat = await prisma.candidat.findUnique({ where: { email } });

      if (!candidat) {
        return res.status(404).json({ error: "Candidat non trouvé" });
      }

      if (candidat.statut_compte !== "ACTIF") {
        return res
          .status(401)
          .json({ error: "Veuillez vérifier votre compte pour continuer" });
      }

      const motDePasseCorrect = await bcrypt.compare(
        mot_de_passe,
        candidat.mot_de_passe,
      );

      if (!motDePasseCorrect) {
        return res.status(401).json({ error: "Mot de passe incorrect" });
      }

      const token = jwt.sign(
        { id: candidat.id_candidat, email: candidat.email, role: "candidat" },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      );
      console.log("Token généré:", token); 
      console.log("process jwt:", process.env.JWT_SECRET); 
      
      res.json({ message: "Connexion réussie", token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }

  async Register(req, res) {
    try {
      const {
        nom,
        prenom,
        nom_jeune_fille,
        sexe,
        date_naissance,
        lieu_naissance,
        pays_naissance,
        numero_cnib,
        date_delivrance,
        telephone,
        email,
        mot_de_passe,
        matricule,
        emploi,
        ministere,
        choix,
      } = req.body;

      const existant = await prisma.candidat.findFirst({
        where: { OR: [{ email }, { numero_cnib }] },
      });

      if (existant) {
        return res.status(409).json({
          error:
            existant.email === email
              ? "Email déjà utilisé"
              : "Numéro CNIB déjà utilisé",
        });
      }

      const motDePasseHashe = await bcrypt.hash(mot_de_passe, 10);
      const otp = this.notificationService.genererOtp();
      const otp_expire_at = new Date(Date.now() + 10 * 60 * 1000);

      const candidat = await prisma.$transaction(async (tx) => {
        const nouveau = await tx.candidat.create({
          data: {
            nom,
            prenom,
            nom_jeune_fille,
            sexe,
            date_naissance: new Date(date_naissance),
            lieu_naissance,
            pays_naissance,
            numero_cnib,
            date_delivrance: date_delivrance ? new Date(date_delivrance) : null,
            telephone,
            email,
            mot_de_passe: motDePasseHashe,
            statut_compte: "INACTIF",
            // otp,
            // otp_expire_at,
          },
        });

        if (matricule) {
          await tx.candidat_professionnel.create({
            data: {
              id_candidat: nouveau.id_candidat,
              matricule,
              emploi,
              ministere,
            },
          });
        }

        return nouveau;
      });

      // Assigner email et telephone au service avant envoi
      this.notificationService.email = candidat.email;
      this.notificationService.telephone = candidat.telephone;

      switch (choix) {
        case "sms":
          await this.notificationService.envoyerOtpTelephone(otp);
          break;
        case "mail":
        default:
          await this.notificationService.envoyerOtpEmail(otp);
          break;
      }

      res.status(201).json({
        message: "Compte créé, code OTP envoyé",
        candidat: {
          id_candidat: candidat.id_candidat,
          nom: candidat.nom,
          prenom: candidat.prenom,
          email: candidat.email,
        },
      });
    } catch (err) {
      console.error(err);
      if (err.code === "P2002") {
        return res.status(409).json({ error: "Email ou CNIB déjà utilisé" });
      }
      res.status(500).json({ error: "Erreur serveur" });
    }
  }

  async VerifierOtp(req, res) {
    try {
      const { email, otp } = req.body; // pas req.body()

      const candidat = await prisma.candidat.findUnique({ where: { email } });

      if (!candidat) {
        return res.status(404).json({ error: "Adresse mail introuvable" });
      }

      if (!candidat.otp_expire_at || new Date() > candidat.otp_expire_at) {
        return res.status(400).json({ error: "OTP expiré" });
      }

      if (candidat.otp !== otp) {
        return res.status(400).json({ error: "OTP incorrect" });
      }

      await prisma.candidat.update({
        where: { email },
        data: { statut_compte: "ACTIF", otp: null, otp_expire_at: null },
      });

      res
        .status(200)
        .json({ message: "Vérification réussie, vous pouvez vous connecter" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // mots de passe oublier .. methode pour recuperer le mots de passe (demander un code Otp)

  async ForgotPassword(req, res) {
    try {
      const { email, telephone, choix } = req.body; 

      let candidat;

      if (choix === "sms") {
        candidat = await prisma.candidat.findFirst({ where: { telephone } });
      } else {
        candidat = await prisma.candidat.findUnique({ where: { email } });
      }

      if (!candidat) {
        return res.status(404).json({
          error:
            choix === "sms"
              ? "Aucun compte associé à ce numéro"
              : "Aucun compte associé à cet email",
        });
      }

      const otp = this.notificationService.genererOtp();
      const otp_expire_at = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.candidat.update({
        where: { id_candidat: candidat.id_candidat },
        data: { otp, otp_expire_at },
      });

      this.notificationService.email = candidat.email;
      this.notificationService.telephone = candidat.telephone;

      switch (choix) {
        case "sms":
          await this.notificationService.envoyerOtpTelephone(otp);
          break;
        case "mail":
        default:
          await this.notificationService.envoyerOtpEmail(otp);
          break;
      }

      res.json({
        message: "Code OTP envoyé pour réinitialisation du mot de passe",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // mots de passe oublier .. methode pour recuperer le mots de passe (changer le password)

  async ResetPassword(req, res) {
    const { mot_de_passe, otp, telephone, email, choix } = req.body();

    let candidat;

    if (choix === "sms") {
      candidat = await prisma.candidat.findFirst({ where: { telephone } });
    } else {
      candidat = await prisma.candidat.findUnique({ where: { email } });
    }

    if (!candidat) {
      return res.status(404).json({
        error:
          choix === "sms"
            ? "Aucun compte associé à ce numéro"
            : "Aucun compte associé à cet email",
      });
    }

    if (candidat.otp !== otp)
      return res.status(400).json({ error: "code otp incorrect" });

    const mdphash = await bcrypt.hash(mot_de_passe, 10);

    const UpdateCandidat = await prisma.candidat.$transaction(async (tx) => {
      const updatedC = await tx.candidat.update({
        where: { id: candidat.id_candidat },
        data: {
          mot_de_passe: mdpHash,
          otp: null,
        },
      });
      updatedC();
    });

    return res
      .status(200)
      .json({
        message: `Bonjour ${UpdateCandidat.nom} {votre mots de passe a ete reinitialiser}`,
      });
  }


async ContactUS(req, res) {
  try {
    const { email, message, nom } = req.body;


    // le template est a refaire j'utilise un template de test
    
    const html = contactTemplate({nom,email,message})

    await sendMailContact({
      to: process.env.MAIL_USER, 
      subject: "Nouveau message de contact",
      html,
      email, 
    });

    return res.status(200).json({
      message: "Message envoyé avec succès",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erreur serveur",
    });
  }
}
   async Logout(req, res) {
    res.json({ message: "Déconnexion réussie" });
  }
}
