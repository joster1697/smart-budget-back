import "reflect-metadata"; // Siempre primera importación
import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { initializeDatabase } from "./database/config/sequelize";
import { errorHandler } from "./middlewares/error.middleware";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import accountRoutes from "./routes/account.routes";
import categoryRoutes from "./routes/category.routes";
import transactionRoutes from "./routes/transaction.routes";
import agentRoutes from "./routes/agent.routes";
import { createAgentGateway } from "./gateway/agent.gateway";
import { startTelegramBot, telegramWebhookCallback } from "./gateway/telegram.gateway";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram Webhook (antes del body parser)
if (process.env.TELEGRAM_BOT_TOKEN) {
  app.use(telegramWebhookCallback);
}

// Middlewares base
app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Inicialización controlada
async function startServer() {
  try {
    // Primero inicializa la base de datos
    await initializeDatabase();
    
    // Luego registra las rutas (después de que los modelos estén inicializados)
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/accounts", accountRoutes);
    app.use("/api/categories", categoryRoutes);
    app.use("/api/transactions", transactionRoutes);
    app.use("/api/agent", agentRoutes);

    // Health Check
    app.get("/health", (req, res) => {
      res.status(200).json({
        status: "healthy",
        database: "connected",
        timestamp: new Date()
      });
    });

    // Error Handling (debe ser el último middleware)
    app.use(errorHandler);

    // Servidor HTTP compartido entre Express y WebSocket
    const server = http.createServer(app);
    createAgentGateway(server);

    server.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`🛠️  Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    if (process.env.TELEGRAM_BOT_TOKEN) {
      await startTelegramBot();
    }
    
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();