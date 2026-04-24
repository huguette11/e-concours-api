import { prisma }         from "../prisma.js";
import bcrypt             from "bcrypt";
import jwt                from "jsonwebtoken";
import { contactTemplate } from "../services/templates/Mail/contactUs.js";
import { sendMailContact } from "../config/mailer.js";
import { connection }      from "../config/redis.js";

export class AuthController {
  constructor(notificationService) {
    this.notificationService = notificationService;

    this.Login          = this.Login.bind(this);
    this.Register       = this.Register.bind(this);
    this.VerifierOtp    = this.VerifierOtp.bind(this);
    this.ForgotPassword = this.ForgotPassword.bind(this);
    this.ResetPassword  = this.ResetPassword.bind(this);
    this.Logout         = this.Logout.bind(this);
    this.ResendOtp      = this.ResendOtp.bind(this);
    this.VerifieNumber  = this.VerifieNumber.bind(this);
    this.ContactUS      = this.ContactUS.bind(this);
  }

  async VerifieNumber(req, res) {
    try {
      const { tel } = req.body;
      const cachekey = `verif-${tel}`;
      this.notificationService.telephone = tel;
       const otp = this.notificationService.genererOtp();
      const otp_expiration = new Date(Date.now() + 10 * 60 * 1000);

      const candidat = await prisma.candidat.findFirst({
        where: { telephone: tel },
      });

      if (!candidat) {
        return res.status(404).json({ error: "Numéro non trouvé" });
      }

      await prisma.candidat.update({
        where: { id_candidat: candidat.id_candidat },
        data: { otp, otp_expiration },
      });

      this.notificationService.telephone = tel;
      await this.notificationService.envoyerOtpTelephone(otp);

      return res.status(200).json({ message: "OTP envoyé" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  async Login(req, res) {
    try {
      const { telephone, mot_de_passe } = req.body;

      if (!telephone || !mot_de_passe) {
        return res.status(400).json({
          error: "Téléphone et mot de passe requis",
        });
      }

      const candidat = await prisma.candidat.findFirst({
        where: { telephone },
      });

      if (!candidat) {
        return res.status(401).json({ error: "Identifiants incorrects" });
      }

      const motDePasseCorrect = await bcrypt.compare(
        mot_de_passe,
        candidat.mot_de_passe,
      );

      if (!motDePasseCorrect) {
        return res.status(401).json({ error: "Identifiants incorrects" });
      }

      const token = jwt.sign(
        { id: candidat.id_candidat, email: candidat.email, role: "candidat" },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      );

      return res.status(200).json({ message: "Connexion réussie", token });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  async Register(req, res) {
    try {
      const {
        nom, prenom, nom_jeune_fille, sexe,
        date_naissance, lieu_naissance, pays_naissance,
        numero_cnib, date_delivrance, telephone, email,
        mot_de_passe, matricule, emploi, ministere, choix,
      } = req.body;

      if (!telephone) {
        return res.status(400).json({
          error: "Le numéro de téléphone est obligatoire",
        });
      }

      const conditions = [{ numero_cnib }, { telephone }];
      if (email) conditions.push({ email });

      const existant = await prisma.candidat.findFirst({
        where: { OR: conditions },
      });

      if (existant) {
        let message = "Numéro CNIB déjà utilisé";
        if (existant.telephone === telephone) message = "Téléphone déjà utilisé";
        if (email && existant.email === email) message = "Email déjà utilisé";
        return res.status(409).json({ error: message });
      }

      const motDePasseHashe = await bcrypt.hash(mot_de_passe, 10);
      const otp             = this.notificationService.genererOtp();
      const otp_expiration  = new Date(Date.now() + 10 * 60 * 1000);
      const choixFinal      = !email ? "sms" : (choix ?? "sms");

      const candidat = await prisma.candidat.create({
        data: {
          nom, prenom,
          nom_jeune_fille:    nom_jeune_fille ?? null,
          sexe,
          date_naissance:     new Date(date_naissance),
          lieu_naissance,
          pays_naissance,
          numero_cnib,
          date_delivrance:    date_delivrance ? new Date(date_delivrance) : null,
          telephone,
          email:              email ?? null,
          mot_de_passe:       motDePasseHashe,
          statut_compte:      "INACTIF",
          type_candidat:      matricule ? "PROFESSIONNEL" : "DIRECT",
          matricule:          matricule ?? null,
          emploi:             emploi    ?? null,
          ministere:          ministere ?? null,
          choix_notification: choixFinal,
          otp,
          otp_expiration,
        },
      });

      this.notificationService.email     = candidat.email;
      this.notificationService.telephone = candidat.telephone;

      if (choixFinal === "sms") {
        await this.notificationService.envoyerOtpTelephone(otp);
      } else {
        await this.notificationService.envoyerOtpEmail(otp);
      }

      const token = jwt.sign(
        { id: candidat.id_candidat, email: candidat.email, role: "candidat" },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      );

      return res.status(201).json({
        message: choixFinal === "sms"
          ? "Compte créé — OTP envoyé par SMS"
          : "Compte créé — OTP envoyé par email",
        candidat: { nom: candidat.nom, prenom: candidat.prenom, token },
      });

    } catch (err) {
      console.error(err);
      if (err.code === "P2002") {
        return res.status(409).json({ error: "Email, téléphone ou CNIB déjà utilisé" });
      }
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  async VerifierOtp(req, res) {
    try {
      const { otp }         = req.body;
      const { id_candidat } = req.user;

      const candidat = await prisma.candidat.findUnique({
        where: { id_candidat },
      });

      if (!candidat) {
        return res.status(404).json({ error: "Candidat introuvable" });
      }

      if (!candidat.otp_expiration || new Date() > candidat.otp_expiration) {
        return res.status(400).json({ error: "OTP expiré" });
      }

      if (candidat.otp !== otp) {
        return res.status(400).json({ error: "OTP incorrect" });
      }

      await prisma.candidat.update({
        where: { id_candidat },
        data:  { statut_compte: "ACTIF", otp: null, otp_expiration: null },
      });

      return res.status(200).json({
        message: "Vérification réussie, vous pouvez vous connecter",
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  async ResendOtp(req, res) {
    try {
      const { email, telephone } = req.body;

      if (!email && !telephone) {
        return res.status(400).json({ error: "Email ou téléphone requis" });
      }

      const candidat = await prisma.candidat.findFirst({
        where: email ? { email } : { telephone },
      });

      if (!candidat) {
        return res.status(404).json({ error: "Candidat introuvable" });
      }

      const otp            = this.notificationService.genererOtp();
      const otp_expiration = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.candidat.update({
        where: { id_candidat: candidat.id_candidat },
        data:  { otp, otp_expiration },
      });

      this.notificationService.email     = candidat.email;
      this.notificationService.telephone = candidat.telephone;

      if (candidat.choix_notification === "sms") {
        await this.notificationService.envoyerOtpTelephone(otp);
      } else {
        await this.notificationService.envoyerOtpEmail(otp);
      }

      const token = jwt.sign(
        { id: candidat.id_candidat, email: candidat.email, role: "candidat" },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      );

      return res.status(200).json({
        message: candidat.choix_notification === "sms"
          ? "OTP renvoyé par SMS"
          : "OTP renvoyé par email",
        token,
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  async ForgotPassword(req, res) {
    try {
      const { email, telephone } = req.body;

      if (!email && !telephone) {
        return res.status(400).json({ error: "Email ou téléphone requis" });
      }

      const candidat = await prisma.candidat.findFirst({
        where: email ? { email } : { telephone },
      });

      if (!candidat) {
        return res.status(404).json({ error: "Aucun compte trouvé" });
      }

      const otp            = this.notificationService.genererOtp();
      const otp_expiration = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.candidat.update({
        where: { id_candidat: candidat.id_candidat },
        data:  { otp, otp_expiration },
      });

      this.notificationService.email     = candidat.email;
      this.notificationService.telephone = candidat.telephone;

      if (candidat.choix_notification === "sms") {
        await this.notificationService.envoyerOtpTelephone(otp);
      } else {
        await this.notificationService.envoyerOtpEmail(otp);
      }

      return res.status(200).json({
        message: candidat.choix_notification === "sms"
          ? "OTP envoyé par SMS"
          : "OTP envoyé par email",
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  async ResetPassword(req, res) {
    try {
      const { mot_de_passe, otp } = req.body; // ← plus de parenthèses
      const { id_candidat }       = req.user;

      const candidat = await prisma.candidat.findUnique({
        where: { id_candidat },
      });

      if (!candidat) {
        return res.status(404).json({ error: "Candidat introuvable" });
      }

      if (candidat.otp !== otp) {
        return res.status(400).json({ error: "Code OTP incorrect" });
      }

      const mdphash = await bcrypt.hash(mot_de_passe, 10);

      const updated = await prisma.$transaction(async (tx) => {
        return await tx.candidat.update({
          where: { id_candidat: candidat.id_candidat },
          data: {
            mot_de_passe:   mdphash,
            otp:            null,
            otp_expiration: null,
          },
        });
      });

      return res.status(200).json({
        message: `Bonjour ${updated.nom}, votre mot de passe a été réinitialisé`,
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  async ContactUS(req, res) {
    try {
      const { email, message, nom } = req.body;
      const html = contactTemplate({ nom, email, message });
      await sendMailContact({
        to:      process.env.MAIL_USER,
        subject: "Nouveau message de contact",
        html,
        email,
      });
      return res.status(200).json({ message: "Message envoyé avec succès" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  async Logout(req, res) {
    return res.status(200).json({ message: "Déconnexion réussie" });
  }
}