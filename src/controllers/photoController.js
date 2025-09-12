const photoService = require('../services/photoService');
const { emitLeaderboardUpdate } = require('../services/leaderboardService');
const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3');

const uploadPhoto = async (req, res) => {

  const teamId = req.user.teamId;
  if (!teamId) {
    return res.status(400).json({ error: 'You must be part of a team to upload a photo' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const photo = await photoService.uploadPhoto(req.file, teamId);
    res.status(201).json(photo);
  } catch (err) {
    console.error('Error uploading photo:', err);
    res.status(500).json({ error: err.message });
  }
};

const uploadProductImage = async (req, res) => {
  // Check if user is admin or coach
  if (!['ADMIN', 'COACH'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only admins and coaches can upload product images' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const result = await photoService.uploadProductImage(req.file);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error uploading product image:', err);
    res.status(500).json({ error: err.message });
  }
};

const getPendingPhotos = async (req, res) => {
  try {
    const pendingPhotos = await photoService.getPendingPhotos();
    res.json(pendingPhotos);
  } catch (err) {
    console.error('Error fetching pending photos:', err);
    res.status(500).json({ error: err.message });
  }
};

const getApprovedPhotos = async (req, res) => {
  try {
    const approvedPhotos = await photoService.getApprovedPhotos();
    res.json(approvedPhotos);
  } catch (err) {
    console.error('Error fetching approved photos:', err);
    res.status(500).json({ error: err.message });
  }
};

const approvePhoto = async (req, res) => {
  const { id } = req.params;
  try {
    const photo = await photoService.approvePhoto(id);
    const io = req.app.get('io');
    await emitLeaderboardUpdate(io);
    io.to('leaderboard').emit('photo-approved', {
      photoId: photo.id,
      teamId: photo.team.id,
      teamName: photo.team.name,
      timeStamp: new Date(),
    });
    
    res.json(photo);
  } catch (err) {
    console.error('Error approving photo:', err);
    res.status(500).json({ error: err.message });
  }
};

const rejectPhoto = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const photo = await photoService.rejectPhoto(id);
    const io = req.app.get('io');
    io.to('leaderboard').emit('photo-rejected', {
      photoId: photo.id,
      reason,
      timeStamp: new Date(),
    });

    res.json({ message: 'Photo Rejected and Removed' });
  } catch (err) {
    console.error('Error rejecting photo:', err);
    res.status(500).json({ error: err.message });
  }
};

const getTeamPhotos = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;
    const photos = await photoService.getTeamPhotos(teamId);
    res.json(photos);
  } catch (err) {
    console.error('Error fetching team photos:', err);
    res.status(500).json({ error: err.message });
  }
}

const getSignedUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const photo = await prisma.photo.findUnique({
      where:{ id },
      select: { fileName: true }
    });
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: photo.fileName
    });
    const signedUrl = await getSignedObject(S3Client, command, { expiresIn: 3600 });
    res.json({ url: signedUrl });
  } catch (err) {
    console.error('Error fetching signed URL:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  uploadPhoto,
  uploadProductImage,
  getPendingPhotos,
  getApprovedPhotos,
  approvePhoto,
  rejectPhoto,
  getTeamPhotos,
  getSignedUrl
};