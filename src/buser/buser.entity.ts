import { Entity, Column, PrimaryGeneratedColumn, OneToOne,OneToMany, JoinColumn } from "typeorm";
import { Catalog } from './catalog.entity';
import { Message } from "./message.entity";
import { Exclude, Expose } from 'class-transformer';


@Entity("buser")
export class BuserEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    email: string;

    @Exclude()
    @Column()
    password: string;

    @Column({ default: true })
    isActive: boolean;

    @Column()
    fullName: string;

    @Column({ type: 'bigint', unsigned: true })
    phone: string;

    @Column({})
    businessCategory: string;

    @Column({ nullable: true }) 
    profilePicture: string;

    @Column({ default: 'Business User' }) 
    role: string;

    @OneToOne(() => Catalog, (catalog) => catalog.buser, { cascade: true, eager: true })
    @JoinColumn()
    catalog: Catalog;
    receivedMessages: any;
    sentMessages: any;

    @OneToMany(() => Message, message => message.sender)
    sendMessages: Message[];

    @OneToMany(() => Message, message => message.receiver)
    receiveMessages: Message[];

    

}
