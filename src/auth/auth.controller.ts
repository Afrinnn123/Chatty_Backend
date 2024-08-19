import { Controller, Post, UseGuards, Request, Body, UnauthorizedException, BadRequestException, Get, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../buser/local-auth.guard';
//import { Request as ExpressRequest } from 'express';
import { LoginUserDto } from './login-user.dto';
import { JwtAuthGuard } from 'src/buser/jwt-auth.guard';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Body() loginUserDto: LoginUserDto) {
    return this.authService.login(req.user);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string): Promise<void> {
    const resetUrl = 'http://localhost:3000/ResetPassword';
    const token = await this.authService.generateResetToken(email);
    // Include both token and URL-encoded email in the reset URL
    const fullResetUrl = `${resetUrl}?token=${token}&email=${encodeURIComponent(email)}`;
    await this.authService.sendForgotPasswordEmail(email, fullResetUrl);
  }
  

  @Post('reset-password')
  async resetPassword(@Body() resetData: { email: string; token: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    try {
      await this.authService.resetPassword(resetData.email, resetData.token, resetData.newPassword);
      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      console.error('Error resetting password:', error);
      if (error instanceof NotFoundException || error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
        throw new BadRequestException(error.message);
      } else {
        throw error; // Re-throw any other unhandled exceptions
      }
    }
  }






@Post('logout')
    async logout(@Body('token') token: string): Promise<string> {
        try {
            if (this.authService.isTokenInvalidated(token)) {
                throw new UnauthorizedException('Token has already been invalidated');
            }
            return await this.authService.logout(token);
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }





    
    


  
}

