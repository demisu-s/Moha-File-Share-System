import jwt from "jsonwebtoken";

interface TokenPayload {
    id: string;
    employeeId: string;
    role: string;
    plantId?: string;
    departmentId?: string;
}

export const generateToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "90d" });
};

export const verifyToken = (token: string): TokenPayload => {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
};