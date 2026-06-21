const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:8811';
const client = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true, // Don't throw on non-200 responses
});

async function cleanDatabase() {
  console.log('--- Cleaning database ---');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // Delete all records in creatorCards collection
    const collection = mongoose.connection.db.collection('creatorCards');
    await collection.deleteMany({});
    console.log('Database cleaned successfully.');
  } catch (error) {
    console.error('Failed to clean database:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

async function runTests() {
  await cleanDatabase();

  console.log('\n--- Starting Creator Card API Verification ---');
  let passedCount = 0;
  let failedCount = 0;

  function assert(testName, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (details) console.error(`       Details: ${details}`);
      failedCount++;
    }
  }

  // --- Test Case 1: Full creation ---
  const tc1 = await client.post('/creator-cards', {
    title: 'George Cooks',
    description: 'Weekly cooking podcast',
    slug: 'george-cooks',
    creator_reference: 'crt_8f2k1m9x4p7w3q5z',
    links: [{ title: 'YouTube', url: 'https://youtube.com/@georgecooks' }],
    service_rates: {
      currency: 'NGN',
      rates: [{ name: 'IG Story Post', description: 'One story mention', amount: 5000000 }],
    },
    status: 'published',
  });
  assert(
    'TC1: Create Card (george-cooks)',
    tc1.status === 200 &&
      tc1.data.status === 'success' &&
      tc1.data.data.id !== undefined &&
      tc1.data.data._id === undefined &&
      tc1.data.data.slug === 'george-cooks' &&
      tc1.data.data.access_type === 'public',
    `Status: ${tc1.status}, Data: ${JSON.stringify(tc1.data)}`
  );

  // --- Test Case 2: Slug auto-generation ---
  const tc2 = await client.post('/creator-cards', {
    title: 'Ada Designs Things',
    creator_reference: 'crt_a1b2c3d4e5f6g7h8',
    status: 'published',
  });
  assert(
    'TC2: Slug Auto-Generation',
    tc2.status === 200 &&
      tc2.data.status === 'success' &&
      tc2.data.data.slug === 'ada-designs-things',
    `Status: ${tc2.status}, Data: ${JSON.stringify(tc2.data)}`
  );

  // --- Test Case 3: Private card creation ---
  const tc3 = await client.post('/creator-cards', {
    title: 'VIP Rate Card',
    creator_reference: 'crt_x9y8z7w6v5u4t3s2',
    status: 'published',
    access_type: 'private',
    access_code: 'A1B2C3',
  });
  assert(
    'TC3: Create Private Card',
    tc3.status === 200 &&
      tc3.data.status === 'success' &&
      tc3.data.data.access_type === 'private' &&
      tc3.data.data.access_code === 'A1B2C3',
    `Status: ${tc3.status}, Data: ${JSON.stringify(tc3.data)}`
  );

  // --- Test Case 4: Retrieve public published card ---
  const tc4 = await client.get('/creator-cards/george-cooks');
  assert(
    'TC4: Retrieve Public Card',
    tc4.status === 200 &&
      tc4.data.status === 'success' &&
      tc4.data.data.id !== undefined &&
      tc4.data.data.access_code === undefined &&
      tc4.data.data.deleted === null,
    `Status: ${tc4.status}, Data: ${JSON.stringify(tc4.data)}`
  );

  // --- Test Case 5: Retrieve private card with correct pin ---
  const tc5 = await client.get('/creator-cards/vip-rate-card?access_code=A1B2C3');
  assert(
    'TC5: Retrieve Private Card with Correct Pin',
    tc5.status === 200 && tc5.data.status === 'success' && tc5.data.data.access_code === undefined,
    `Status: ${tc5.status}, Data: ${JSON.stringify(tc5.data)}`
  );

  // --- Test Case 6: Deleting a card ---
  const tc6 = await client.delete('/creator-cards/ada-designs-things', {
    data: { creator_reference: 'crt_a1b2c3d4e5f6g7h8' },
  });
  assert(
    'TC6: Delete Card (ada-designs-things)',
    tc6.status === 200 &&
      tc6.data.status === 'success' &&
      tc6.data.data.deleted !== null &&
      tc6.data.data.deleted > 0,
    `Status: ${tc6.status}, Data: ${JSON.stringify(tc6.data)}`
  );

  // --- Test Case 7: Duplicate slug ---
  const tc7 = await client.post('/creator-cards', {
    title: 'Another George',
    slug: 'george-cooks',
    creator_reference: 'crt_m1n2b3v4c5x6z7l8',
    status: 'published',
  });
  assert(
    'TC7: Duplicate Slug Error (SL02)',
    tc7.status === 400 && tc7.data.status === 'error' && tc7.data.code === 'SL02',
    `Status: ${tc7.status}, Data: ${JSON.stringify(tc7.data)}`
  );

  // --- Test Case 8: Missing access_code on private card ---
  const tc8 = await client.post('/creator-cards', {
    title: 'Secret Card',
    creator_reference: 'crt_q1w2e3r4t5y6u7i8',
    status: 'published',
    access_type: 'private',
  });
  assert(
    'TC8: Missing Access Code Error (AC01)',
    tc8.status === 400 && tc8.data.status === 'error' && tc8.data.code === 'AC01',
    `Status: ${tc8.status}, Data: ${JSON.stringify(tc8.data)}`
  );

  // --- Test Case 9: access_code on a public card ---
  const tc9 = await client.post('/creator-cards', {
    title: 'Public Card',
    creator_reference: 'crt_q1w2e3r4t5y6u7i8',
    status: 'published',
    access_type: 'public',
    access_code: 'A1B2C3',
  });
  assert(
    'TC9: Access Code on Public Card Error (AC05)',
    tc9.status === 400 && tc9.data.status === 'error' && tc9.data.code === 'AC05',
    `Status: ${tc9.status}, Data: ${JSON.stringify(tc9.data)}`
  );

  // --- Test Case 10: Framework validation failure ---
  const tc10 = await client.post('/creator-cards', {
    title: 'Bad Status Card',
    creator_reference: 'crt_q1w2e3r4t5y6u7i8',
    status: 'archived',
  });
  assert(
    'TC10: Framework Validation Failure',
    tc10.status === 400 && tc10.data.status === 'error',
    `Status: ${tc10.status}, Data: ${JSON.stringify(tc10.data)}`
  );

  // --- Test Case 11: Retrieving a non-existent card ---
  const tc11 = await client.get('/creator-cards/does-not-exist-123');
  assert(
    'TC11: Non-existent Card Error (NF01)',
    tc11.status === 404 && tc11.data.status === 'error' && tc11.data.code === 'NF01',
    `Status: ${tc11.status}, Data: ${JSON.stringify(tc11.data)}`
  );

  // --- Test Case 12: Retrieving a draft card ---
  // Let's create a draft card first
  await client.post('/creator-cards', {
    title: 'My Draft Card',
    slug: 'my-draft-card',
    creator_reference: 'crt_a1b2c3d4e5f6g7h8',
    status: 'draft',
  });
  const tc12 = await client.get('/creator-cards/my-draft-card');
  assert(
    'TC12: Draft Card Error (NF02)',
    tc12.status === 404 && tc12.data.status === 'error' && tc12.data.code === 'NF02',
    `Status: ${tc12.status}, Data: ${JSON.stringify(tc12.data)}`
  );

  // --- Test Case 13: Retrieving private card without pin ---
  const tc13 = await client.get('/creator-cards/vip-rate-card');
  assert(
    'TC13: Retrieve Private Card Without Pin Error (AC03)',
    tc13.status === 403 && tc13.data.status === 'error' && tc13.data.code === 'AC03',
    `Status: ${tc13.status}, Data: ${JSON.stringify(tc13.data)}`
  );

  // --- Test Case 14: Retrieving private card with wrong pin ---
  const tc14 = await client.get('/creator-cards/vip-rate-card?access_code=WRONG1');
  assert(
    'TC14: Retrieve Private Card With Wrong Pin Error (AC04)',
    tc14.status === 403 && tc14.data.status === 'error' && tc14.data.code === 'AC04',
    `Status: ${tc14.status}, Data: ${JSON.stringify(tc14.data)}`
  );

  // --- Test Case 15: Deleting non-existent card ---
  const tc15 = await client.delete('/creator-cards/does-not-exist-123', {
    data: { creator_reference: 'crt_q1w2e3r4t5y6u7i8' },
  });
  assert(
    'TC15: Delete Non-existent Card Error (NF01)',
    tc15.status === 404 && tc15.data.status === 'error' && tc15.data.code === 'NF01',
    `Status: ${tc15.status}, Data: ${JSON.stringify(tc15.data)}`
  );

  // --- Test Case 16: Retrieving a deleted card ---
  const tc16 = await client.get('/creator-cards/ada-designs-things');
  assert(
    'TC16: Retrieve Deleted Card Error (NF01)',
    tc16.status === 404 && tc16.data.status === 'error' && tc16.data.code === 'NF01',
    `Status: ${tc16.status}, Data: ${JSON.stringify(tc16.data)}`
  );

  console.log('\n--- Verification Summary ---');
  console.log(`Passed: ${passedCount}/16`);
  console.log(`Failed: ${failedCount}/16`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log('All tests passed successfully!');
    process.exit(0);
  }
}

runTests();
