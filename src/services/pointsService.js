const { prisma } = require('../config/database');

const POINTS_CONFIG = {
    DONATION_MULTIPLIER: 1,
    SHIRT_SALE_POINTS: 10, // Default fallback
    PHOTO_POINTS: 50,
};

const getShirtPointsConfig = async () => {
    try {
        const config = await prisma.shirtConfig.findFirst({
            orderBy: { updatedAt: 'desc' }
        });
        return config?.pointsPerShirt || POINTS_CONFIG.SHIRT_SALE_POINTS;
    } catch (error) {
        console.error('Error fetching shirt points config:', error);
        return POINTS_CONFIG.SHIRT_SALE_POINTS;
    }
};

const updateShirtPointsConfig = async (pointsPerShirt, userId) => {
    try {
        const config = await prisma.shirtConfig.create({
            data: {
                pointsPerShirt: parseInt(pointsPerShirt),
                updatedBy: userId
            }
        });
        return config;
    } catch (error) {
        console.error('Error updating shirt points config:', error);
        throw error;
    }
};

const updateTeamPoints = async (teamId) => {
    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                donations: {select: {amount: true}},
                photos: {where: {approved: true}},
                activitySubmissions: {
                    where: {status: 'APPROVED'},
                    select: {pointsAwarded: true}
                },
                shirtSales: {
                    select: {quantity: true}
                }
            }
        });

        if (!team) {
            console.error(`Team not found: ${teamId}`);
            return null;
        }

        // Get current shirt points configuration
        const shirtConfig = await getShirtPointsConfig();

        const donationPoints = team.donations.reduce((sum, d) => sum + d.amount, 0) * POINTS_CONFIG.DONATION_MULTIPLIER;
        
        // Calculate shirt points from team shirt sales
        const shirtPoints = team.shirtSales.reduce((sum, sale) => sum + (sale.quantity * shirtConfig), 0);
        
        const photoPoints = team.photos.length * POINTS_CONFIG.PHOTO_POINTS;
        const activityPoints = team.activitySubmissions.reduce((sum, s) => sum + (s.pointsAwarded || 0), 0);
        const totalPoints = Math.round(donationPoints + shirtPoints + photoPoints + activityPoints);

        const updatedTeam = await prisma.team.update({
            where: {id: teamId},
            data: {totalPoints}
        });

        console.log(`Updated team ${team.name} points to ${totalPoints} (shirt points: ${shirtPoints})`);
        return updatedTeam;
    } catch (error) {
        console.error('Error updating team points:' + error);
        throw error;
    }
};

const addPoints = async (teamId, points, reason) => {
    try {
        const team = await prisma.team.update({
            where: {id: teamId},
            data: {
                totalPoints: {increment: points}
            }
        });
        return team;
    } catch (error) {
        console.error('Error adding points:', error);
        throw error;
    }
};

const removePoints = async (teamId, points, reason) => {
    try {
        const team = await prisma.team.update({
            where: { id: teamId },
            data: {
                totalPoints: { decrement: points }
            }
        });
        return team;
    } catch (error) {
        console.error('Error removing points:', error);
        throw error;
    }
};

module.exports = {
    updateTeamPoints,
    addPoints,
    removePoints,
    getShirtPointsConfig,
    updateShirtPointsConfig,
    POINTS_CONFIG
}