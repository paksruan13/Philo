const { prisma } = require('../config/database');

const POINTS_CONFIG = {
    DONATION_MULTIPLIER: 1,
    SHIRT_SALE_POINTS: 10,
    PHOTO_POINTS: 50,
};

const updateTeamPoints = async (teamId) => {
    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                donations: {select: {amount: true}},
                shirtSales: {select: {quantity: true}},
                photos: {where: {approved: true}},
                activitySubmissions: {
                    where: {status: 'APPROVED'},
                    select: {pointsAwarded: true}
                }
            }
        });

        if (!team) {
            console.error(`Team not found: ${teamId}`);
            return null;
        }

        const donationPoints = team.donations.reduce((sum, d) => sum + d.amount, 0) * POINTS_CONFIG.DONATION_MULTIPLIER;
        const shirtPoints = team.shirtSales.reduce((sum, s) => sum + (s.quantity * POINTS_CONFIG.SHIRT_SALE_POINTS), 0);
        const photoPoints = team.photos.length * POINTS_CONFIG.PHOTO_POINTS;
        const activityPoints = team.activitySubmissions.reduce((sum, s) => sum + (s.pointsAwarded || 0), 0);

        const totalPoints = Math.round(donationPoints + shirtPoints + photoPoints + activityPoints);

        const updatedTeam = await prisma.team.update({
            where: {id: teamId},
            data: {totalPoints}
        });

        console.log(`Updated team ${team.name} points to ${totalPoints}`);
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
        console.log(`Added ${points} points to team ${team.name} for ${reason}`);
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

        console.log(`Removed ${points} points from team ${team.name} for ${reason}`);
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
    POINTS_CONFIG
}