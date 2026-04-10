import { hash } from "bcrypt";
import { YengaPay } from "../api/Yenga.api.js";
import { prisma } from "../prisma.js";

export class PaiementController {
static async Init(req, res) {
  try {
    const { id_concours, id_inscription } = req.body;
    const {id_candidat} = req.user;

    const [concours, candidat, inscription, paiementExists] = await Promise.all([
      prisma.concours.findUnique({ where: { id_concours } }),
      prisma.candidat.findUnique({ where: { id_candidat } }),
      prisma.inscription.findUnique({
        where: { id_inscription },
        select: {
          candidat: { select: { id_candidat: true } },
          concours: { select: { id_concours: true } },
        },
      }),
      prisma.paiement.findFirst({ where: { id_inscription } }),
    ]);

    // Vérification des données
    if (!concours || !candidat || !inscription) {
      return res.status(404).json({
        error: "Une erreur est survenue lors du paiement, veuillez réessayer",
      });
    }

    if (
      inscription.candidat.id_candidat !== id_candidat ||
      inscription.concours.id_concours !== id_concours
    ) {
      return res.status(403).json({ error: "Les données ne correspondent pas" });
    }

    if (concours.statut_concours !== "OUVERT") {
      return res.status(400).json({ error: "Concours indisponible" });
    }

    if (paiementExists?.statut_paiement === "REUSSI") {
      return res.status(409).json({ error: "Paiement déjà effectué" });
    }

    // Initialiser le paiement via YengaPay
    const reference = `CONC-${id_concours}-CAND-${id_candidat}-INS-${id_inscription}-${Date.now()}`;
    const yenga = new YengaPay({
      title: `Frais inscription ${concours.nom}` ,
      description: "Paiement de l'inscription",
      price: 800,
      reference: reference,
      redirectUrl: process.env.YENGA_REDIRECT_URL,
    });

    const resultat = await yenga.YengaPayPayment();

    // Créer ou mettre à jour le paiement
    await prisma.paiement.upsert({
      where: { reference_transaction: reference },
      update: {
        reference_transaction: reference,
        mode_paiement: resultat.data?.operatorOptionsSnapshot?.name ?? null,
        statut_paiement: "ATTENTE",
      },
      create: {
        id_inscription,

        montant: concours.frais_inscription ?? 800,
        statut_paiement: "ATTENTE",
        reference_transaction: reference,
        mode_paiement: resultat.data?.operatorOptionsSnapshot?.name ?? null,
      },
    });

    return res.status(200).json({
      url_paiement: resultat.payment_url,
      resultat,
    });

  } catch (err) {
    console.error("Erreur Init paiement :", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
  static async Callback(req, res) {
    try {
      const hash = req.headers["x-webhook-hash"];
      if (!hahs) {
        return;
      }
      const webhookSecret = process.env.webhook;
      const data = req.body;

      const payload = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(data))
        .digest("hex");

      if (payload !== hash) {
        return res.status(400).json({error:'les hash ne correspondent pas'})
      }
      const { reference, status } = data;
      if (!reference || !status) {
        return res.status(400).json({error:'les references ne correspondent pas'})
      }

      const paiement = await prisma.paiement.findFirst({
        where: { reference_transaction: reference },
      });

      if (!paiement) {
        res.status(404).json({error:'aucun paiement affilier'})
      }

      if (paiement.statut_paiement === "REUSSI") {
        return;
      }

      await prisma.paiement.update({
        where: { id_paiement: paiement.id_paiement },
        data: {
          statut_paiement: status,
          payment_id: paymentId ?? paiement.payment_id,
          date_paiement: status === "REUSSI" ? new Date() : undefined,
        },
      });

      if (status === "REUSSI") {
        await prisma.inscription.update({
          where: { id_inscription: paiement.id_inscription },
          data: { statut_inscription: "VALIDEE" },
        });
      }

      return res.status(200).json({ received: true });
    } catch (err) {

      console.log('une erreur est survenue', err)
    }
  }
}
