const { S3Client } = require('@aws-sdk/client-s3');

const minioEndpoint = `http://${process.env.MINIO_ENDPOINT}`;

// Local/development S3 (MinIO)
const s3 = new S3Client({
  endpoint: minioEndpoint,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

// AWS S3 client - use Lambda execution role when in AWS Lambda environment
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  // In Lambda, credentials are automatically provided by the execution role
  // No need to specify credentials explicitly
});

module.exports = { s3, s3Client };