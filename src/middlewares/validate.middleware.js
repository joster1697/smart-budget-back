"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: result.error.flatten().fieldErrors
            });
        }
        req.body = result.data;
        next();
    };
};
exports.validate = validate;
