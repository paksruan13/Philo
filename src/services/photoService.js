const { prisma } = require('../config/database');
const s3 = require('../config/s3');
const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials:{ 
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})


const uploadPhoto = async (file, teamId) => {
  try {
    console.log('🔧 AWS S3 Upload Debug:');
    console.log('  Region:', process.env.AWS_REGION);
    console.log('  Bucket:', process.env.S3_BUCKET_NAME);
    console.log('  Access Key:', process.env.AWS_ACCESS_KEY_ID?.substring(0, 8) + '***');

    const bucketName = process.env.S3_BUCKET_NAME;
    const key = `photos/${uuidv4()}-${file.originalname}`;

    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    const photoUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    const {prisma} = require('../config/database');
    const photo = await prisma.photo.create({
      data:{ 
        fileName: key,
        url: photoUrl,
        teamId: teamId,
        status: 'PENDING',
        uploadedAt: new Date(),
        approved: false
      },
      include: { team: true }
    });

    return {
      id: photo.id,
      url: photo.url,
      fileName: photo.fileName,
      team: photo.team,
    }
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw new Error('Failed to upload photo');
  }
};

const getAllPhotos = async () => {
  return await prisma.photo.findMany({
    orderBy: { uploadedAt: 'desc' },
    include: { team: { select: { id: true, name: true } } },
  });
};

const getPendingPhotos = async () => {
  return await prisma.photo.findMany({
    where: { approved: false },
    orderBy: { uploadedAt: 'desc' },
    include: { team: { select: { id: true, name: true } } },
  });
};

const getApprovedPhotos = async () => {
  return await prisma.photo.findMany({
    where: { approved: true },
    orderBy: { uploadedAt: 'desc' },
    include: { team: { select: { id: true, name: true } } },
  });
};

const approvePhoto = async (photoId) => {
  return await prisma.photo.update({
    where: { id: photoId },
    data: { approved: true },
    include: { team: { select: { id: true, name: true } } },
  });
};

const rejectPhoto = async (photoId) => {
  return await prisma.photo.delete({
    where: { id: photoId }
  });
};

module.exports = {
  uploadPhoto,
  getAllPhotos,
  getPendingPhotos,
  getApprovedPhotos,
  approvePhoto,
  rejectPhoto
};