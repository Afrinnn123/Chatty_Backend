import { Body, Controller, Delete, ClassSerializerInterceptor,ForbiddenException, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Put, Query, Req, Res, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Request, Response } from 'express'; 
import { BuserService } from './buser.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ChangePasswordDto } from './change-password.dto';
import { CreateItemDto } from './create-item.dto';
import { Item } from './item.entity';
import { PusherService } from './pusher.service';
import { Message } from './message.entity';
import path from 'path';
import { BuserEntity } from './buser.entity';
//import { Message } from './message.entity';



@Controller('buser')
export class BuserController {
    constructor(private readonly buserService: BuserService, private readonly pusherService: PusherService) {}

    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        return this.buserService.createUser(createUserDto);
    }

    @UseGuards(JwtAuthGuard)
@Post('profile-picture')
@UseInterceptors(FileInterceptor('file'))
async addProfilePicture(
  @Req() req,
  @UploadedFile() file: Express.Multer.File
) {
  const email = req.user.email;
  const { profilePictureUrl } = await this.buserService.addProfilePictureByEmail(email, file);
  return { message: 'Profile picture added successfully', profilePictureUrl };
}



    @UseGuards(JwtAuthGuard)
   @Get('profile-picture')
async getProfilePicture(@Req() req): Promise<{ profilePictureUrl: string }> {
    const email = req.user.email;
    const profilePictureUrl = await this.buserService.getUserProfilePictureByEmail(email);
    if (!profilePictureUrl) {
        throw new NotFoundException('Profile picture not found');
    }
    return { profilePictureUrl };
}


    @UseGuards(JwtAuthGuard)
    @Put('edit-profile')
    async updateProfile(@Req() req, @Body() updateUserDto: UpdateUserDto) {
      const email = req.user.email; 
      const user = await this.buserService.findOneByEmail(email);

      if (!user) {
          throw new NotFoundException('User not found');
      }

      if (user.email !== email) {
           throw new ForbiddenException('You can only edit your own profile');
      }

      return this.buserService.updateUser(email, updateUserDto);
    }

  

    @UseGuards(JwtAuthGuard)
      @Get('view-profile')
      async viewProfile(@Req() req) {
        const email = req.user.email; 
        const user = await this.buserService.findOneByEmail(email);
    
        if (!user) {
          throw new NotFoundException('User not found');
        }
        if (user.email !== email) {
            throw new ForbiddenException('You can only see your own profile');
       }
        
        return user; 
    }

    @UseGuards(JwtAuthGuard)
    @Delete('delete-profile')
    async deleteProfile(@Req() req, @Res() res: Response) {
        await this.buserService.deleteUserByEmail(req.user.email);
        return res.status(200).json({ message: 'Profile deleted successfully' }); 
    }

    @UseGuards(JwtAuthGuard)
    @Get('search')
    async searchUser(@Query('name') name: string): Promise<any> {
    const users = await this.buserService.searchUsersByName(name);
      if (users.length === 0) {
        return { message: "User does not exist" };
      }
      return users;
    }

    @UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Post('send-message')
async sendMessage(@Req() req, @Body() body: { receiverEmail: string, content: string }) {
    const senderEmail = req.user.email;  // Assuming user object has an email field
    const message = await this.buserService.sendMessage(senderEmail, body.receiverEmail, body.content);
    await this.pusherService.trigger('private-' + body.receiverEmail, 'new-message', message);
    return message;
}

@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Get('messages')
async getMessages(@Req() req, @Query('receiverEmail') receiverEmail: string): Promise<Message[]> {
    const senderEmail = req.user.email;  // Assuming user object has an email field
    return this.buserService.getMessagesBetween(senderEmail, receiverEmail);
}

    @UseGuards(JwtAuthGuard)
    @Patch('change-password')
    async changePassword(@Req() req, @Body() changePasswordDto: ChangePasswordDto) {
        if (req.user.email !== changePasswordDto.email) {
             throw new UnauthorizedException('Authenticated email does not match request email');
        }
  
        return this.buserService.changePassword(changePasswordDto.email, changePasswordDto.currentPassword, changePasswordDto.newPassword);
    }

    @UseGuards(JwtAuthGuard)
    @Post('item')
    async addItemToCatalog(@Req() req, @Body() createItemDto: CreateItemDto) {
        return this.buserService.addItemToCatalog(req.user.email, createItemDto);
    }

    @UseGuards(JwtAuthGuard)
@Delete('item/:itemId')
async deleteItem(
    @Req() req,
    @Param('itemId', ParseIntPipe) itemId: number
): Promise<{ message: string }> { 
    await this.buserService.deleteItemFromCatalog(req.user.email, itemId);
    return { message: 'Item deleted' };
}



@UseGuards(JwtAuthGuard)
@Get('catalog/:catalogId/items')
async getItemsByCatalog(
    @Req() req,
    @Param('catalogId', ParseIntPipe) catalogId: number
): Promise<Item[]> {
    return this.buserService.getItemsByCatalogForUser(req.user.email, catalogId);
}




 

    

    
    
}
