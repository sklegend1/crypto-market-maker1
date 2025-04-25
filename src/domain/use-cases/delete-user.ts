import { UserRepository } from "../repositories/user-repository";

export class DeleteUserUseCase{
    constructor (private userRepository:UserRepository){}

    async execute(id:number): Promise<void>{
        const user = await this.userRepository.findById(id);

        if(!user){
            throw new Error('User not found')
        }

        this.userRepository.delete(id);
    }
}