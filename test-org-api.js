// Test the organization creation API
const testOrganizationAPI = async () => {
  const baseURL = 'http://localhost:8000/api/v1';
  
  // Test data
  const testOrg = {
    name: 'Test Organization',
    description: 'A test organization for API verification',
    domain: 'test.example.com'
  };

  try {
    console.log('Testing organization creation API...');
    console.log('Endpoint:', `${baseURL}/organizations`);
    console.log('Payload:', testOrg);

    const response = await fetch(`${baseURL}/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if needed
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      },
      body: JSON.stringify(testOrg)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.text();
    console.log('Response body:', data);

    if (response.ok) {
      console.log('✅ Organization creation successful');
      return JSON.parse(data);
    } else {
      console.log('❌ Organization creation failed');
      console.log('Error details:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return null;
  }
};

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  testOrganizationAPI();
} else {
  // Node.js environment
  console.log('Run this test in the browser console or add authentication headers for server-side testing');
}

module.exports = { testOrganizationAPI };
