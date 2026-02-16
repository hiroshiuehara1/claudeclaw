import app from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

const bootstrap = async () => {
  await connectDb();

  app.listen(env.port, () => {
    console.log(`Obsnote server listening on port ${env.port}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});

