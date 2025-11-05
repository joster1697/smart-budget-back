# 📚 SmartBudget Server - Documentación Completa

Bienvenido al backend de SmartBudget. Este documento te guiará a través de la configuración inicial y te mostrará toda la documentación disponible.

---

## 📮 Probar la API con Postman

**¿Quieres probar los endpoints rápidamente?**  
👉 **Importa la collection de Postman:** [`POSTMAN_SETUP.md`](./POSTMAN_SETUP.md)

**Archivos incluidos:**
- 📦 `SmartBudget.postman_collection.json` - Collection completa con todos los endpoints
- 🌍 `SmartBudget-Local.postman_environment.json` - Environment pre-configurado
- 📝 `POSTMAN_SETUP.md` - Guía de importación y uso
- 🔄 `POSTMAN_UPDATE_WORKFLOW.md` - **Proceso para actualizar endpoints** ⭐
- 🔄 `POSTMAN_ALTERNATIVES.md` - Otras opciones (Swagger, Thunder Client, etc.)
- 🧪 `CURL_TESTS.md` - Tests con cURL para PowerShell y Bash
- 🤖 `scripts/check-postman-update.ps1` - Script de verificación automática

**Características:**
- ✅ Tokens JWT se guardan automáticamente
- ✅ Variables de entorno pre-configuradas
- ✅ Ejemplos de requests listos para usar
- ✅ Scripts automáticos incluidos
- ✅ Verificación de sincronización con comando `npm run postman:check`

**Workflow cuando modificas endpoints:**
```bash
# 1. Verifica si actualizaste Postman
npm run postman:check

# 2. El script te guía en el proceso
# 3. Commitea código + Postman juntos
```

Ver guía completa: [`POSTMAN_UPDATE_WORKFLOW.md`](./POSTMAN_UPDATE_WORKFLOW.md)

---

## �🚀 Quick Start

### ⚡ Setup Inicial (Primera Vez)

**¿Es tu primera vez configurando el proyecto?**  
👉 **Sigue la guía detallada:** [`QUICK_START.md`](./QUICK_START.md)

Esta guía incluye:
- ✅ Paso a paso con capturas
- ✅ Troubleshooting de problemas comunes
- ✅ Checklist de verificación
- ✅ Tiempos estimados
- ✅ Comandos para Windows, Linux y Mac

---

### Resumen de Comandos

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env (ver sección 3)

# 3. Iniciar Docker
docker-compose up -d

# 4. Ejecutar migraciones
docker-compose exec backend npm run db:migrate

# 5. Verificar servidor
curl http://localhost:3000/health
```

---

### Pasos Detallados

### 1. Clonar el repositorio
```bash
git clone <REPO_URL>
cd SmartBudget/server
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `server` con el siguiente contenido:

```env
# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root_password
DB_NAME=smart_budget

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=tu-secreto-super-seguro-para-access-tokens
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=otro-secreto-diferente-para-refresh-tokens
JWT_REFRESH_EXPIRES_IN=7d
```

**⚠️ IMPORTANTE:** Genera secretos seguros con:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Iniciar servicios con Docker
```bash
docker-compose up -d
```

### 5. Ejecutar migraciones de la base de datos

**Opción 1: Dentro del contenedor (RECOMENDADO)**
```bash
docker-compose exec backend npm run db:migrate
```

**Opción 2: Localmente (si no usas Docker)**
```bash
# Asegúrate de que DB_HOST=localhost en tu .env
npm run db:migrate
```

Esto creará todas las tablas necesarias:
- ✅ `users` - Usuarios del sistema
- ✅ `accounts` - Cuentas bancarias
- ✅ `categories` - Categorías de gastos
- ✅ `transactions` - Transacciones financieras
- ✅ `budgets` - Presupuestos
- ✅ `SequelizeMeta` - Control de migraciones

### 6. (Opcional) Ejecutar seeders para datos de prueba
```bash
docker-compose exec backend npm run db:seed
```

### 7. Verificar que el servidor esté funcionando
```bash
curl http://localhost:3000/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-25T12:00:00.000Z"
}
```

### 8. ¡Listo! Ahora puedes:
- Probar los endpoints de autenticación
- Leer la documentación completa
- Desarrollar nuevas funcionalidades

---

## 📖 Documentación Disponible

### � Inicio Rápido

#### 0. **QUICK_START.md** 🆕
**Guía detallada para el primer setup del proyecto**

Incluye:
- Paso a paso desde cero
- Configuración de .env
- Ejecución de migraciones (⚠️ IMPORTANTE)
- Verificación de tablas
- Troubleshooting de problemas comunes
- Checklist de verificación

**Ideal para:** Primera vez configurando el proyecto

---

### �🔐 Sistema de Autenticación

#### 1. **AUTHENTICATION_SYSTEM.md** ⭐ RECOMENDADO
**Documentación completa y detallada del sistema de autenticación**

Incluye:
- ✅ Introducción a JWT (Access + Refresh Tokens)
- ✅ Arquitectura del sistema con diagramas
- ✅ Componentes detallados (Modelos, Servicios, Controllers, Middleware)
- ✅ Flujos completos de autenticación con diagramas
- ✅ Implementación técnica paso a paso
- ✅ Seguridad (bcrypt, protección contra ataques)
- ✅ Manejo de errores con ejemplos
- ✅ Guía de testing
- ✅ Mejores prácticas
- ✅ Troubleshooting

**Ideal para:** Entender cómo funciona todo el sistema desde cero

---

#### 2. **AUTHENTICATION_TESTING.md**
**Guía práctica para probar los endpoints con Postman**

Incluye:
- Configuración de Postman
- Ejemplos de requests para cada endpoint
- Scripts de automatización
- Casos de prueba completos
- Manejo de errores

**Ideal para:** Testing manual y validación

---

#### 3. **AUTHENTICATION_IMPLEMENTATION.md**
**Resumen técnico de lo implementado**

Incluye:
- Características implementadas
- Archivos creados/modificados
- Estado actual
- Próximos pasos

**Ideal para:** Vista rápida del proyecto

---

#### 4. **AUTHENTICATION_GUIDE.md**
**Guía teórica de autenticación**

Incluye:
- Comparación JWT vs Sesiones vs OAuth
- Teoría de implementación
- Código de ejemplo

**Ideal para:** Aprender sobre autenticación

---

### 🗺️ Estructura del API

#### 5. **API_ROUTES.md**
**Documentación completa de todas las rutas**

Incluye:
- Rutas de autenticación (5 endpoints)
- Rutas de usuarios (1 endpoint + 3 futuros)
- Rutas futuras (accounts, transactions, budgets)
- Convenciones REST
- Códigos de estado HTTP

**Ideal para:** Referencia rápida de endpoints

---

#### 6. **ROUTES_REORGANIZATION.md**
**Documentación de cambios recientes en las rutas**

Incluye:
- Cambios realizados
- Comparación antes/después
- Impacto en testing

**Ideal para:** Entender cambios recientes

---

### 🗄️ Base de Datos

#### 7. **SEQUELIZE_CLI_GUIDE.md**
**Guía completa de Sequelize CLI con TypeScript**

Incluye:
- Configuración de Sequelize CLI
- Creación de modelos
- Migraciones en TypeScript
- Seeders
- Comandos útiles

**Ideal para:** Trabajar con la base de datos

---

## 🎯 ¿Qué documento leer?

### 👶 Si eres nuevo (PRIMERA VEZ):
1. **QUICK_START.md** 🆕 ← EMPIEZA AQUÍ
2. **README.md** (este archivo)
3. **AUTHENTICATION_TESTING.md**
4. **API_ROUTES.md**

### 👶 Si ya configuraste el proyecto:
1. **README.md** (este archivo)
2. **AUTHENTICATION_IMPLEMENTATION.md**
3. **API_ROUTES.md**
4. **AUTHENTICATION_TESTING.md**

### 🔐 Para entender autenticación:
1. **AUTHENTICATION_SYSTEM.md** ⭐
2. **AUTHENTICATION_GUIDE.md**
3. **AUTHENTICATION_TESTING.md**

### 💻 Para desarrollar:
1. **AUTHENTICATION_SYSTEM.md**
2. **API_ROUTES.md**
3. **SEQUELIZE_CLI_GUIDE.md**

### 🧪 Solo para probar:
1. **AUTHENTICATION_TESTING.md**
2. **API_ROUTES.md**

---

## 🏗️ Arquitectura del Proyecto

```
server/
├── src/
│   ├── controllers/          # Lógica de controladores
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   │
│   ├── services/             # Lógica de negocio
│   │   ├── auth.service.ts
│   │   └── user.service.ts
│   │
│   ├── middlewares/          # Middlewares
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   │
│   ├── routes/               # Definición de rutas
│   │   ├── auth.routes.ts
│   │   └── user.routes.ts
│   │
│   ├── database/
│   │   ├── config/           # Configuración de Sequelize
│   │   ├── models/           # Modelos de datos
│   │   ├── migrations/       # Migraciones de BD
│   │   └── seeders/          # Datos de prueba
│   │
│   └── index.ts              # Punto de entrada
│
├── .env                      # Variables de entorno (no subir a Git)
├── docker-compose.yml        # Configuración de Docker
├── Dockerfile                # Imagen de Docker
├── package.json              # Dependencias
├── tsconfig.json             # Configuración de TypeScript
│
└── 📚 Documentación/
    ├── README.md                          (este archivo)
    ├── QUICK_START.md                     🆕 Setup inicial detallado
    ├── AUTHENTICATION_SYSTEM.md           ⭐ COMPLETO
    ├── AUTHENTICATION_TESTING.md
    ├── AUTHENTICATION_IMPLEMENTATION.md
    ├── AUTHENTICATION_GUIDE.md
    ├── API_ROUTES.md
    ├── ROUTES_REORGANIZATION.md
    ├── SEQUELIZE_CLI_GUIDE.md
    └── DOCUMENTATION_SUMMARY.md
```

---

## 🔐 Endpoints Disponibles

### Autenticación (Públicos)
```
POST /api/auth/register   - Registro de usuarios
POST /api/auth/login      - Inicio de sesión
POST /api/auth/refresh    - Renovar tokens
```

### Autenticación (Protegidos)
```
GET  /api/auth/me         - Obtener perfil
POST /api/auth/logout     - Cerrar sesión
```

### Usuarios (Protegidos)
```
GET  /api/users           - Listar usuarios
```

### Utilidad
```
GET  /health              - Health check del servidor
```

**Ver más detalles en:** `API_ROUTES.md`

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** v22.15.0 - Runtime de JavaScript
- **TypeScript** v5.9.2 - JavaScript con tipos
- **Express** v5.1.0 - Framework web

### Base de Datos
- **MySQL** 8.0 - Base de datos relacional
- **Sequelize** v6.37.7 - ORM para Node.js
- **sequelize-typescript** v2.1.6 - Decoradores de TypeScript

### Autenticación & Seguridad
- **jsonwebtoken** v9.0.2 - Generación y verificación de JWT
- **bcrypt** v6.0.0 - Hashing de passwords
- **cors** - Control de acceso

### DevOps
- **Docker** - Contenedorización
- **Docker Compose** - Orquestación de servicios

---

## 📊 Estado del Proyecto

### ✅ Completado (Fase 1 - Autenticación)
- ✅ Sistema de autenticación JWT completo
- ✅ Registro de usuarios con validaciones
- ✅ Login con bcrypt
- ✅ Renovación de tokens (Access + Refresh)
- ✅ Middleware de autenticación
- ✅ Rutas protegidas
- ✅ Documentación exhaustiva (7 documentos)
- ✅ Docker configurado
- ✅ Base de datos con migraciones

### 🔮 Pendiente (Fases Futuras)
- ⏳ CRUD completo de usuarios
- ⏳ Gestión de cuentas bancarias
- ⏳ Gestión de transacciones
- ⏳ Gestión de categorías
- ⏳ Gestión de presupuestos
- ⏳ Dashboard y estadísticas
- ⏳ Almacenamiento de refresh tokens en BD
- ⏳ Rate limiting
- ⏳ Roles y permisos (admin, user)
- ⏳ OAuth (Google, Facebook)
- ⏳ Verificación de email
- ⏳ Recuperación de contraseña
- ⏳ Testing automatizado (Jest)

---

## 🧪 Testing

### Manual (Postman)
```bash
# Ver guía completa
Ver: AUTHENTICATION_TESTING.md
```

### Automatizado (Futuro)
```bash
# Ejecutar tests (cuando estén implementados)
npm test
```

---

## 🐛 Troubleshooting

### Servidor no inicia
```bash
# Verificar Docker
docker ps

# Iniciar contenedores
docker-compose up -d

# Ver logs
docker logs smartbudget-backend
docker logs smartbudget-db
```

### Error de conexión a BD
```bash
# Verificar que MySQL esté corriendo
docker ps | grep smartbudget-db

# Ver logs de MySQL
docker logs smartbudget-db

# Reiniciar contenedores
docker-compose restart
```

### Token inválido
```bash
# Usar endpoint de refresh
POST http://localhost:3000/api/auth/refresh
{
  "refreshToken": "tu-refresh-token"
}
```

### Email duplicado
```bash
# Usar un email diferente o hacer login
POST http://localhost:3000/api/auth/login
```

### Error: "Model not initialized" o "Table doesn't exist"
```bash
# Causa: Las migraciones no se han ejecutado
# Solución: Ejecutar migraciones
docker-compose exec backend npm run db:migrate

# Verificar que las tablas existen
docker exec -it smartbudget-db mysql -u root -proot_password -e "USE smart_budget; SHOW TABLES;"
```

### Las migraciones no se ejecutan
```bash
# Verificar que el contenedor esté corriendo
docker ps | grep smartbudget-backend

# Ver logs del contenedor
docker logs smartbudget-backend

# Reiniciar contenedor y ejecutar migraciones
docker-compose restart backend
docker-compose exec backend npm run db:migrate
```

**Ver más soluciones en:** `AUTHENTICATION_SYSTEM.md` → Sección "Troubleshooting"

---

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor en modo desarrollo

# Base de datos
npm run db:migrate       # Ejecutar migraciones
npm run db:migrate:undo  # Revertir última migración
npm run db:seed          # Ejecutar seeders

# Docker
docker-compose up -d     # Iniciar contenedores
docker-compose down      # Detener contenedores
docker-compose logs -f   # Ver logs en tiempo real
```

---

## 🔗 Enlaces Útiles

### Herramientas
- [Postman](https://www.postman.com/) - Testing de APIs
- [JWT.io](https://jwt.io/) - Debugger de JWT
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Referencias
- [Express.js](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js)

---

## 💡 Mejores Prácticas

### Desarrollo
- ✅ Lee la documentación antes de modificar código
- ✅ Sigue las convenciones en `API_ROUTES.md`
- ✅ Prueba con Postman antes de commitear
- ✅ No subas el archivo `.env` a Git

### Seguridad
- ✅ Usa secretos JWT largos y aleatorios
- ✅ Nunca almacenes passwords en texto plano
- ✅ Siempre excluye passwords de respuestas
- ✅ Usa HTTPS en producción

### Git
- ✅ Commits descriptivos en español
- ✅ Un feature por branch
- ✅ Pull requests para cambios importantes

---

## 🤝 Contribuir

### Para agregar nuevas funcionalidades:
1. Lee `AUTHENTICATION_SYSTEM.md` para entender la arquitectura
2. Sigue las convenciones existentes
3. Documenta los cambios
4. Prueba exhaustivamente

### Para reportar bugs:
1. Describe el problema
2. Incluye pasos para reproducir
3. Agrega logs si es posible
4. Menciona el endpoint afectado

---

## 📞 Soporte

### Problemas Comunes
Ver sección "Troubleshooting" arriba

### Debugging
```bash
# Logs del servidor
docker logs smartbudget-backend --tail 50

# Logs de MySQL
docker logs smartbudget-db --tail 50

# Estado de contenedores
docker ps -a

# Reiniciar todo
docker-compose down && docker-compose up -d
```

---

## 🎓 Recursos de Aprendizaje

### Para Principiantes
1. `API_ROUTES.md` - Entender endpoints
2. `AUTHENTICATION_TESTING.md` - Probar manualmente
3. `AUTHENTICATION_GUIDE.md` - Teoría básica

### Para Intermedios
1. `AUTHENTICATION_SYSTEM.md` - Arquitectura completa
2. Revisar código en `src/`
3. Entender flujos con diagramas

### Para Avanzados
1. Analizar decisiones de diseño
2. Revisar seguridad y mejores prácticas
3. Proponer mejoras basadas en "Próximos Pasos"

---

## 🎉 ¡Bienvenido a SmartBudget!

El sistema de autenticación está **100% funcional y documentado**. 

### Lo que tienes:
- ✅ 9 documentos completos (>75,000 palabras)
- ✅ Sistema de autenticación JWT robusto
- ✅ API RESTful bien estructurada
- ✅ Código limpio y comentado
- ✅ Docker para desarrollo
- ✅ Seguridad implementada
- ✅ Guía de setup paso a paso 🆕

### Próximo objetivo:
Implementar las funcionalidades principales del negocio:
- Gestión de cuentas bancarias
- Registro de transacciones
- Categorización de gastos
- Presupuestos y alertas
- Dashboard con estadísticas

---

**Última actualización:** Octubre 25, 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Fase 1 Completada (Autenticación)

**Documentación creada por:** SmartBudget Team

---

## 📚 Notas Importantes

### Variables de Entorno
- ⚠️ Nunca subas el archivo `.env` a Git
- ✅ Está en `.gitignore` por seguridad
- ✅ Usa diferentes secretos para desarrollo y producción

### Docker
- Los contenedores deben estar corriendo para que el servidor funcione
- MySQL corre en el puerto 3306
- Backend corre en el puerto 3000

### Base de Datos y Migraciones

#### Primera vez que inicias el proyecto:
```bash
# 1. Iniciar contenedores
docker-compose up -d

# 2. IMPORTANTE: Ejecutar migraciones
docker-compose exec backend npm run db:migrate
```

#### ¿Qué hacen las migraciones?
- Crean las tablas en la base de datos (users, accounts, transactions, etc.)
- Son necesarias ANTES de usar el API
- Se ejecutan solo UNA VEZ por cada migración

#### Comandos útiles de migraciones:
```bash
# Ver estado de migraciones
docker-compose exec backend npx sequelize-cli db:migrate:status

# Revertir última migración
docker-compose exec backend npm run db:migrate:undo

# Revertir todas las migraciones
docker-compose exec backend npx sequelize-cli db:migrate:undo:all

# Crear nueva migración
docker-compose exec backend npx sequelize-cli migration:generate --name nombre-de-migracion
```

#### Si Docker ya está corriendo pero no tienes las tablas:
```bash
# Solo ejecuta las migraciones
docker-compose exec backend npm run db:migrate
```

#### Verificar que las tablas existen:
```bash
# Conectar a MySQL
docker exec -it smartbudget-db mysql -u root -p
# Password: root_password

# Ver bases de datos
SHOW DATABASES;

# Usar la base de datos
USE smart_budget;

# Ver tablas
SHOW TABLES;
# Deberías ver: accounts, budgets, categories, SequelizeMeta, transactions, users

# Salir
EXIT;
```

### Modelo de Datos
- Las migraciones están ejecutadas automáticamente en el contenedor en el primer inicio
- Los modelos están sincronizados automáticamente (ver `sequelize.sync()` en código)
- Si modificas modelos, debes crear nuevas migraciones

---

¡Feliz desarrollo! 🚀
