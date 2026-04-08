import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import path from "path";
import { fileURLToPath } from "url";

export const generateReceipt = async (data, res) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const doc = new PDFDocument({ size: "A4", margin: 0 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=recepisse.pdf");
  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 40;
  const green = "#1a6e3c";
  const lightGreen = "#e8f5ee";
  const darkText = "#111111";
  const grayText = "#666666";

  // ─────────────────────────────────────────
  // 1. BORDURE DÉCORATIVE
  // ─────────────────────────────────────────
  doc
    .rect(15, 15, pageWidth - 30, pageHeight - 30)
    .lineWidth(2.5)
    .strokeColor(green)
    .stroke();

  doc
    .rect(20, 20, pageWidth - 40, pageHeight - 40)
    .lineWidth(0.5)
    .strokeColor(green)
    .stroke();

  // ─────────────────────────────────────────
  // 2. BANDEAU EN-TÊTE VERT
  // ─────────────────────────────────────────
  doc
    .rect(15, 15, pageWidth - 30, 95)
    .fill(green);

  try {
    const logoPath = path.join(__dirname, "..", "assets", "images", "armoiries.png");
    doc.image(logoPath, 30, 22, { width: 75, height: 75 });
  } catch (_) {}

  doc
    .fillColor("#ffffff")
    .fontSize(9)
    .font("Helvetica")
    .text("BURKINA FASO", 0, 28, { align: "center" })
    .text("La Patrie ou la Mort nous Vaincrons", 0, 41, { align: "center" });

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("MINISTERE DES SERVITEURS DU PEUPLE", 0, 58, { align: "center" });

  doc
    .fontSize(8)
    .font("Helvetica")
    .text("Direction Générale des Concours et Examens Professionnels", 0, 76, {
      align: "center",
    });

  // ─────────────────────────────────────────
  // 3. QR CODE
  // ─────────────────────────────────────────
  const qr = await QRCode.toDataURL(JSON.stringify(data.qr), {
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
  doc.image(qr, pageWidth - 110, 22, { width: 75, height: 75 });

  // ─────────────────────────────────────────
  // 4. TITRE PRINCIPAL
  // ─────────────────────────────────────────
  doc
    .fillColor(green)
    .fontSize(15)
    .font("Helvetica-Bold")
    .text("RÉCÉPISSÉ D'INSCRIPTION", 0, 128, { align: "center" });

  doc
    .fillColor(grayText)
    .fontSize(9.5)
    .font("Helvetica")
    .text("CONCOURS DIRECT DE LA FONCTION PUBLIQUE – SESSION 2026", 0, 148, {
      align: "center",
    });

  doc
    .moveTo(margin + 10, 166)
    .lineTo(pageWidth - margin - 10, 166)
    .lineWidth(1.5)
    .strokeColor(green)
    .stroke();

  // ─────────────────────────────────────────
  // 5. BLOC CONCOURS / CENTRE
  // ─────────────────────────────────────────
  doc
    .rect(margin, 176, pageWidth - margin * 2, 52)
    .fill(lightGreen);

  doc
    .rect(margin, 176, pageWidth - margin * 2, 52)
    .lineWidth(0.5)
    .strokeColor(green)
    .stroke();

  const colW = (pageWidth - margin * 2) / 2;
  const col1X = margin + 12;
  const col2X = margin + colW + 12;

  doc
    .fillColor(grayText)
    .fontSize(7.5)
    .font("Helvetica")
    .text("CONCOURS", col1X, 182);

  doc
    .fillColor(darkText)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(data.concours || "—", col1X, 194, { width: colW - 20 });

  doc
    .moveTo(margin + colW, 182)
    .lineTo(margin + colW, 222)
    .lineWidth(0.5)
    .strokeColor(green)
    .stroke();

  doc
    .fillColor(grayText)
    .fontSize(7.5)
    .font("Helvetica")
    .text("CENTRE D'EXAMEN", col2X, 182);

  doc
    .fillColor(darkText)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(data.centre || "—", col2X, 194, { width: colW - 20 });

  // ─────────────────────────────────────────
  // 6. SECTION IDENTITÉ
  // ─────────────────────────────────────────
  const sectionY1 = 240;

  doc
    .rect(margin, sectionY1, pageWidth - margin * 2, 18)
    .fill(green);

  doc
    .fillColor("#ffffff")
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("IDENTITÉ DU CANDIDAT", margin + 10, sectionY1 + 5);

  doc
    .fillColor("#ffffff")
    .fontSize(9)
    .font("Helvetica-Bold")
    .text(`N° Dossier : ${data.numero_dossier || "N/A"}`, 0, sectionY1 + 5, {
      align: "right",
      width: pageWidth - margin - 10,
    });

  const fields = [
    ["Nom", data.nom],
    ["Prénom(s)", data.prenom],
    ["Date de naissance", data.date_naissance],
    ["Lieu de naissance", data.lieu_naissance],
    ["Sexe", data.sexe],
    ["N° CNIB", data.cnib],
    ["Téléphone", data.telephone],
    ["Email", data.email || "—"],
  ];

  const rowH = 30;
  const fieldStartY = sectionY1 + 18;

  fields.forEach((field, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * colW;
    const y = fieldStartY + row * rowH;

    doc
      .rect(x, y, colW, rowH)
      .fill(row % 2 === 0 ? "#f7faf8" : "#ffffff");

    doc
      .rect(x, y, colW, rowH)
      .lineWidth(0.3)
      .strokeColor("#bbddcc")
      .stroke();

    doc
      .fillColor(grayText)
      .fontSize(7)
      .font("Helvetica")
      .text(field[0].toUpperCase(), x + 8, y + 5);

    doc
      .fillColor(darkText)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(field[1] || "—", x + 8, y + 15, { width: colW - 16 });
  });

  // ─────────────────────────────────────────
  // 7. SECTION CONSIGNES
  // ─────────────────────────────────────────
  const consigneY = fieldStartY + Math.ceil(fields.length / 2) * rowH + 18;

  doc
    .rect(margin, consigneY, pageWidth - margin * 2, 18)
    .fill(green);

  doc
    .fillColor("#ffffff")
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("CONSIGNES IMPORTANTES", margin + 10, consigneY + 5);

  const consignes = [
    "Toute détention de téléphone portable ou appareil électronique dans la salle est strictement interdite.",
    "Le candidat doit se présenter muni de ce récépissé et d'une pièce d'identité valide (CNIB ou passeport).",
    "Les candidats doivent être présents 30 minutes avant le début des épreuves.",
    "Consultez régulièrement le site officiel pour toute mise à jour concernant les épreuves.",
  ];

  let cy = consigneY + 24;
  consignes.forEach((c, i) => {
    doc
      .fillColor(darkText)
      .fontSize(8)
      .font("Helvetica")
      .text(`${i + 1}.  ${c}`, margin + 10, cy, {
        width: pageWidth - margin * 2 - 20,
      });
    cy += 18;
  });

  // ─────────────────────────────────────────
  // 8. MINI TABLEAU DATE INSCRIPTION / CENTRE
  // ─────────────────────────────────────────
  const sigY = cy + 20;
  const tableW = pageWidth - margin * 2;
  const cellW = tableW / 2;
  const cellH = 48;

  // En-têtes du tableau
  doc
    .rect(margin, sigY, cellW, 18)
    .fill(green);

  doc
    .rect(margin + cellW, sigY, cellW, 18)
    .fill(green);

  doc
    .fillColor("#ffffff")
    .fontSize(8)
    .font("Helvetica-Bold")
    .text("DATE D'INSCRIPTION", margin + 10, sigY + 5);

  doc
    .fillColor("#ffffff")
    .fontSize(8)
    .font("Helvetica-Bold")
    .text("CENTRE D'EXAMEN", margin + cellW + 10, sigY + 5);

  // Valeurs du tableau
  doc
    .rect(margin, sigY + 18, cellW, cellH)
    .fill(lightGreen);

  doc
    .rect(margin + cellW, sigY + 18, cellW, cellH)
    .fill("#ffffff");

  // Bordures cellules valeurs
  doc
    .rect(margin, sigY + 18, cellW, cellH)
    .lineWidth(0.5)
    .strokeColor(green)
    .stroke();

  doc
    .rect(margin + cellW, sigY + 18, cellW, cellH)
    .lineWidth(0.5)
    .strokeColor(green)
    .stroke();

  // Bordure globale tableau
  doc
    .rect(margin, sigY, tableW, 18 + cellH)
    .lineWidth(0.8)
    .strokeColor(green)
    .stroke();

  doc
    .fillColor(darkText)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(
      data.date_inscription || new Date().toLocaleDateString("fr-FR"),
      margin + 10,
      sigY + 30
    );

  doc
    .fillColor(darkText)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(data.centre || "—", margin + cellW + 10, sigY + 30, {
      width: cellW - 20,
    });

  // ─────────────────────────────────────────
  // 9. PIED DE PAGE
  // ─────────────────────────────────────────
  const footerY = pageHeight - 70;

  doc
    .moveTo(margin + 10, footerY)
    .lineTo(pageWidth - margin - 10, footerY)
    .lineWidth(0.8)
    .strokeColor(green)
    .stroke();

  doc
    .fillColor(green)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text("e-Concours Burkina Faso", 0, footerY + 7, { align: "center" });

  doc
    .fillColor(grayText)
    .fontSize(7)
    .font("Helvetica")
    .text(
      `Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}  –  Ce document est officiel et infalsifiable.`,
      margin,
      footerY + 19,
      { align: "center", width: pageWidth - margin * 2 }
    );

  doc
    .fillColor("#aaaaaa")
    .fontSize(6.5)
    .text(
      "Scannez le QR code pour vérifier l'authenticité de ce document.",
      margin,
      footerY + 30,
      { align: "center", width: pageWidth - margin * 2 }
    );

  doc.end();
};

// generer la listes des candidats 

export const GenererListCandidat = async(data,rest) =>{

};


export const UploadFile = async ()=>{

};