// Test Lambda API connection
const API_ENDPOINTS = {
  LAMBDA_DEV: 'https://by33cfrg2d.execute-api.us-east-2.amazonaws.com/dev/api',
};

async function testLambdaConnection() {
  try {
    const response = await fetch(`${API_ENDPOINTS.LAMBDA_DEV.replace('/api', '')}/health`);
    const data = await response.json();
    
    if (data.status === 'healthy') {
      // Lambda API is working and database is connected
    }
  } catch (error) {
    // Lambda connection failed
  }
}

testLambdaConnection();