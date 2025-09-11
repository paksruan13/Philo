const express = require('express');

// Request size and parsing limits
const createSecureBodyParsers = () => {
  return {
    // JSON parser with size limits
    json: express.json({
      limit: '1mb', // Limit JSON payloads to 1MB
      strict: true, // Only parse objects and arrays
      type: 'application/json',
      verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed
        if (req.originalUrl.includes('/webhook')) {
          req.rawBody = buf;
        }
      }
    }),
    
    // URL-encoded parser with size limits  
    urlencoded: express.urlencoded({
      limit: '1mb',
      extended: false, // Use simple algorithm
      parameterLimit: 100, // Limit number of parameters
      type: 'application/x-www-form-urlencoded'
    }),
    
    // Raw parser for webhooks (limited size)
    raw: express.raw({
      limit: '2mb',
      type: 'application/octet-stream'
    }),
    
    // Text parser with limits
    text: express.text({
      limit: '100kb',
      type: 'text/plain'
    })
  };
};

// Request timeout middleware
const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeoutMs, () => {
      const err = new Error('Request timeout');
      err.status = 408;
      next(err);
    });
    
    res.setTimeout(timeoutMs, () => {
      const err = new Error('Response timeout');
      err.status = 408;
      next(err);
    });
    
    next();
  };
};

// Parameter pollution prevention
const preventParameterPollution = (req, res, next) => {
  // Convert array parameters to single values (take first)
  for (const key in req.query) {
    if (Array.isArray(req.query[key])) {
      req.query[key] = req.query[key][0];
    }
  }
  
  for (const key in req.body) {
    if (Array.isArray(req.body[key]) && typeof req.body[key][0] === 'string') {
      // Allow arrays for specific fields that should be arrays
      const allowedArrayFields = ['sizes', 'categories', 'tags', 'permissions'];
      if (!allowedArrayFields.includes(key)) {
        req.body[key] = req.body[key][0];
      }
    }
  }
  
  next();
};

module.exports = {
  createSecureBodyParsers,
  requestTimeout,
  preventParameterPollution
};
