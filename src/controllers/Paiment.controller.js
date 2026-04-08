import prisma from "../prisma";
import { paiementService } from "../services/Paiement.service";

export class PaimentController {

  static async Init(req, res) {
    const { id_concours, id_candidat, id_inscription } = req.body;
    const [concours, candidat, inscription, paiemtnExists] = await Promise.all([
      prisma.concours.findUnique({ where: { id_concours } }),
      prisma.candidat.findUnique({ where: { id_candidat } }),
      prisma.inscription.findUnique({
        where: { id_inscription },
        select: {
          candidat: {
            select: {
              id_candidat: true,
            },
          },
          concours: {
            select: {
              id_concours: true,
            },
          },
        },
      }),
      prisma.paiement.findUnique({ where: { id_inscription } }),
    ]);

    /// si une donne manque le paiement est rejeter
    if (!concours || !candidat || !inscription) {
      return res.status(404).json({
        error: "une erreur est sruvenue lors du paiement veuillez ressayer",
      });
    }

    // verifier maintenant si les donner concordes vraiement avec les id et tous

    if (
      inscription.candidat.id_candidat !== id_candidat ||
      inscription.concours.id_concours !== id_concours
    ) {
      return res
        .status(403)
        .json({ error: "les donnees ne correspondent pas" });
    }

    if (concours.statut_concours !== "ouvert") {
      return res.status(40).json({ error: "Concours indispobible" });
    }

    if (paiemtnExists.statut_paiement === "reussi") {
      return res.status(409).json({ error: "paiement deja effectuer" });
    }

    // initialiser le paiement depuis le paiement service et coller ces tous
    const azerka = new paiementService();
    const pay = azerka.ArkzekaPay({telephone,otp});

    if(pay.status && pay.status === 'success' && pay.reference){
        
    }

  }

  static async Callback(req, res) {}
}
