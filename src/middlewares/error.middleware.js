"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    const response = {
        message: err.message
    };
    if (process.env.NODE_ENV === "development") {
        response.stack = err.stack;
    }
    res.status(statusCode).json(response);
}
