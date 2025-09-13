// API Configuration for Lambda vs EC2 deployment
// Switch between endpoints easily

const API_ENDPOINTS = {
  // Current EC2 deployment
  EC2: 'https://api.sigepbounce.com/api',
  
  // Lambda API Gateway endpoints (updated with actual deployment URLs)
  LAMBDA_DEV: 'https://by33cfrg2d.execute-api.us-east-2.amazonaws.com/dev/api',
  LAMBDA_STAGING: 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/staging/api', 
  LAMBDA_PROD: 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/api',
  
  // Custom domain (if configured in serverless.yml)
  LAMBDA_CUSTOM: 'https://api.sigepbounce.com/api'
};

// Select which endpoint to use
// Change this to switch between EC2 and Lambda
const CURRENT_ENDPOINT = 'LAMBDA_DEV'; // Options: 'EC2', 'LAMBDA_DEV', 'LAMBDA_STAGING', 'LAMBDA_PROD', 'LAMBDA_CUSTOM'

export const API_BASE_URL = API_ENDPOINTS[CURRENT_ENDPOINT];

// For easy switching during deployment testing
export const API_CONFIG = {
  currentEndpoint: CURRENT_ENDPOINT,
  availableEndpoints: API_ENDPOINTS,
  
  // Helper function to switch endpoints
  switchToLambda: (stage = 'PROD') => {
    console.log(`Switching to Lambda ${stage} endpoint`);
    return API_ENDPOINTS[`LAMBDA_${stage}`];
  },
  
  switchToEC2: () => {
    console.log('Switching to EC2 endpoint');
    return API_ENDPOINTS.EC2;
  }
};