import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api/v1';

async function seedOrganization(orgName: string, orgEmail: string) {
  console.log(`\n--- Seeding ${orgName} ---`);
  
  // 1. Register Admin
  console.log(`1. Registering admin for ${orgName}...`);
  const adminEmail = `admin@${orgName.toLowerCase().replace(/\s+/g, '')}.test`;
  const adminRes = await axios.post(`${API_URL}/auth/register/organization-admin`, {
    email: adminEmail,
    password: 'password123',
    firstName: `${orgName} Admin`,
    lastName: 'User',
    phone: '1234567890'
  });
  
  // 2. Login as Admin to get token
  console.log(`2. Logging in as admin...`);
  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    email: adminEmail,
    password: 'password123'
  });
  const token = loginRes.data.data.accessToken;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Create Organization
  console.log(`3. Creating Organization: ${orgName}...`);
  const orgRes = await axios.post(`${API_URL}/organizations`, {
    name: orgName,
    email: orgEmail,
    phone: '1234567890',
    address: '123 Main St',
    country: 'USA',
    state: 'CA',
    city: 'San Francisco',
    zipCode: '94105'
  }, { headers: authHeaders });

  // 4. Create Department
  console.log(`4. Logging in again to refresh token...`);
  const loginRes2 = await axios.post(`${API_URL}/auth/login`, {
    email: adminEmail,
    password: 'password123'
  });
  const token2 = loginRes2.data.data.accessToken;
  const authHeaders2 = { Authorization: `Bearer ${token2}` };

  console.log(`4.1. Creating Department...`);
  const deptRes = await axios.post(`${API_URL}/departments`, {
    name: 'Engineering',
    description: 'Software Engineering Department',
    location: 'Headquarters'
  }, { headers: authHeaders2 });
  const departmentId = deptRes.data.data.id;

  // 5. Create Job
  console.log(`5. Creating Job...`);
  await axios.post(`${API_URL}/jobs`, {
    departmentId,
    name: 'Senior Frontend Developer',
    description: 'We are looking for a highly skilled React developer.',
    amount: '120000',
    workLocation: 'REMOTE',
    contractType: 'FULL_TIME',
    designation: 'Senior Developer'
  }, { headers: authHeaders2 });

  // 6. Register a Candidate
  console.log(`6. Registering Candidate for ${orgName}...`);
  await axios.post(`${API_URL}/auth/register/candidate`, {
    email: `candidate@${orgName.toLowerCase().replace(/\s+/g, '')}.test`,
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '0987654321'
  });

  console.log(`✅ Finished seeding ${orgName}!`);
  console.log(`Admin Login: ${adminEmail} / password123`);
  console.log(`Org Email: ${orgEmail}\n`);
}

async function main() {
  try {
    await seedOrganization('Organization 1', 'organization1@test.com');
    await seedOrganization('Organization 2', 'organization2@test.com');
  } catch (error: any) {
    console.error('Error seeding data:', error.response?.data || error.message);
  }
}

main();
