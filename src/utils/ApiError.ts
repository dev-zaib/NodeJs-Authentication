class ApiError extends Error {
    statusCode: number;
    errors: any[];
    message: string;
    stack: string;

    constructor(
        statusCode: number,
        message: string = "something went wrong",
        errors: any[] = [],
        stack: string = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        this.stack = stack;
    }
}

export { ApiError }