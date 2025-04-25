import { DeleteUserUseCase } from './../../domain/use-cases/delete-user';

import { Request,Response } from "express";
import { GetUsersUseCase } from "../../domain/use-cases/get-users";
import { GetUserByIdUseCase } from "../../domain/use-cases/get-user-by-id";
import { CreateUserUseCase } from "../../domain/use-cases/create-user";
import { UpdateUserUseCase } from './../../domain/use-cases/update-user';


export class UserController {
    constructor(
        private getUsersUseCase:GetUsersUseCase,
        private getUserByIdUseCase:GetUserByIdUseCase,
        private createUserUseCase:CreateUserUseCase,
        private updateUserUseCase:UpdateUserUseCase,
        private deleteUserUseCase:DeleteUserUseCase
    ){}

    async getUsers(req:Request , res:Response){
        try{
            const users = await this.getUsersUseCase.execute();
            res.json(users);
        } catch (error) {
            if(error instanceof Error)
            res.status(500).json({ message: error.message });
          }
    }

    async getUserById(req:Request , res:Response){
        try{

            const id = parseInt (req.params.id);
            const user = await this.getUserByIdUseCase.execute(id);
            res.json(user);
            
        } catch (error) {
            if(error instanceof Error)
            res.status(500).json({ message: error.message });
          }
    }

    async createUser(req:Request , res:Response){
        try {
            
            const user = await this.createUserUseCase.execute(req.body);
            res.status(201).json(user);

        } catch (error) {
            if(error instanceof Error){
                res.status(400).json({message:error.message});
            }
            else {
                res.status(400).json({ message: 'Unknown error occurred' });
            }
        }
    }

    async updateUser(req:Request,res:Response){
        try{
            const id = parseInt(req.params.id);
            const user = await this.updateUserUseCase.execute(id,req.body);
            res.json(user)
        }
        catch(error){
            if(error instanceof Error){
                res.status(400).json({message:error.message});
            }
        }
    }

    async deleteUser(req:Request,res:Response){
        try{
            const id = parseInt(req.params.id);
            await this.deleteUserUseCase.execute(id);
            res.status(204).send();
        }
        catch (error){
            if(error instanceof Error){
                res.status(400).json({message:error.message});
            } 
        }
        
    }

}