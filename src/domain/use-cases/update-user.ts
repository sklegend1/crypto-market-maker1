import { UserRepository } from './../repositories/user-repository';
import { User } from "./../entities/user";
import { userSchema } from "../validators/user-schema";

export class UpdateUserUseCase {
    constructor (private userRepository : UserRepository){}

    async execute(id:number,data:Partial<Omit<User,'id'>>): Promise<User> {
        const currentUser = await this.userRepository.findById(id)

        if(!currentUser){
            throw new Error('User not found');
        }

        const validatedData = userSchema.partial().parse(data);
        const updatedUser: User = {
            ...currentUser,
            ...validatedData
        };

        return this.userRepository.update(id,updatedUser)
    }
}