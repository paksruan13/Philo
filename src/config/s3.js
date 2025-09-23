const { S3Client } = require('@aws-sdk/client-s3');

const minioEndpoint = `http://${process.env.MINIO_HOST}:${process.env.MINIO_PORT}`;

const s3 = new S3Client({
  endpoint: minioEndpoint,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});


const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  
  
});

module.exports = { s3, s3Client };