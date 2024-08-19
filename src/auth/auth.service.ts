import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BuserService } from '../buser/buser.service'; 
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
    tokenService: any;
    private readonly invalidatedTokens: Set<string> = new Set(); 


    constructor(
        private buserService: BuserService,
        private jwtService: JwtService,
        private readonly mailerService: MailerService
    ) {}
    private readonly resetTokens: Map<string, { email: string; expiration: Date }> = new Map();
    private readonly passwords: Map<string, string> = new Map();

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.buserService.findOneByEmail(email);
        if (user && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async sendForgotPasswordEmail(email: string, resetUrl: string): Promise<void> {
        await this.mailerService.sendMail({
          to: email,
          subject: 'Reset Your Password',
          text: `Please click on the following link to reset your password: ${resetUrl}`,
        });
      }
    
   
    async generateResetToken(email: string): Promise<string> {
        const token = Math.random().toString(36).substring(2); 
        const expiration = new Date(Date.now() + 3600000);
        this.resetTokens.set(token, { email, expiration });
        return token;
      }
      
   
 
    
    async validateResetToken(token: string): Promise<boolean> {
        return this.resetTokens.has(token); 
    }
 
    
    async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
        console.log('Resetting password for email:', email);

        const tokenData = this.resetTokens.get(token);
        if (!tokenData) {
            console.log('Token not found');
            throw new NotFoundException('Token not found');
        }

        console.log('Token found, checking expiration');
        if (new Date() > tokenData.expiration) {
            console.log('Token expired');
            throw new NotFoundException('Token expired');
        }

        console.log('Token not expired, checking email');
        if (tokenData.email !== email) {
            console.log('Invalid email for the given token');
            throw new UnauthorizedException('Invalid email for the given token');
        }

        console.log('Email valid, finding user');
        const user = await this.buserService.findOneByEmail(email);
        if (!user) {
            console.log('User not found');
            throw new NotFoundException('User not found');
        }

        console.log('User found, updating password');
        try {
            user.password = await bcrypt.hash(newPassword, 10);
             await this.buserService.save(user); // Call the save method from BuserService
             this.resetTokens.delete(token);
        } catch (error) {
            console.error('Error saving user:', error);
            throw new InternalServerErrorException('An error occurred while saving the user');
        }

        console.log('Password reset successful');
    }


    
    
    async getPasswordByEmail(email: string): Promise<string | undefined> {
        return this.passwords.get(email); 
    }

    async logout(token: string): Promise<string> {
        try {
            const decodedToken = this.jwtService.verify(token);
   
            this.invalidatedTokens.add(token);
            return `User ${decodedToken.sub} logged out successfully`;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }

    isTokenInvalidated(token: string): boolean {
        return this.invalidatedTokens.has(token);
    }
    
   

    
      
}
