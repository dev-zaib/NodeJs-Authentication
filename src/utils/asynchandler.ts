import { Request, Response, NextFunction } from 'express';
import { Document } from 'mongoose';

interface UserDocument extends Document {
    _id: string;
    username: string;
    email: string;
    fullName: string;
    avatar: string;
    coverImage?: string;
    password: string;
    refreshToken?: string;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
}

interface RequestWithUser extends Request {
  user?: UserDocument;
}

const asyncHandler = (requestHandler: (req: RequestWithUser, res: Response, next: NextFunction) => Promise<void>) => {
    return (req: RequestWithUser, res: Response , next: NextFunction) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error))
    }
}

export { asyncHandler }