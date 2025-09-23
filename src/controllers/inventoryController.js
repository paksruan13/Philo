const { prisma } = require('../config/lambdaDatabase');

const getShirtInventory = async (req, res) => {
    try {
        const inventory = await prisma.shirtInventory.findMany({
            orderBy: { size: 'asc' }
        });
        res.json(inventory);
    } catch (error) {
        console.error('Error fetching shirt inventory:', error);
        res.status(500).json({ error: 'Failed to fetch shirt inventory' });
    }
}

const updateInventory = async (req, res) => {
    try {
        const { size, quantity } = req.body;
        const inventory = await prisma.shirtInventory.upsert({
            where: { size },
            update: { quantity },
            create: { size, quantity }
    });
        res.json(inventory);
    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(500).json({ error: 'Failed to update inventory' });
    }
}

module.exports = {
    getShirtInventory,
    updateInventory
}