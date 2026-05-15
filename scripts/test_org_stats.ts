
async function testOrgStats() {
  try {
    const loginRes = await fetch("http://localhost:5000/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ganesh@gmail.com", password: "ganesh" }),
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    const orgRes = await fetch("http://localhost:5000/api/subscription/organizations", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const orgData = await orgRes.json();
    
    if (orgData.organizations && orgData.organizations.length > 0) {
      console.log("Found organizations:", orgData.organizations.length);
      console.log("Sample usages:");
      orgData.organizations.slice(0, 3).forEach((o: any) => {
        console.log(`- ${o.company_name}:`, JSON.stringify(o.usage));
      });
    } else {
      console.log("No organizations found or error:", orgData);
    }
  } catch(e) {
    console.error(e);
  }
}

testOrgStats();
