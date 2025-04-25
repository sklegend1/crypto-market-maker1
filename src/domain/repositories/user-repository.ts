import { User } from "../entities/user";

export interface UserRepository{
    findAll(): Promise<User[]>;
    findById(id: number): Promise< User | null >;
    create(user: Omit<User,'id'>): Promise< User>;
    update(id:number,user:User): Promise<User>;
    delete(id: number): Promise<void>;
}