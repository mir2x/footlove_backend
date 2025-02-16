import http from "http";
import app from "./app";
import "dotenv/config";
import { connectDB } from "@connection/atlasDB";
import { logger } from "@shared/logger";
import initializeSocket from "./socket";

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    await connectDB();
    const server = http.createServer(app);
    initializeSocket(server);
    server.listen(PORT, () => {
      logger.info(`Server is running at PORT: ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start the server:", error);
  }
}

startServer();