import "reflect-metadata"; // Siempre primera importación
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase } from "./database/config/sequelize";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import accountRoutes from "./routes/account.routes";
import { errorHandler } from "./middlewares/error.middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares base
app.use(cors());
app.use(express.json());

// Inicialización controlada
async function startServer() {
  try {
    // Primero inicializa la base de datos
    await initializeDatabase();
    
    // Luego registra las rutas (después de que los modelos estén inicializados)
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/accounts", accountRoutes);

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
    
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`🛠️  Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();