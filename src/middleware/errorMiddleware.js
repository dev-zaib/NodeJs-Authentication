const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.code || 500;
    const message = err.message || "Something went wrong";
    res.status(statusCode).json({
        success: false,
        message,
    });
};

export { errorMiddleware };