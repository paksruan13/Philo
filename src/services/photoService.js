const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { prisma } = require('../config/database');
const s3 = require('../config/s3');
const { PutObjectCommand, S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
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

const getTeamPhotos = async (teamId) => {
  const photos = await prisma.photo.findMany({
    where: {
      teamId: teamId,
      approved: true
    },
    orderBy: {uploadedAt: 'desc'},
    take: 10,
  });
  const photosWithSignedUrls = await Promise.all(
    photos.map(async (photo) => {
      try {
        const key = photo.fileName || photo.url.split('.amazonaws.com/')[1];
        const command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key
        });
        const presignedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 3600
        });
        return {
          ...photo,
          url: presignedUrl
        };
      } catch (err) {
        console.error('Error generating presigned URL:', err);
        return {
          ...photo,
          url: null
        };
      }
    })
  );
  return photosWithSignedUrls.filter(photo => photo.url !== null);
}

module.exports = {
  uploadPhoto,
  getAllPhotos,
  getPendingPhotos,
  getApprovedPhotos,
  approvePhoto,
  rejectPhoto,
  getTeamPhotos
};