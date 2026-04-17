import { prisma } from "../prisma.js";
import { generateReceipt } from "../services/Upload-file.service.js";

export class InscriptionController {
  static async sInscrire(req, res) {
    try {
      const { id_candidat } = req.user;
      //  console.log(id_candidat)
      const { id_concours, id_centre } = req.body;

      if (!id_concours || isNaN(id_concours)) {
        return res.status(400).json({ error: "reference du concours invalide" });
      }


      if (!id_centre || isNaN(id_centre)) {
        return res.status(400).json({ error: "reference du cennre invalide" });
      }


      const concours = await prisma.concours.findUnique({
        where: { id_concours },
        select: {
          id_concours: true,
          date_debut:true,
          date_fin:true,
          statut_concours:true,
          nom: true,
          centres: {
            select: {
              centre: {
                select: {
                  id_centre: true,
                  nom: true,
                },
              },
            },
          },
        },
      });
      if (!concours) {
        return res.status(404).json({ error: "Concours introuvable" });
      }

      const centreValide = concours?.centres.some(
        (c) => c.centre.id_centre === id_centre,
      );
      if (!centreValide) {
        return res
          .status(400)
          .json({ error: "Ce centre n'est pas associé à ce concours" });
      }

      if (concours.statut_concours !== "OUVERT") {
        return res.status(400).json({
          error: "Ce concours n'est plus ouvert aux inscriptions",
        });
      }

      const aujourd_hui = new Date().toLocaleDateString('fr-FR');
      const debut = (concours.date_debut).toLocaleDateString('fr-FR')
      const fin = (concours.date_fin).toLocaleDateString('fr-FR')
      // console.log( aujourd_hui )
      if (
        aujourd_hui < debut ||
        aujourd_hui > fin
      ) {
        return res.status(400).json({
          error: "La période d'inscription est fermée",
        });
      }

      const dejaInscrit = await prisma.inscription.findFirst({
        where: { id_candidat, id_concours },
      });

      if (dejaInscrit) {
        const messageStatut =
          dejaInscrit.statut_inscription === "VALIDEE"
            ? "Vous êtes déjà inscrit et votre paiement est validé"
            : "Vous avez déjà une inscription en attente de paiement";

        return res.status(409).json({
          error: messageStatut,
          id_inscription: dejaInscrit.id_inscription,
        });
      }

      const inscription = await prisma.inscription.create({
        data: {
          id_candidat,
          id_concours,
          id_centre,
          statut_inscription: "EN_ATTENTE",
        },
        select: {
          id_inscription: true,
          date_inscription: true,
          statut_inscription: true,
          concours: {
            select: {
              nom: true,
              frais_inscription: true,
            },
          },
        },
      });

      return res.status(201).json({
        message: "Inscription créée , en attente de paiement",
        data: {
          id_inscription: inscription.id_inscription,
          date_inscription: inscription.date_inscription,
          statut_inscription: inscription.statut_inscription,
          concours: inscription.concours,
          prochaine_etape: "Effectuez le paiement pour confirmer votre dossier",
        },
      });
    } catch (err) {
      console.error(err);
      if (err.code === "P2002") {
        return res.status(409).json({
          error: "Vous êtes déjà inscrit à ce concours",
        });
      }
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async getInscription(req, res) {
    try {
      const {id_candidat} = req.user;
      const id_inscription = parseInt(req.params.id_inscription);

      if (isNaN(id_inscription)) {
        return res.status(400).json({ error: "id_inscription invalide" });
      }

      // verifier si l'inscriptions l'appartient bien 

      

      const inscription = await prisma.inscription.findFirst({
        where: { id_inscription, id_candidat },
        select: {
          id_inscription: true,
          date_inscription: true,
          statut_inscription: true,
          id_candidat:true,
          concours: {
            select: {
              nom: true,
              type: true,
              frais_inscription: true,
              date_debut: true,
              date_fin: true,
            },
          },
          paiement: {
            select: {
              statut_paiement: true,
              mode_paiement: true,
              montant: true,
              reference_transaction: true,
              date_paiement: true,
            },
            orderBy: { date_paiement: "desc" },
            take: 1,
          },
        },
      });

      if (!inscription) {
        return res.status(404).json({ error: "Inscription introuvable" });
      }

      if (inscription.id_candidat !== id_candidat){
        return res.status(200).json('text reussi')
      }

      const paiement = inscription.paiement[0] ?? null;

      return res.status(200).json({
        message: "Inscription récupérée",
        data: {
          id_inscription: inscription.id_inscription,
          date_inscription: inscription.date_inscription,
          statut_inscription: inscription.statut_inscription,
          concours: inscription.concours,
          paiement,
          recepisse_disponible: paiement?.statut_paiement === "REUSSI",
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  static async GetRecippiser(req, res) {
    try {
      const { id_inscription } = req.body;
      const { id_candidat } = req.user;

      const inscription = await prisma.inscription.findFirst({
        where: { id_inscription, id_candidat },
        select: {
          id_inscription: true,
          statut_inscription: true,
          candidat: {
            select: {
              nom: true,
              prenom: true,
              date_naissance: true,
              lieu_naissance: true,
              sexe: true,
              numero_cnib: true,
              telephone: true,
              email:true
            },
          },
          concours: {
            select: {
              id_concours: true,
              nom: true,
            
            },
          },
          centre:{
            select:{
              nom:true
            }
          }
        },
      });

      if (!inscription)
        return res
          .status(404)
          .json({ error: "Aucune inscriptions trouvees veuillez ressayer" });

      if (inscription.statut_inscription !== "VALIDEE")
        return res
          .status(400)
          .json({
            error:
              "effectuer le paiement avant de pouvoir telecharger le recepisser",
          });

        const numero_recepisse = `CONC-${inscription.concours.id_concours}-${inscription.candidat.sexe === 'FEMME' ? 'F' :'H'}-${inscription.id_inscription}`;

      const data = {
        centre: inscription.centre.nom,
        concours: inscription.concours.nom,
        nom: inscription.candidat.nom,
        prenom: inscription.candidat.prenom,
        date_naissance: new Date(
          inscription.candidat.date_naissance,
        ).toLocaleDateString("fr-FR"),
        lieu_naissance: inscription.candidat.lieu_naissance,
        sexe: inscription.candidat.sexe,
        cnib: inscription.candidat.numero_cnib,
        telephone: inscription.candidat.telephone,
        email:inscription.candidat.email,
        concoursID: inscription.concours.id_concours,
        numero_dossier:numero_recepisse,
        date_inscription: new Date().toLocaleDateString("fr-FR"),
        

        qr: JSON.stringify({
          centre: inscription.centre.nom,
          nom: inscription.candidat.nom,
          prenom: inscription.candidat.prenom,
          concoursID: inscription.concours.id_concours,
        }),
      };

      await generateReceipt(data, res);
    } catch (err) {
      console.log(err);
    }
  }

  static async MesInscriptions (req,res){
    try{
      const {id_candidat} = req.user;
      const limit = 10;
      const page = parseInt(req.params.page) || 1;
      const skip = (page-1)*limit;

      // verifier si le user existe 

      const candidat = await prisma.candidat.findUnique({where:{id_candidat}});
      if(!candidat) return res.status(404).json({error:'aucun candidat trouve{}'});

      // recuperer les inscriptions liees a cet candiat 

      const [inscriptions, total]= await Promise.all([
        await prisma.inscription.findMany({
          take:limit,
          skip,
          where:{
          id_candidat:id_candidat
        }}),
        await prisma.inscription.count({
          where:{id_candidat:id_candidat}
        })
      ]);
      // console.log(JSON.stringify(inscriptions), total)

      if(!inscriptions) return res.status(404).json({message:'vous n\'avez pas encore d\'inscription veuillez vous inscrire'});

      return res.status(200).json({
        data:inscriptions,
        page:page,
        totatl:total,
        pageTot : Math.ceil(total/limit)
      })
    }
    catch(err){
      console.log('erreur',err);
      return res.status(500).json({error:'Une erreur est survenue'})
    }
  }
}
