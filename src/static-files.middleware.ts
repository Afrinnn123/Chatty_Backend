import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class ServeStaticFilesMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const filePath = join('/Users/neshatafrin/Downloads/uploads', req.url);
    fs.access(filePath, fs.constants.R_OK, (err) => {
      if (err) {
        next();
        return;
      }
      res.sendFile(filePath);
    });
  }
}