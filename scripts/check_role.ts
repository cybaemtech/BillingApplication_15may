import { db } from "../server/db";

async function run() {
  const email = "ganesh@gmail.com";
  console.log(`Checking user role for ${email}...`);
  
  const user = await db.query`
    SELECT u.id, u.email, u.username, ur.role 
    FROM users u 
    LEFT JOIN user_roles ur ON ur.user_id = u.id 
    WHERE u.email = ${email}
  `.then(r => r.recordset);
  
  console.log("User data:", user);
  process.exit(0);
}

run();
