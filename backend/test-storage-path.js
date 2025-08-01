const fs = require('fs');
const path = require('path');

// Test storage path configuration using environment variables
console.log('🧪 Testing Storage Path Configuration (Environment Variables)...\n');

// Test 1: Check environment variables
const nasMountPath = process.env.NAS_MOUNT_PATH || "Z:";
const nasFolder = process.env.NAS_FOLDER || "Video Record";
const fullNasPath = path.join(nasMountPath, nasFolder);

console.log('📁 NAS Mount Path (ENV):', nasMountPath);
console.log('📁 NAS Folder (ENV):', nasFolder);
console.log('📁 Full NAS Path:', fullNasPath);

// Test 2: Check if the NAS path is accessible
if (fs.existsSync(fullNasPath)) {
  console.log('✅ NAS path exists and is accessible');
  
  // Test creating a test folder
  const testFolder = path.join(fullNasPath, 'test-folder');
  if (!fs.existsSync(testFolder)) {
    fs.mkdirSync(testFolder, { recursive: true });
    console.log('✅ Successfully created test folder in NAS');
    
    // Clean up
    fs.rmdirSync(testFolder);
    console.log('✅ Successfully removed test folder');
  } else {
    console.log('✅ Test folder already exists in NAS');
  }
} else {
  console.log('❌ NAS path does not exist or is not accessible');
  console.log('💡 Make sure the NAS is properly mounted and environment variables are set');
  console.log('💡 Expected path:', fullNasPath);
}

// Test 3: Check if we can create a date folder
const today = new Date().toISOString().slice(0, 10);
const dateFolder = path.join(fullNasPath, today);
console.log('📁 Test date folder:', dateFolder);

if (!fs.existsSync(dateFolder)) {
  fs.mkdirSync(dateFolder, { recursive: true });
  console.log('✅ Successfully created date folder in NAS');
  
  // Clean up
  fs.rmdirSync(dateFolder);
  console.log('✅ Successfully removed date folder');
} else {
  console.log('✅ Date folder already exists in NAS');
}

console.log('\n🧪 Test completed!'); 