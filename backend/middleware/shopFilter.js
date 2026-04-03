/**
 * Shop Filter Middleware
 * Extracts shopId from query or request body and validates it
 */

const shopFilter = (req, res, next) => {
  // Get shopId from query params, body, or headers
  // Safely check req.body exists before accessing it
  const shopId = req.query.shopId || (req.body && req.body.shopId) || req.headers['x-shop-id'];

  if (!shopId) {
    return res.status(400).json({ 
      message: 'Shop ID is required. Please select a shop.' 
    });
  }

  // Validate shopId is a number
  if (isNaN(shopId)) {
    return res.status(400).json({ 
      message: 'Invalid shop ID format' 
    });
  }

  // Attach shopId to request object for use in controllers
  req.shopId = parseInt(shopId);
  next();
};

module.exports = shopFilter;
