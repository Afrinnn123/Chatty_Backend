import { Catch, ArgumentsHost, HttpException, ExceptionFilter } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        console.error('Unhandled exception:', exception);

        const status = exception instanceof HttpException ? exception.getStatus() : 500;
        const message = exception instanceof HttpException ? exception.message : 'Internal Server Error';

        response.status(status).json({
            statusCode: status,
            message: message,
            path: request.url,
        });
    }
}