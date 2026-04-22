// Test the deployed backend with D1 database
import https from 'https';

const BACKEND_URL = 'https://zerocancer.daunderlord.workers.dev';

console.log('🔍 Testing Cloudflare Workers + D1 Backend...');
console.log(`Backend URL: ${BACKEND_URL}`);

// Test health endpoint
https.get(`${BACKEND_URL}/api/v1/healthz`, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`\n✅ Health Check Response (${res.statusCode}):`);
    console.log(data);
    
    if (res.statusCode === 200) {
      console.log('\n🎉 Backend is working! Testing screening types...');
      
      // Test screening types endpoint (should work without database)
      https.get(`${BACKEND_URL}/api/v1/screening-types`, (res) => {
        let screeningData = '';
        
        res.on('data', (chunk) => {
          screeningData += chunk;
        });
        
        res.on('end', () => {
          console.log(`\n📊 Screening Types Response (${res.statusCode}):`);
          
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(screeningData);
              console.log('✅ API is working!');
              console.log(`Found ${parsed.data?.screeningTypes?.length || 0} screening types`);
            } catch (e) {
              console.log('Response received but not valid JSON');
              console.log('Raw response:', screeningData.substring(0, 200));
            }
          } else {
            console.log('❌ API endpoint failed');
            console.log('Response:', screeningData.substring(0, 200));
          }
          
          console.log('\n🎯 Next Steps:');
          console.log('1. The backend is deployed and accessible');
          console.log('2. We need to set up the database tables');
          console.log('3. Then we can test login functionality');
        });
      }).on('error', (err) => {
        console.log(`❌ API test failed: ${err.message}`);
      });
      
    } else {
      console.log('\n⚠️  Backend responded but with non-200 status.');
    }
  });
  
}).on('error', (err) => {
  console.log(`\n❌ Backend connection failed: ${err.message}`);
});