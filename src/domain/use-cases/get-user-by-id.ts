import { User } from "../entities/user";
import { UserRepository } from "../repositories/user-repository";

export class GetUserByIdUseCase{
    constructor (private userRepository:UserRepository){}

    async execute(id: number):Promise<User | null>{
        return this.userRepository.findById(id);
    }
}