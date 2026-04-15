import * as Minio from 'minio';

let minioClient = null;

export const getMinioClient = () => {
  if (!minioClient) {
    minioClient = new Minio.Client({
      endPoint:  process.env.MINIO_ENDPOINT  ?? '127.0.0.1',
      port:      parseInt(process.env.MINIO_PORT ?? '9000'),
      useSSL:    process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      region:    process.env.MINIO_REGION ?? 'us-east-1',
    });
  }

  return minioClient;
};

export const ensureBucketExists = async () => {
  const client = getMinioClient();
  const bucket = process.env.MINIO_BUCKET;

  const exists = await client.bucketExists(bucket);

  if (!exists) {
    await client.makeBucket(bucket, process.env.MINIO_REGION ?? 'us-east-1');
    console.log(`Bucket "${bucket}" créé.`);
  } else {
    console.log(` Bucket "${bucket}" existe déjà.`);
  }
};

export const getPresignedUrl = async (objectName, expiry = 3600) => {
  const client = getMinioClient();
  return await client.presignedGetObject(process.env.MINIO_BUCKET, objectName, expiry);
};