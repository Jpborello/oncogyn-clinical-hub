const supabaseUrl = 'https://ojapredjuhqeudptgqda.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qYXByZWRqdWhxZXVkcHRncWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMjM1MDMsImV4cCI6MjA5ODU5OTUwM30.xJYNu0qnY1qk9L_dGU5fL1-HgbaD573ek4ZOfGQFOjs';

async function check() {
  const headers = {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  console.log('--- CHECK COLUMN CAMA IN INTERNACIONES ---');
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/internaciones?select=cama&limit=1`, { headers });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error(err);
  }

  console.log('--- CHECK COLUMN ESTADO IN PACIENTES ---');
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/pacientes?select=estado&limit=1`, { headers });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error(err);
  }
}

check();
