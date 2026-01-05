// Simple test script to verify server functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testServer() {
    console.log('🚀 Testing Home Hero Server...\n');

    try {
        // Test 1: Server status
        console.log('1. Testing server status...');
        const statusResponse = await axios.get(`${BASE_URL}/`);
        console.log('✅ Server status:', statusResponse.data.message);

        // Test 2: Health check
        console.log('\n2. Testing health check...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health check:', healthResponse.data.status);

        // Test 3: Database connection test
        console.log('\n3. Testing database connection...');
        const dbTestResponse = await axios.get(`${BASE_URL}/api/test`);
        console.log('✅ Database test:', dbTestResponse.data.message);

        // Test 4: Get services (public endpoint)
        console.log('\n4. Testing services endpoint...');
        const servicesResponse = await axios.get(`${BASE_URL}/services`);
        console.log('✅ Services endpoint working, found', servicesResponse.data.length, 'services');

        console.log('\n🎉 All tests passed! Server is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testServer();
}

module.exports = testServer;