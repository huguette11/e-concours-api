import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ─── Données de génération ───────────────────────────────────────────────────

const NOMS = [
  "Ouédraogo","Sawadogo","Kaboré","Traoré","Zongo","Compaoré","Tapsoba",
  "Nikiéma","Yameogo","Belem","Sankara","Diallo","Coulibaly","Konaté",
  "Some","Barro","Dao","Soulama","Tiendrebeogo","Ilboudo","Nignan","Bonkoungou",
  "Badini","Drabo","Bambara","Guira","Zoungrana","Nacoulma","Lingani","Koala",
];

const PRENOMS_H = [
  "Issouf","Dramane","Adama","Moussa","Ibrahim","Hamidou","Souleymane","Boureima",
  "Seydou","Abdoulaye","Salif","Mamadou","Yacouba","Noufou","Daouda","Lassina",
  "Pingdwendé","Wendpanga","Wendlassida","Romaric","Dimitri","Aristide",
];

const PRENOMS_F = [
  "Aminata","Mariam","Fatoumata","Rasmata","Aïcha","Salamata","Bintou","Assita",
  "Nafissatou","Djamila","Maimouna","Kadiatou","Rokiatou","Fanta","Nathalie",
  "Clarisse","Pascaline","Wendlassida","Raïnatou","Haoua","Salimata",
];

const LIEUX_NAISSANCE = [
  "Ouagadougou","Bobo-Dioulasso","Koudougou","Banfora","Ouahigouya",
  "Dédougou","Fada N'Gourma","Tenkodogo","Kaya","Ziniaré","Manga","Léo",
  "Diébougou","Gaoua","Nouna","Tougan","Kongoussi","Titao","Djibo","Dori",
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function genererDate(anneeMin, anneeMax) {
  const annee = randInt(anneeMin, anneeMax);
  const mois  = randInt(1, 12);
  const jour  = randInt(1, 28);
  return new Date(`${annee}-${String(mois).padStart(2,'0')}-${String(jour).padStart(2,'0')}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Démarrage du seed...\n");

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  let admin = await prisma.admin.findUnique({
    where: { email: "admin@econcours.gov.bf" },
  });
  if (!admin) {
    admin = await prisma.admin.create({
      data: {
        nom: "Admin", prenom: "Super",
        email: "admin@econcours.gov.bf",
        mot_de_passe: await bcrypt.hash("Admin@1234", 10),
        telephone: "70000000",
        role: "SUPERADMIN",
        actif: true,
      },
    });
  }
  console.log("✅ Admin prêt");

  // ── CENTRES ────────────────────────────────────────────────────────────────
  const centresData = [
    "Ouagadougou","Bobo-Dioulasso","Koudougou",
    "Banfora","Ouahigouya","Dédougou","Fada N'Gourma","Tenkodogo",
  ];
  const centres = [];
  for (const nom of centresData) {
    let c = await prisma.centre.findFirst({ where: { nom } });
    if (!c) c = await prisma.centre.create({ data: { nom } });
    centres.push(c);
  }
  console.log(`✅ ${centres.length} centres prêts`);

  // ── LIEUX DE COMPOSITION ──────────────────────────────────────────────────
  const lieuxData = [
    { nom: "Lycée Philippe Zinda Kaboré",  quota: 1500, id_centre: centres[0].id_centre },
    { nom: "Lycée Wemtenga",               quota: 1200, id_centre: centres[0].id_centre },
    { nom: "Lycée Technique de Ouaga",     quota: 1000, id_centre: centres[0].id_centre },
    { nom: "Lycée Ouézzin Coulibaly",      quota: 900,  id_centre: centres[1].id_centre },
    { nom: "Lycée Municipal de Bobo",      quota: 800,  id_centre: centres[1].id_centre },
    { nom: "Lycée Dim Dolobsom",           quota: 600,  id_centre: centres[2].id_centre },
    { nom: "CEG de Koudougou",             quota: 500,  id_centre: centres[2].id_centre },
    { nom: "Lycée de Banfora",             quota: 400,  id_centre: centres[3].id_centre },
    { nom: "Lycée de Ouahigouya",          quota: 400,  id_centre: centres[4].id_centre },
    { nom: "CEG de Dédougou",              quota: 300,  id_centre: centres[5].id_centre },
    { nom: "Lycée de Fada N'Gourma",       quota: 300,  id_centre: centres[6].id_centre },
    { nom: "CEG de Tenkodogo",             quota: 300,  id_centre: centres[7].id_centre },
  ];
  const lieux = [];
  for (const l of lieuxData) {
    let lieu = await prisma.lieuxComposition.findFirst({ where: { nom: l.nom } });
    if (!lieu) lieu = await prisma.lieuxComposition.create({ data: l });
    lieux.push(lieu);
  }
  console.log(`✅ ${lieux.length} lieux de composition prêts`);

  // ── CATEGORIES ────────────────────────────────────────────────────────────
  const categoriesData = [
    { libelle: "Fonction Publique",  description: "Concours de la fonction publique" },
    { libelle: "Militaire",          description: "Concours des forces armées" },
    { libelle: "Paramédical",        description: "Concours du secteur de la santé" },
    { libelle: "Enseignement",       description: "Concours pour le corps enseignant" },
    { libelle: "Police Nationale",   description: "Concours de la police nationale" },
    { libelle: "Douanes",            description: "Concours des douanes" },
    { libelle: "Eaux et Forêts",     description: "Concours des eaux et forêts" },
    { libelle: "Justice",            description: "Concours du ministère de la justice" },
  ];
  const categories = [];
  for (const cat of categoriesData) {
    let cat_ = await prisma.categorieConcours.findFirst({ where: { libelle: cat.libelle } });
    if (!cat_) cat_ = await prisma.categorieConcours.create({ data: cat });
    categories.push(cat_);
  }
  console.log(`✅ ${categories.length} catégories prêtes`);

  // ── CONCOURS ──────────────────────────────────────────────────────────────
  const concoursData = [
    {
      nom: "Concours Agents de Santé 2025",
      type: "DIRECT",
      description: "Recrutement d'agents paramédicaux pour les hôpitaux nationaux.",
      frais_inscription: 5000, nombre_postes: 200, annee: 2025,
      date_debut: new Date("2025-03-01"), date_fin: new Date("2025-04-30"),
      statut_concours: "OUVERT",
      categorieId: categories[2].id,
      centreIds: centres.map(c => c.id_centre), // tous les centres
    },
    {
      nom: "Concours Enseignants du Primaire 2025",
      type: "DIRECT",
      description: "Recrutement d'instituteurs pour les écoles primaires publiques.",
      frais_inscription: 3000, nombre_postes: 500, annee: 2025,
      date_debut: new Date("2025-05-01"), date_fin: new Date("2025-06-30"),
      statut_concours: "OUVERT",
      categorieId: categories[3].id,
      centreIds: centres.map(c => c.id_centre),
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
            create: centreIds.map(id_centre => ({
              centre: { connect: { id_centre } },
            })),
          },
        },
      });
    }
    concoursList.push(concours);
  }
  console.log(`✅ ${concoursList.length} concours prêts`);

  // ── 10 000 CANDIDATS ──────────────────────────────────────────────────────
  // Générer en lots de 500 pour ne pas saturer la mémoire
  const MOT_DE_PASSE_HASH = await bcrypt.hash("Password@123", 10);
  const TOTAL             = 10_000;
  const LOT               = 500;

  console.log(`\n⏳ Génération de ${TOTAL} candidats par lots de ${LOT}...`);

  // Vérifier combien existent déjà
  const existants = await prisma.candidat.count();
  if (existants >= TOTAL) {
    console.log(`⚠️  ${existants} candidats déjà présents, étape ignorée.`);
  } else {
    let total_crees = existants;
    let lot_num     = 0;
    const cnibSet   = new Set(); // éviter les doublons CNIB dans la session
    const emailSet  = new Set();
    const telSet    = new Set();

    while (total_crees < TOTAL) {
      const taille   = Math.min(LOT, TOTAL - total_crees);
      const candidats = [];

      for (let i = 0; i < taille; i++) {
        const sexe    = Math.random() > 0.45 ? "HOMME" : "FEMME";
        const prenom  = sexe === "HOMME" ? rand(PRENOMS_H) : rand(PRENOMS_F);
        const nom     = rand(NOMS);
        const index   = total_crees + i + 1;

        // Identifiants uniques garantis
        let cnib, email, tel;
        do { cnib = `B${String(randInt(100000000, 999999999))}`; } while (cnibSet.has(cnib));
        do { email = `candidat${index}.${Math.random().toString(36).slice(2,6)}@econcours.bf`; } while (emailSet.has(email));
        do { tel = `${rand(['70','71','72','73','74','75','76','77','78'])}${String(randInt(100000, 999999))}`; } while (telSet.has(tel));

        cnibSet.add(cnib);
        emailSet.add(email);
        telSet.add(tel);

        candidats.push({
          nom,
          prenom,
          sexe,
          date_naissance:  genererDate(1985, 2000),
          lieu_naissance:  rand(LIEUX_NAISSANCE),
          pays_naissance:  "Burkina Faso",
          numero_cnib:     cnib,
          date_delivrance: genererDate(2015, 2023),
          telephone:       tel,
          email,
          mot_de_passe:    MOT_DE_PASSE_HASH,
          statut_compte:   "ACTIF",
        });
      }

      await prisma.candidat.createMany({
        data: candidats,
        skipDuplicates: true,
      });

      total_crees += taille;
      lot_num++;
      process.stdout.write(`\r   Lot ${lot_num} — ${total_crees}/${TOTAL} candidats créés`);
    }
    console.log("\n✅ Candidats créés");
  }

  // ── INSCRIPTIONS EN MASSE ─────────────────────────────────────────────────
  // Chaque candidat s'inscrit à 1 concours aléatoire dans un centre aléatoire
  // On travaille par lots pour éviter les timeouts
  console.log("\n⏳ Création des inscriptions...");

  const existantesInscriptions = await prisma.inscription.count();
  if (existantesInscriptions >= TOTAL) {
    console.log(`⚠️  ${existantesInscriptions} inscriptions déjà présentes, étape ignorée.`);
  } else {
    // Récupérer tous les IDs candidats
    const tousLesCandidats = await prisma.candidat.findMany({
      select: { id_candidat: true },
      take: TOTAL,
    });

    // Pour chaque concours, récupérer ses centres disponibles
    const centresParConcours = {};
    for (const concours of concoursList) {
      const cc = await prisma.concoursCentre.findMany({
        where: { concoursId: concours.id_concours },
        select: { centreId: true },
      });
      centresParConcours[concours.id_concours] = cc.map(c => c.centreId);
    }

    let inscriptions_creees = 0;
    const LOT_INS = 1000;

    for (let i = 0; i < tousLesCandidats.length; i += LOT_INS) {
      const lot = tousLesCandidats.slice(i, i + LOT_INS);
      const data = [];

      for (const { id_candidat } of lot) {
        // Chaque candidat s'inscrit à UN concours aléatoire
        const concours  = rand(concoursList);
        const centresOk = centresParConcours[concours.id_concours];
        const id_centre = rand(centresOk);

        data.push({
          id_candidat,
          id_concours:        concours.id_concours,
          id_centre,
          statut_inscription: "EN_ATTENTE",
          date_inscription:   new Date(),
        });
      }

      await prisma.inscription.createMany({
        data,
        skipDuplicates: true, // ignorer si déjà inscrit (id_candidat + id_concours unique)
      });

      inscriptions_creees += lot.length;
      process.stdout.write(`\r   ${inscriptions_creees}/${tousLesCandidats.length} inscriptions créées`);
    }
    console.log("\n✅ Inscriptions créées");
  }

  // ── RÉSUMÉ ────────────────────────────────────────────────────────────────
  const [nbCandidats, nbInscriptions] = await Promise.all([
    prisma.candidat.count(),
    prisma.inscription.count(),
  ]);

  console.log("\n─────────────────────────────────────");
  console.log(`🎉 Seed terminé !`);
  console.log(`   👤 Candidats    : ${nbCandidats.toLocaleString()}`);
  console.log(`   📋 Inscriptions : ${nbInscriptions.toLocaleString()}`);
  console.log("─────────────────────────────────────\n");
}

main()
  .catch((err) => {
    console.error("\n❌ Erreur seed :", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());