// Test Lambda API connection
const API_ENDPOINTS = {
  LAMBDA_DEV: 'https://by33cfrg2d.execute-api.us-east-2.amazonaws.com/dev/api',
};

async function testLambdaConnection() {
  try {
    console.log('Testing Lambda connection...');
    const response = await fetch(`${API_ENDPOINTS.LAMBDA_DEV.replace('/api', '')}/health`);
    const data = await response.json();
    console.log('Lambda health check:', data);
    
    if (data.status === 'healthy') {
      console.log('✅ Lambda API is working!');
      console.log('✅ Database status:', data.database);
    }
  } catch (error) {
    console.error('❌ Lambda connection failed:', error);
  }
}

testLambdaConnection();