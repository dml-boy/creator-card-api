/* eslint-disable no-console */
const axios = require('axios');

const BASE_URL = 'https://creator-card-api-644w.onrender.com';
const client = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true, // Don't throw on non-200 responses
});

async function runProductionTests() {
  console.log('--- Starting Deployed Render API Verification ---');
  console.log(`Target URL: ${BASE_URL}\n`);

  const testSlug = `prod-test-${Date.now()}`;
  const testCreatorRef = 'crt_prodtest12345678';

  // 1. Create a Creator Card
  console.log('Step 1: Creating a test Creator Card...');
  const createResponse = await client.post('/creator-cards', {
    title: 'Render Production Test Card',
    description: 'Verify endpoint functionality on Render',
    slug: testSlug,
    creator_reference: testCreatorRef,
    links: [{ title: 'GitHub Repo', url: 'https://github.com/dml-boy/creator-card-api' }],
    status: 'published',
  });

  const createdSuccessfully =
    createResponse.status === 200 &&
    createResponse.data.status === 'success' &&
    createResponse.data.data.slug === testSlug;

  if (createdSuccessfully) {
    console.log(`[PASS] Creator Card created successfully. Slug: ${testSlug}`);
  } else {
    console.error('[FAIL] Failed to create Creator Card.');
    console.error(
      `Status: ${createResponse.status}, Response:`,
      JSON.stringify(createResponse.data)
    );
    process.exit(1);
  }

  // 2. Retrieve the Created Card
  console.log('\nStep 2: Retrieving the created card...');
  const retrieveResponse = await client.get(`/creator-cards/${testSlug}`);

  const retrievedSuccessfully =
    retrieveResponse.status === 200 &&
    retrieveResponse.data.status === 'success' &&
    retrieveResponse.data.data.id !== undefined &&
    retrieveResponse.data.data.access_code === undefined;

  if (retrievedSuccessfully) {
    console.log(`[PASS] Creator Card retrieved successfully. Access code is hidden.`);
  } else {
    console.error('[FAIL] Failed to retrieve Creator Card.');
    console.error(
      `Status: ${retrieveResponse.status}, Response:`,
      JSON.stringify(retrieveResponse.data)
    );
  }

  // 3. Delete the Card (Cleanup)
  console.log('\nStep 3: Deleting the card (Cleaning up database)...');
  const deleteResponse = await client.delete(`/creator-cards/${testSlug}`, {
    data: { creator_reference: testCreatorRef },
  });

  const deletedSuccessfully =
    deleteResponse.status === 200 &&
    deleteResponse.data.status === 'success' &&
    deleteResponse.data.data.deleted !== null;

  if (deletedSuccessfully) {
    console.log('[PASS] Creator Card deleted successfully. Database cleaned up.');
  } else {
    console.error('[FAIL] Failed to delete Creator Card.');
    console.error(
      `Status: ${deleteResponse.status}, Response:`,
      JSON.stringify(deleteResponse.data)
    );
  }

  // 4. Verify Deletion
  console.log('\nStep 4: Verifying card is no longer retrievable...');
  const verifyRetrieveResponse = await client.get(`/creator-cards/${testSlug}`);

  const verifySuccessfully =
    verifyRetrieveResponse.status === 404 &&
    verifyRetrieveResponse.data.status === 'error' &&
    verifyRetrieveResponse.data.code === 'NF01';

  if (verifySuccessfully) {
    console.log('[PASS] Verified deleted card returns 404 (NF01).');
  } else {
    console.error('[FAIL] Deleted card is still accessible or returned wrong error.');
    console.error(
      `Status: ${verifyRetrieveResponse.status}, Response:`,
      JSON.stringify(verifyRetrieveResponse.data)
    );
  }

  console.log('\n--- Production API Test Summary ---');
  if (createdSuccessfully && retrievedSuccessfully && deletedSuccessfully && verifySuccessfully) {
    console.log('All production endpoint tests passed and database cleaned up successfully!');
  } else {
    console.error('Some tests failed. Check output logs.');
  }
}

runProductionTests();
