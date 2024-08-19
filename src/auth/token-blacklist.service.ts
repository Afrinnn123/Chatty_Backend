import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
    private blacklist = new Set<string>();

    blacklistToken(token: string) {
        this.blacklist.add(token);
    }

    isTokenBlacklisted(token: string): boolean {
        return this.blacklist.has(token);
    }
}