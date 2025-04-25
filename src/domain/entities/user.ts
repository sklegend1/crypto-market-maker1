import { Entity,Column,PrimaryGeneratedColumn } from "typeorm";


@Entity('users')
export class User{
    @PrimaryGeneratedColumn()
    id!:number;

    @Column()
    name!:string;

    @Column()
    email!: string;


}

// export interface User{
//     id:number;
//     name:string;
//     email:string;
// }