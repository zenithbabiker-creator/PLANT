import { apiClient, API_ENDPOINTS, getApiBaseUrl } from '../network/apiClient';

console.log('================================================================');
console.log('🌐 VITE API CLIENT & DYNAMIC ENDPOINT BUILDER TEST SUITE');
console.log('================================================================\n');

// 1. Verify Base URL Resolution
const currentBase = apiClient.getBaseUrl();
console.log(`📡 Resolved Base URL: "${currentBase}"`);

if (!currentBase || currentBase.endsWith('/')) {
  console.error('❌ Base URL should not be empty or end with trailing slash!');
  process.exit(1);
} else {
  console.log('✅ Base URL is normalized without trailing slashes.\n');
}

// 2. Verify all dynamic endpoints resolution
console.log('📋 Testing Dynamic Endpoint Construction:');
Object.entries(API_ENDPOINTS).forEach(([key, endpointPath]) => {
  const built = apiClient.buildUrl(endpointPath);
  console.log(`   ➡️  [${key}]: ${endpointPath}  --->  ${built}`);
  
  if (!built.startsWith(currentBase)) {
    console.error(`❌ Mismatch for ${key}: expected to start with ${currentBase}`);
    process.exit(1);
  }
  // Check for invalid double slashes in path (excluding https://)
  const afterProtocol = built.replace(/^https?:\/\//, '');
  if (afterProtocol.includes('//')) {
    console.error(`❌ Invalid double slash found in constructed URL: ${built}`);
    process.exit(1);
  }
});

// 3. Testing query parameter builder
const testQueryParams = { lat: 14.3852, lng: 33.5241, crop: 'sorghum' };
const urlWithParams = apiClient.buildUrl(API_ENDPOINTS.REMOTE_SENSING, testQueryParams);
console.log(`\n🔍 Query Params Test URL: ${urlWithParams}`);
if (!urlWithParams.includes('lat=14.3852') || !urlWithParams.includes('crop=sorghum')) {
  console.error('❌ Query parameters not properly appended!');
  process.exit(1);
} else {
  console.log('✅ Query parameters properly serialized.');
}

console.log('\n================================================================');
console.log('🎉 ALL VITE API BASE URL & CLIENT ENDPOINTS PASSED CLEANLY!');
console.log('================================================================\n');
