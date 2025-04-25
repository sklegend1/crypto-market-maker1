import { User } from "../entities/user";
import { UserRepository } from "../repositories/user-repository";

export class GetUsersUseCase{
    constructor (private userRepository:UserRepository){}

    async execute():Promise<User[]>{
        return this.userRepository.findAll();
    }
}