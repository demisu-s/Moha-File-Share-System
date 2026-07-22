export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
}

export const successResponse = <T>(
    data: T,
    message = 'Success'
): ApiResponse<T> => ({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
});

export const errorResponse = (
    error: string,
    message = 'Error'
): ApiResponse => ({
    success: false,
    error,
    message,
    timestamp: new Date().toISOString()
});

export const paginatedResponse = <T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): ApiResponse<{
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}> => ({
    success: true,
    data: {
        items: data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    },
    timestamp: new Date().toISOString()
});