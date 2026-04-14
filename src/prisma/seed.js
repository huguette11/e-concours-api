import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Démarrage du seed...");

  // --- ADMIN ---
  let admin = await prisma.admin.findUnique({
    where: { email: "admin@econcours.gov.bf" },
  });

  if (!admin) {
    admin = await prisma.admin.create({
      data: {
        nom: "Admin",
        prenom: "Super",
        email: "admin@econcours.gov.bf",
        mot_de_passe: await bcrypt.hash("Admin@1234", 10),
        telephone: "70000000",
        role: "SUPERADMIN",
        actif: true,
      },
    });
  }

  // --- CENTRES ---
  const centresData = [
    "Ouagadougou",
    "Bobo-Dioulasso",
    "Koudougou",
    "Banfora",
    "Ouahigouya",
    "Dédougou",
    "Fada N'Gourma",
    "Tenkodogo",
  ];

  const centres = [];
  for (const nom of centresData) {
    let centre = await prisma.centre.findFirst({ where: { nom } });
    if (!centre) centre = await prisma.centre.create({ data: { nom } });
    centres.push(centre);
  }

  // --- CATEGORIES ---
  const categoriesData = [
    { libelle: "Fonction Publique", description: "Concours de la fonction publique" },
    { libelle: "Militaire", description: "Concours des forces armées" },
    { libelle: "Paramédical", description: "Concours du secteur de la santé" },
    { libelle: "Enseignement", description: "Concours pour le corps enseignant" },
    { libelle: "Police Nationale", description: "Concours de la police nationale" },
    { libelle: "Douanes", description: "Concours des douanes" },
    { libelle: "Eaux et Forêts", description: "Concours des eaux et forêts" },
    { libelle: "Justice", description: "Concours du ministère de la justice" },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    let categorie = await prisma.categorieConcours.findFirst({
      where: { libelle: cat.libelle },
    });
    if (!categorie) categorie = await prisma.categorieConcours.create({ data: cat });
    categories.push(categorie);
  }

  // --- CONCOURS ---
  const concoursData = [
    {
      nom: "Concours Agents de Santé 2025",
      type: "DIRECT",
      description: "Recrutement d'agents paramédicaux pour les hôpitaux nationaux.",
      frais_inscription: 5000,
      nombre_postes: 200,
      annee: 2025,
      date_debut: new Date("2025-03-01"),
      date_fin: new Date("2025-04-30"),
      statut_concours: "OUVERT",
      categorieId: categories[2].id,
      centreIds: [centres[0].id_centre, centres[1].id_centre, centres[2].id_centre],
    },
    {
      nom: "Concours Enseignants du Primaire 2025",
      type: "DIRECT",
      description: "Recrutement d'instituteurs pour les écoles primaires publiques.",
      frais_inscription: 3000,
      nombre_postes: 500,
      annee: 2026,
      date_debut: new Date("2026-05-01"),
      date_fin: new Date("2026-06-30"),
      statut_concours: "OUVERT",
      categorieId: categories[3].id,
      centreIds: [centres[0].id_centre, centres[1].id_centre],
    },
  ];

  const concoursList = [];
  for (const { centreIds, ...fields } of concoursData) {
    let concours = await prisma.concours.findFirst({ where: { nom: fields.nom } });
    if (!concours) {
      concours = await prisma.concours.create({
        data: {
          ...fields,
          id_admin: admin.id_admin,
          centres: {
            create: centreIds.map((id_centre) => ({
              centre: { connect: { id_centre } },
            })),
          },
        },
      });
    }
    concoursList.push(concours);
  }

  // --- CANDIDAT ---
  let candidat = await prisma.candidat.findFirst({
    where: { email: "johndoe@example.com" },
  });

if (!candidat) {
  candidat = await prisma.candidat.create({
    data: {
      nom: "Doe",
      prenom: "John",
      sexe: "HOMME",
      date_naissance:  new Date("1990-01-01"),
      lieu_naissance:  "Ouagadougou",
      pays_naissance:  "Burkina Faso",
      numero_cnib:     "B123456789",
      date_delivrance: new Date("2015-06-15"),
      telephone:       "+22670000000",
      email:           "johndoe@example.com",
      mot_de_passe:    await bcrypt.hash("Password@123", 10),
    },
  });
}
  // --- INSCRIPTION DU CANDIDAT DANS TOUS LES CONCOURS OUVERTS ---
  for (const concours of concoursList) {
    const exists = await prisma.inscription.findFirst({
      where: {
        id_candidat: candidat.id_candidat,
        id_concours: concours.id_concours,
      },
    });
    if (!exists) {
      await prisma.inscription.create({
        data: {
          id_candidat: candidat.id_candidat,
          id_concours: concours.id_concours,
          statut_inscription: "EN_ATTENTE",
          paiement: {
            create: {
              montant: concours.frais_inscription,
              statut_paiement: "ATTENTE",
            },
          },
        },
      });
    }
  }

  console.log("\n Seed terminé avec succès !");
}

main()
  .catch((err) => {
    console.error("Erreur seed :", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());