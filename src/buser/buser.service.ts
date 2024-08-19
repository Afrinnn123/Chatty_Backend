import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { BuserEntity } from './buser.entity';
import { CreateUserDto } from './create-user.dto';
import * as fs from 'fs';
import * as path from 'path';
import { UpdateUserDto } from './update-user.dto';
import { CreateItemDto } from './create-item.dto';
import { Item } from './item.entity';
import { Catalog } from './catalog.entity';
import { Message } from './message.entity';

 

@Injectable()
export class BuserService {
  async save(user: BuserEntity): Promise<BuserEntity> {
    return this.buserRepository.save(user);
  }
    constructor(
        @InjectRepository(BuserEntity)
        private buserRepository: Repository<BuserEntity>,
        @InjectRepository(Item)
        private itemRepository: Repository<Item>, 
        @InjectRepository(Message)
        private messageRepository: Repository<Message>
    ) {}

    async createUser(createUserDto: CreateUserDto): Promise<BuserEntity> {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10); // 10 is the salt round
        const user = this.buserRepository.create({
          ...createUserDto,
          password: hashedPassword,
        });
        const catalog = new Catalog();
        user.catalog = catalog;
        return this.buserRepository.save(user);
      }

   
    
    
      async findOneByEmail(email: string): Promise<BuserEntity | undefined> {
        return this.buserRepository.findOneBy({ email });
      }

      async addProfilePictureByEmail(email: string, file: Express.Multer.File): Promise<any> {
        const user = await this.buserRepository.findOneBy({ email });
        if (!user) {
          throw new NotFoundException(`User with email ${email} not found`);
        }
      
        const uploadsDir = path.resolve('/Users/neshatafrin/Downloads/uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
      
        if (user.profilePicture && fs.existsSync(user.profilePicture)) {
          fs.unlinkSync(user.profilePicture);
        }
      
        const fileName = `profile_${user.id}_${Date.now()}${path.extname(file.originalname)}`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
      
        user.profilePicture = filePath;
        await this.buserRepository.save(user);
      
        // Construct the URL for the uploaded profile picture
        const profilePictureUrl = `/uploads/${fileName}`;
      
        return { profilePictureUrl };
      }
      
    async updateUser(email: string, updateUserDto: UpdateUserDto): Promise<BuserEntity> {
        const user = await this.buserRepository.findOneBy({ email });
    
        if (!user) {
          throw new NotFoundException('User not found');
        }
    
        Object.assign(user, updateUserDto);
    
        return this.buserRepository.save(user);
      }

      
      async getUserProfilePictureByEmail(email: string): Promise<string> {
        const user = await this.buserRepository.findOneBy({ email });
        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }
        return user.profilePicture || null; // assuming profilePicture is the field name where the image URL is stored
    }
    



      async deleteUserByEmail(email: string): Promise<void> {
        const result = await this.buserRepository.delete({ email });
    
        if (result.affected === 0) {
          throw new NotFoundException(`User with email ${email} not found`);
        }
      }

      async searchUsersByName(name: string): Promise<BuserEntity[]> {
        if (!name.trim()) {
            return [];
        }
    
        return this.buserRepository.createQueryBuilder('user')
            .select(['user.id', 'user.name', 'user.email', 'user.isActive', 'user.phone', 'user.businessCategory'])  // Specify other fields as needed
            .where("user.name ILIKE :name", { name: `%${name}%` })
            .getMany();
      }


      async sendMessage(senderEmail: string, receiverEmail: string, content: string): Promise<Message> {
        const sender = await this.buserRepository.findOneBy({ email: senderEmail });
        const receiver = await this.buserRepository.findOneBy({ email: receiverEmail });
    
        if (!sender || !receiver) {
            throw new Error("Sender or Receiver not found");
        }
    
        const message = new Message();
        message.sender = sender;
        message.receiver = receiver;
        message.content = content;
        message.timestamp = new Date();
        return await this.messageRepository.save(message);
    }
    
    async getMessagesBetween(senderEmail: string, receiverEmail: string): Promise<Message[]> {
        const sender = await this.buserRepository.findOneBy({ email: senderEmail });
        const receiver = await this.buserRepository.findOneBy({ email: receiverEmail });
    
        if (!sender || !receiver) {
            throw new Error("Sender or Receiver not found");
        }
    
        return this.messageRepository.find({
            where: [
                { sender: sender, receiver: receiver },
                { sender: receiver, receiver: sender },
            ],
            order: {
                timestamp: 'ASC',
            },
        });
    }
  
    
      

      async changePassword(email: string, currentPassword: string, newPassword: string): Promise<any> {
        const user = await this.buserRepository.findOneBy({ email });
      
        if (!user) {
          throw new NotFoundException('User not found');
        }
      
        const passwordValid = await bcrypt.compare(currentPassword, user.password);
      
        if (!passwordValid) {
          throw new UnauthorizedException('Current password is incorrect');
        }
      
        user.password = await bcrypt.hash(newPassword, 10);
        await this.buserRepository.save(user);
      
        return { message: 'Password updated successfully' };
      }

      async addItemToCatalog(email: string, createItemDto: CreateItemDto): Promise<Item> {
        const user = await this.buserRepository.findOne({
            where: { email: email },
            relations: ['catalog'],
        });
    
        if (!user || !user.catalog) {
            throw new Error('User or user catalog not found');
        }
    
        const item = new Item();
        Object.assign(item, createItemDto);
        item.catalog = user.catalog;
    
        return await this.itemRepository.save(item); 
    }

    async deleteItemFromCatalog(email: string, itemId: number): Promise<void> {
      const itemToRemove = await this.itemRepository.findOne({
          where: { id: itemId },
          relations: ['catalog', 'catalog.buser'],
      });
  
      if (!itemToRemove) {
          throw new Error('Item not found');
      }
  
      if (itemToRemove.catalog.buser.email !== email) {
          throw new Error('Unauthorized: This item does not belong to the user');
      }
  
      await this.itemRepository.remove(itemToRemove);
  }



  async getItemsByCatalogForUser(email: string, catalogId: number): Promise<Item[]> {
    const user = await this.buserRepository.findOne({
        where: { email: email },
        relations: ['catalog'],
    });

    if (!user || !user.catalog || user.catalog.id !== catalogId) {
        throw new Error('User catalog not found or mismatch');
    }

    return this.itemRepository.find({
        where: {
            catalog: { id: catalogId },
        },
    });
}



  

  
    
    


    

}
