import { connect } from "./_db.mts";

const username = process.argv[2]?.toLowerCase();
if (!username) {
  console.error("Cara pakai: npm run make-admin -- <username>");
  process.exit(1);
}

const sql = connect();
const rows = await sql`update users set role = 'admin' where username = ${username} returning username`;
console.log(rows.length ? `${username} sekarang admin.` : `Username ${username} tidak ditemukan.`);
await sql.end();
