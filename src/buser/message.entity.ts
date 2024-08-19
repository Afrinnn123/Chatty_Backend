// message.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { BuserEntity } from './buser.entity';

@Entity("message")
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    content: string;

    @ManyToOne(() => BuserEntity, buser => buser.sendMessages)
    sender: BuserEntity;

    @ManyToOne(() => BuserEntity, buser => buser.receiveMessages)
    receiver: BuserEntity;


    @Column()
    timestamp: Date;
}
