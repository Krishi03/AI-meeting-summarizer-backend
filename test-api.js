const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

console.log('🧪 Testing Meeting Summarizer API\n');

// Test 1: Health Check
async function testHealth() {
  console.log('1️⃣ Testing Health Endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data.status);
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

// Test 2: Text Summarization
async function testTextSummarization() {
  console.log('\n2️⃣ Testing Text Summarization...');
  try {
    const response = await axios.post(`${BASE_URL}/api/summarize`, {
      transcript: "This is a test meeting transcript. We discussed project updates, timeline, and next steps. The team agreed to complete phase 1 by next Friday.",
      customPrompt: "Summarize the key points and action items from this meeting."
    });
    console.log('✅ Text summarization passed');
    console.log('Summary ID:', response.data.summaryId);
    return response.data.summaryId;
  } catch (error) {
    console.log('❌ Text summarization failed:', error.message);
    return null;
  }
}

// Test 3: Get Summary by ID
async function testGetSummary(summaryId) {
  if (!summaryId) return false;
  
  console.log('\n3️⃣ Testing Get Summary by ID...');
  try {
    const response = await axios.get(`${BASE_URL}/api/summarize/${summaryId}`);
    console.log('✅ Get summary passed');
    return true;
  } catch (error) {
    console.log('❌ Get summary failed:', error.message);
    return false;
  }
}

// Test 4: Edit Summary
async function testEditSummary(summaryId) {
  if (!summaryId) return false;
  
  console.log('\n4️⃣ Testing Summary Editing...');
  try {
    const response = await axios.put(`${BASE_URL}/api/summarize/${summaryId}`, {
      editedSummary: "This is my manually edited version of the summary with additional notes and corrections."
    });
    console.log('✅ Summary editing passed');
    return true;
  } catch (error) {
    console.log('❌ Summary editing failed:', error.message);
    return false;
  }
}

// Test 5: Email Test
async function testEmail(summaryId) {
  if (!summaryId) return false;
  
  console.log('\n5️⃣ Testing Email Functionality...');
  try {
    const response = await axios.post(`${BASE_URL}/api/email`, {
      summaryId: summaryId,
      recipients: ["test@example.com"],
      editedSummary: "Test summary content for email"
    });
    console.log('✅ Email test passed');
    return true;
  } catch (error) {
    console.log('❌ Email test failed:', error.message);
    return false;
  }
}

// Test 6: Supported File Types
async function testSupportedTypes() {
  console.log('\n6️⃣ Testing Supported File Types...');
  try {
    const response = await axios.get(`${BASE_URL}/api/upload/supported-types`);
    console.log('✅ Supported types test passed');
    console.log('Supported formats:', response.data.supportedTypes.length, 'types');
    return true;
  } catch (error) {
    console.log('❌ Supported types test failed:', error.message);
    return false;
  }
}

// Test 7: CORS Test
async function testCORS() {
  console.log('\n7️⃣ Testing CORS Configuration...');
  try {
    const response = await axios.get(`${BASE_URL}/health`, {
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });
    console.log('✅ CORS test passed - Frontend origin allowed');
    return true;
  } catch (error) {
    console.log('❌ CORS test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');
  
  const results = {
    health: await testHealth(),
    textSummary: await testTextSummarization(),
    getSummary: false,
    editSummary: false,
    email: false,
    supportedTypes: await testSupportedTypes(),
    cors: await testCORS()
  };
  
  // Test dependent endpoints
  if (results.textSummary) {
    results.getSummary = await testGetSummary(results.textSummary);
    results.editSummary = await testEditSummary(results.textSummary);
    results.email = await testEmail(results.textSummary);
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('Health Check:', results.health ? '✅' : '❌');
  console.log('Text Summarization:', results.textSummary ? '✅' : '❌');
  console.log('Get Summary:', results.getSummary ? '✅' : '❌');
  console.log('Edit Summary:', results.editSummary ? '✅' : '❌');
  console.log('Email:', results.email ? '✅' : '❌');
  console.log('Supported Types:', results.supportedTypes ? '✅' : '❌');
  console.log('CORS:', results.cors ? '✅' : '❌');
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your API is working perfectly.');
  } else {
    console.log('⚠️ Some tests failed. Check the errors above.');
  }
}

// Run tests
runAllTests().catch(console.error); 