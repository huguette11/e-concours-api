import * as Minio from "minio";
import crypto from "crypto";

export class MinioStorage {
  constructor() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || "localhost",
      port: parseInt(process.env.MINIO_PORT) || 9001,
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    });

    this.BUCKET = {
      recepisse: "recepisse",
      documents: "documents",
    };
  }


  async init() {
    for (const bucket of Object.values(this.BUCKET)) {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket);
        console.info(`[MINIO] Bucket créé : ${bucket}`);
      }
    }
  }


  #computeHash(buffer) {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  #formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  #objectName({ annee, sexe, numero_recepisse }) {
    return `${annee}/${sexe}/${numero_recepisse}.pdf`;
  }


  async saveRecepisse(pdfBuffer, { numero_recepisse, annee, sexe }) {
    const objectName = this.#objectName({ annee, sexe, numero_recepisse });
    const hash = this.#computeHash(pdfBuffer);

    await this.client.putObject(
      this.BUCKET.recepisse,
      objectName,
      pdfBuffer,
      pdfBuffer.length,
      {
        "Content-Type": "application/pdf",
        "x-amz-meta-hash": hash,
        "x-amz-meta-annee": String(annee),
        "x-amz-meta-sexe": sexe,
        "x-amz-meta-numero": numero_recepisse,
      }
    );

    console.info(`[MINIO] Uploadé : ${objectName} | ${this.#formatSize(pdfBuffer.length)}`);
    return { objectName, hash, size: pdfBuffer.length };
  }



  async getSignedUrl(objectName, expirySeconds = 300) {
    return await this.client.presignedGetObject(
      this.BUCKET.recepisse,
      objectName,
      expirySeconds
    );
  }


  async streamRecepisse(objectName, res, filename) {
    const stat = await this.client.statObject(this.BUCKET.recepisse, objectName);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Cache-Control", "private, no-store");

    const stream = await this.client.getObject(this.BUCKET.recepisse, objectName);
    stream.pipe(res);
  }

  async verifyIntegrity(objectName, expectedHash) {
    const stat = await this.client.statObject(this.BUCKET.recepisse, objectName);
    return stat.metaData?.["x-amz-meta-hash"] === expectedHash;
  }



  async deleteRecepisse(objectName) {
    await this.client.removeObject(this.BUCKET.recepisse, objectName);
    console.info(`[MINIO] Supprimé : ${objectName}`);
  }


  async storageStats() {
    const stream = this.client.listObjects(this.BUCKET.recepisse, "", true);
    let count = 0;
    let totalSize = 0;

    await new Promise((resolve, reject) => {
      stream.on("data", (obj) => { count++; totalSize += obj.size; });
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    return {
      bucket: this.BUCKET.recepisse,
      totalFiles: count,
      totalSize: this.#formatSize(totalSize),
    };
  }
}


export const minioStorage = new MinioStorage();