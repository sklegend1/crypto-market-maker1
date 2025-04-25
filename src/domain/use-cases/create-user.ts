import { User } from "../entities/user";
import { UserRepository } from "../repositories/user-repository";
import { userSchema } from "../validators/user-schema";


export class CreateUserUseCase{
    constructor (private userRepository:UserRepository){}

    async execute(data: Omit<User,'id'>):Promise<User>{
        const validatedData = userSchema.parse(data);       

        return this.userRepository.create(validatedData);
    }
}