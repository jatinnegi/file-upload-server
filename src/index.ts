import "dotenv/config";
import "@/infrastructure/logger";
import { mongoose, redis } from "@/dataSources";
import app from "@/utils/server";

mongoose.run();
redis.run();

const PORT = process.env.APP_PORT;

app.listen(PORT, () => {
  console.log(`Server listening on PORT ${PORT}...`);
});
