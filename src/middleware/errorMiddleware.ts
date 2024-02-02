import { NextFunction, Request, Response } from "express";

interface CustomError extends Error {
    code?: number;
}

const errorMiddleware = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.code || 500;
    const message = err.message || "Something went wrong";
    res.status(statusCode).json({
        success: false,
        message,
    });
};

export { errorMiddleware };