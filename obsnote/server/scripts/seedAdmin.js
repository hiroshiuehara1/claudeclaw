import { connectDb } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { User } from "../src/models/User.js";
import { hashPassword } from "../src/utils/password.js";

const run = async () => {
  if (!env.bootstrapAdminEmail || !env.bootstrapAdminPassword) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be set");
  }

  await connectDb();

  const existing = await User.findOne({ email: env.bootstrapAdminEmail.toLowerCase() });
  if (existing) {
    console.log("Admin user already exists; skipping bootstrap.");
    process.exit(0);
  }

  const passwordHash = await hashPassword(env.bootstrapAdminPassword);
  await User.create({
    email: env.bootstrapAdminEmail.toLowerCase(),
    passwordHash,
    role: "admin",
    status: "active",
    mustChangePassword: false
  });

  console.log(`Admin user created: ${env.bootstrapAdminEmail}`);
  process.exit(0);
};

run().catch((error) => {
  console.error("Failed to seed admin", error);
  process.exit(1);
});

