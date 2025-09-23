const productSaleService = require('../services/productSaleService');
const { emitLeaderboardUpdate } = require('../services/leaderboardService');

const sellProduct = async (req, res) => {
  try {
    const { 
      productId, 
      size, 
      quantity, 
      userId, 
      paymentMethod, 
      amountPaid,
      isExternalSale,
      externalCustomerName,
      externalCustomerEmail
    } = req.body;
    const coachId = req.user.id;

    
    if (!productId || !size || !quantity || !paymentMethod || !amountPaid) {
      return res.status(400).json({ error: 'Product, size, quantity, payment method, and amount are required' });
    }

    if (isExternalSale) {
      if (!externalCustomerName) {
        return res.status(400).json({ error: 'External customer name is required for external sales' });
      }
    } else {
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required for internal sales' });
      }
    }

    const result = isExternalSale 
      ? await productSaleService.createExternalSale({
          productId,
          size,
          quantity,
          paymentMethod,
          amountPaid,
          coachId,
          externalCustomerName,
          externalCustomerEmail
        })
      : await productSaleService.createInternalSale({
          productId,
          size,
          quantity,
          paymentMethod,
          amountPaid,
          coachId,
          userId
        });

    
    await emitLeaderboardUpdate(req.app.get('io'));

    res.status(201).json({
      message: 'Product sold successfully',
      ...result
    });

  } catch (error) {
    console.error('Error selling product:', error);
    if (error.message.includes('not found') || error.message.includes('Insufficient')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to process sale' });
  }
};


const getCoachSales = async (req, res) => {
  try {
    const coachId = req.user.id;
    const sales = await productSaleService.getCoachSales(coachId);
    res.json(sales);
  } catch (error) {
    console.error('ERROR: getCoachSales failed:', error.message);
    console.error('ERROR: Full error:', error);
    console.error('ERROR: Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch sales',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const deleteSale = async (req, res) => {
  try {
    const { saleId } = req.params;
    const coachId = req.user.id;

    const result = await productSaleService.deleteSale(saleId, coachId);

    
    await emitLeaderboardUpdate(req.app.get('io'));

    res.json({
      message: 'Sale deleted successfully',
      pointsRemoved: result.pointsRemoved
    });

  } catch (error) {
    console.error('Error deleting sale:', error);
    if (error.message.includes('not found') || error.message.includes('can only delete')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete sale' });
  }
};


const purchaseTicket = async (req, res) => {
  try {
    const { ticketId, email, name } = req.body;

    if (!ticketId || !email || !name) {
      return res.status(400).json({ error: 'Ticket ID, email, and name are required' });
    }

    const result = await productSaleService.createTicketSale({
      ticketId,
      email,
      name
    });

    
    await emitLeaderboardUpdate(req.app.get('io'));

    res.status(201).json({
      message: 'Ticket purchased successfully',
      ...result
    });

  } catch (error) {
    console.error('Error purchasing ticket:', error);
    if (error.message.includes('not found') || error.message.includes('sold out')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to process ticket purchase' });
  }
};

module.exports = {
  sellProduct,
  getCoachSales,
  deleteSale,
  purchaseTicket
};
