import crypto from "crypto";

const [, , password] = process.argv;
const salt = "uniprix-cms-v1";

if (!password) {
  console.error("Usage: node scripts/hash-admin-password.mjs <password>");
  process.exit(1);
}

const hash = crypto.createHash("sha256").update(`${salt}${password}`).digest("hex");
console.log(hash);
