import { INITIAL_SORGHUM_DISEASES } from '../data/diseasesDatabase';
import { TFLITE_MODEL_CLASSES } from '../ml/sorghumClassifier';
import * as fs from 'fs';
import * as path from 'path';

console.log('================================================================');
console.log('🧪 TFLITE OUTPUT TENSOR & JSON CATALOG CLASS INDEXING DRY RUN');
console.log('================================================================\n');

// 1. Load Android Assets JSON
const jsonFilePath = path.join(process.cwd(), 'assets', 'diseases_data.json');
const rawJson = fs.readFileSync(jsonFilePath, 'utf8');
const jsonCatalog = JSON.parse(rawJson);

console.log(`📋 Loaded assets/diseases_data.json with ${jsonCatalog.diseases.length} classes.\n`);

let allTestsPassed = true;

// 2. Iterate each 0-indexed class from 0 to 4
TFLITE_MODEL_CLASSES.forEach((className, expectedIndex) => {
  console.log(`----------------------------------------------------------------`);
  console.log(`🔍 Testing TFLite Output Tensor Index [${expectedIndex}]: "${className}"`);

  // A. Check TypeScript Database Match
  const tsEntity = INITIAL_SORGHUM_DISEASES[expectedIndex];
  if (!tsEntity) {
    console.error(`❌ TS Database missing entry at index ${expectedIndex}!`);
    allTestsPassed = false;
    return;
  }

  if (tsEntity.id_disease !== className) {
    console.error(`❌ TS Mismatch at index ${expectedIndex}: expected "${className}", got "${tsEntity.id_disease}"`);
    allTestsPassed = false;
  } else {
    console.log(`   ✅ TS Database Array index ${expectedIndex} matches: id_disease = "${tsEntity.id_disease}"`);
  }

  // B. Check Android assets/diseases_data.json Match
  const jsonEntity = jsonCatalog.diseases.find((d: any) => d.id === expectedIndex);
  if (!jsonEntity) {
    console.error(`❌ JSON Catalog missing entry with id ${expectedIndex}!`);
    allTestsPassed = false;
    return;
  }

  if (jsonEntity.raw_code !== className) {
    console.error(`❌ JSON raw_code mismatch at id ${expectedIndex}: expected "${className}", got "${jsonEntity.raw_code}"`);
    allTestsPassed = false;
  } else {
    console.log(`   ✅ JSON Catalog id ${expectedIndex} matches: raw_code = "${jsonEntity.raw_code}"`);
  }

  // C. Verification of specific attributes for Smut vs Fungal vs Healthy
  console.log(`   🏷️  Arabic Name: "${jsonEntity.name_ar}"`);
  console.log(`   🧪 Pesticide Protocol: "${jsonEntity.pesticide_ar}"`);
  console.log(`   ⏱️  Safety Interval (PHI): ${jsonEntity.safety_interval_days} Days`);
  console.log(`   🛡️  Type: ${jsonEntity.type}`);

  if (expectedIndex === 0) {
    // Anthracnose
    if (jsonEntity.type !== 'fungal_disease' || jsonEntity.safety_interval_days !== 14) {
      console.error(`❌ Anthracnose properties invalid!`);
      allTestsPassed = false;
    }
  } else if (expectedIndex === 1) {
    // Head Smut
    if (jsonEntity.type !== 'smut_disease' || jsonEntity.safety_interval_days !== 0 || !jsonEntity.pesticide_ar.includes('حرق')) {
      console.error(`❌ Head Smut properties invalid!`);
      allTestsPassed = false;
    }
  } else if (expectedIndex === 2) {
    // Loose Smut
    if (jsonEntity.type !== 'smut_disease' || jsonEntity.safety_interval_days !== 0 || !jsonEntity.pesticide_ar.includes('تقليع')) {
      console.error(`❌ Loose Smut properties invalid!`);
      allTestsPassed = false;
    }
  } else if (expectedIndex === 3) {
    // Rust
    if (jsonEntity.type !== 'fungal_disease' || jsonEntity.safety_interval_days !== 14 || !jsonEntity.pesticide_ar.includes('بروبيكونازول')) {
      console.error(`❌ Rust properties invalid!`);
      allTestsPassed = false;
    }
  } else if (expectedIndex === 4) {
    // Healthy
    if (jsonEntity.type !== 'healthy' || jsonEntity.safety_interval_days !== 0 || !jsonEntity.name_ar.includes('سليم')) {
      console.error(`❌ Healthy properties invalid!`);
      allTestsPassed = false;
    }
  }
});

console.log('\n================================================================');
if (allTestsPassed) {
  console.log('🎉 ALL 5 CLASS INDEXING TESTS PASSED WITH ZERO OFFSET DISCREPANCY!');
} else {
  console.error('💥 TESTS FAILED! DISCREPANCIES DETECTED.');
  process.exit(1);
}
console.log('================================================================\n');
