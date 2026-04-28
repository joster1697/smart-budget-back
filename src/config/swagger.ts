import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SmartBudget API',
      version: '1.0.0',
      description:
        'API para gestión de finanzas personales con interfaz conversacional impulsada por IA. ' +
        'Soporta autenticación JWT, gestión de cuentas, transacciones, categorías y un agente de IA.',
    },
    servers: [
      {
        url: process.env.APP_URL || 'http://localhost:3000',
        description: process.env.APP_URL ? 'Producción / Fly.io' : 'Desarrollo local',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token JWT. Obtenerlo en POST /api/auth/login',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
          example: { message: 'Descripción del error' },
        },
        ValidationError: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        TokenPair: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
          required: ['accessToken', 'refreshToken'],
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            telegram_chat_id: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Account: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            type: {
              type: 'string',
              enum: ['checking', 'savings', 'credit', 'cash', 'investment'],
            },
            balance: { type: 'number' },
            currency: { type: 'string', example: 'CRC' },
            account_linked: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            account_id: { type: 'string', format: 'uuid' },
            category_id: { type: 'string', format: 'uuid', nullable: true },
            amount: { type: 'number' },
            type: {
              type: 'string',
              enum: ['income', 'expense', 'transfer'],
            },
            description: { type: 'string', nullable: true },
            merchant: { type: 'string', nullable: true },
            date: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, '../routes/**/*.ts'), path.join(__dirname, '../routes/**/*.js')],
};

export const swaggerSpec = swaggerJsdoc(options);
