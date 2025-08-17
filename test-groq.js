require('dotenv').config();
const Groq = require('groq-sdk');

console.log('🔍 Testing Groq API Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? `${process.env.GROQ_API_KEY.substring(0, 8)}***` : '❌ NOT SET');
console.log('');

if (!process.env.GROQ_API_KEY) {
  console.log('❌ GROQ_API_KEY is not set in your .env file');
  console.log('Please add: GROQ_API_KEY=your_api_key_here');
  process.exit(1);
}

// Create Groq instance
try {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  console.log('✅ Groq instance created successfully');
  console.log('🌐 Testing API connection...\n');

  // Test with a simple request
  const testPrompt = "Hello, this is a test message. Please respond with 'Connection successful!'";
  
  console.log('📤 Sending test request to Groq...');
  console.log('Test prompt:', testPrompt);
  console.log('');

  groq.chat.completions.create({
    messages: [
      { role: 'user', content: testPrompt }
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.3,
    max_tokens: 100,
  })
  .then(completion => {
    console.log('✅ Groq API connection successful!');
    console.log('Response:', completion.choices[0].message.content);
    console.log('\n🎉 Your Groq API is working correctly');
    process.exit(0);
  })
  .catch(error => {
    console.log('❌ Groq API request failed:');
    console.log('Error:', error.message);
    
    if (error.message.includes('Network Error')) {
      console.log('\n🌐 NETWORK ERROR DETECTED!');
      console.log('Possible solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify your firewall settings');
      console.log('3. Try using a different network (mobile hotspot)');
      console.log('4. Check if Groq service is down');
    } else if (error.message.includes('401')) {
      console.log('\n🔑 AUTHENTICATION ERROR!');
      console.log('Your API key might be invalid or expired');
      console.log('Please check your Groq API key');
    } else if (error.message.includes('429')) {
      console.log('\n⏰ RATE LIMIT EXCEEDED!');
      console.log('You may have hit your API quota limit');
      console.log('Check your Groq console for usage details');
    } else if (error.message.includes('500')) {
      console.log('\n🚨 GROQ SERVER ERROR!');
      console.log('Groq service might be experiencing issues');
      console.log('Try again later or check Groq status page');
    }
    
    console.log('\n📖 Troubleshooting steps:');
    console.log('1. Verify your API key at https://console.groq.com/');
    console.log('2. Check your internet connection');
    console.log('3. Try the request again in a few minutes');
    console.log('4. Check Groq status: https://status.groq.com/');
  });

} catch (error) {
  console.log('❌ Failed to create Groq instance:', error.message);
} 