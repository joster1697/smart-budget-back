"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata"); // Siempre primera importación
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const sequelize_1 = require("./database/config/sequelize");
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const account_routes_1 = __importDefault(require("./routes/account.routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const category_routes_1 = __importDefault(require("./routes/category.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middlewares base
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Inicialización controlada
async function startServer() {
    try {
        // Primero inicializa la base de datos
        await (0, sequelize_1.initializeDatabase)();
        // Luego registra las rutas (después de que los modelos estén inicializados)
        app.use("/api/auth", auth_routes_1.default);
        app.use("/api/users", user_routes_1.default);
        app.use("/api/accounts", account_routes_1.default);
        app.use("/api/categories", category_routes_1.default);
        // Health Check
        app.get("/health", (req, res) => {
            res.status(200).json({
                status: "healthy",
                database: "connected",
                timestamp: new Date()
            });
        });
        // Error Handling (debe ser el último middleware)
        app.use(error_middleware_1.errorHandler);
        app.listen(PORT, () => {
            console.log(`✅ Server is running on port ${PORT}`);
            console.log(`🛠️  Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}
startServer();
