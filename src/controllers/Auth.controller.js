import { prisma } from "../prisma.js";
import bcrypt from "bcrypt";
import { response } from "express";
import jwt from "jsonwebtoken";
import { contactTemplate } from "../services/templates/Mail/contactUs.js";
import { sendMailContact } from "../config/mailer.js";
import { connection } from "../config/redis.js";
export class AuthController {
  constructor(notificationService) {
    this.notificationService = notificationService;

    this.Login = this.Login.bind(this);
    this.Register = this.Register.bind(this);
    this.VerifierOtp = this.VerifierOtp.bind(this);
    this.ForgotPassword = this.ForgotPassword.bind(this);
    this.Logout = this.Logout.bind(this);
    this.ResendOtp = this.ResendOtp.bind(this);
    this.VerifieNumber = this.VerifieNumber.bind(this);
  }

  async VerifieNumber(req, res) {
    try {
      const { tel } = req.body;
      const cachekey = `verif-${tel}`;
      this.notificationService.telephone = tel;
      const otp = this.notificationService.genererOtp();
      await connection.set(cachekey, JSON.stringify(cachekey));
      await this.notificationService.envoyerOtpEmail(otp);
    } catch (err) {
      console.log("erreur", err);
    }
  }

  async Login(req, res) {
    try {
      const { telephone, mot_de_passe } = req.body;

      if (!telephone || !mot_de_passe) {
        return res
          .status(400)
          .json({ error: "telephone et mot de passe requis" });
      }

      const candidat = await prisma.candidat.findFirst({
        where: { telephone:telephone },
      });

      if (!candidat) {
        return res.status(404).json({ error: "Candidat non trouvé" });
      }

      // if (candidat.statut_compte !== "ACTIF") {
      //   return res
      //     .status(401)
      //     .json({ error: "Veuillez vérifier votre compte pour continuer" });
      // }

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
            otp,
            otp_expiration: otp_expire_at,
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
          await this.notificationService.envoyerOtpEmail(otp);
        default:
          await this.notificationService.envoyerOtpEmail(otp);
          break;
      }

      const refreshToken = jwt.sign(
        {
          id: candidat.id_candidat,
          email: candidat.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      );
      res.status(201).json({
        message: "Compte créé, code OTP envoyé",
        candidat: {
          nom: candidat.nom,
          token: refreshToken,
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
      const { otp } = req.body;

      const { id_candidat } = req.user;

      const candidat = await prisma.candidat.findUnique({
        where: { id_candidat },
      });

      if (!candidat) {
        return res.status(404).json({ error: "Adresse mail introuvable" });
      }

      if (!candidat.otp_expiration || new Date() > candidat.otp_expiration) {
        return res.status(400).json({ error: "OTP expire" });
      }

      if (candidat.otp !=otp) {
        console.log("OTP fourni:", otp);
        console.log("OTP attendu:", candidat.otp);
        return res.status(400).json({ error: "OTP incorrect" });
      }

      await prisma.candidat.update({
        where: { id_candidat },
        data: { statut_compte: "ACTIF", otp: null, otp_expiration: null },
      });

      return res
        .status(200)
        .json({ message: "Vérification réussie, vous pouvez vous connecter" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  async ResendOtp(req, res) {
    try {
      const { email } = req.body;

      const candidat = await prisma.candidat.findUnique({ where: { email } });
      if (!candidat) {
        return res.status(404).json({ error: "candidat non trouver" });
      }
      this.notificationService.email = candidat.email;
      this.notificationService.telephone = candidat.telephone;
      const otp = this.notificationService.genererOtp();
      await this.notificationService.envoyerOtpEmail(otp);

      // const otp = this.notificationService.genererOtp();
      const otp_expire_at = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.candidat.update({
        where: { email },
        data: {
          otp: otp,
          otp_expiration: otp_expire_at,
        },
      });
      const refreshToken = jwt.sign(
        {
          id: candidat.id_candidat,
          email: candidat.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      );

      return res.status(200).json({
        message: "code de verification envoyer avec succes",
        token: refreshToken,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "une erreur est survenue" });
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
        data: { otp, otp_expiration: otp_expire_at },
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
    const { mot_de_passe, otp } = req.body();
    const { id_candidat } = req.user;
    const candidat = await prisma.candidat.findUnique({
      where: { id_candidat },
    });

    // if (choix === "sms") {
    //   candidat = await prisma.candidat.findFirst({ where: { telephone } });
    // } else {
    //   candidat = await prisma.candidat.findUnique({ where: { email } });
    // }

    if (!candidat) {
      return res.status(404).json({
        error: "Aucun compte  trouve",
      });
    }

    if (candidat.otp !== otp)
      return res.status(400).json({ error: "code otp incorrect" });

    const mdphash = await bcrypt.hash(mot_de_passe, 10);

    const UpdateCandidat = await prisma.candidat.$transaction(async (tx) => {
      const updatedC = await tx.candidat.update({
        where: { id: candidat.id_candidat },
        data: {
          mot_de_passe: mdphash,
          otp: null,
          otp_expiration: null,
        },
      });
      return updatedC;
    });

    return res.status(200).json({
      message: `Bonjour ${UpdateCandidat.nom} {votre mots de passe a ete reinitialiser}`,
    });
  }

  async ContactUS(req, res) {
    try {
      const { email, message, nom } = req.body;

      // le template est a refaire j'utilise un template de test

      const html = contactTemplate({ nom, email, message });

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
