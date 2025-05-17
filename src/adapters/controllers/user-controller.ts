import { error } from 'console';
import { DeleteUserUseCase } from './../../domain/use-cases/delete-user';

import { Request,Response } from "express";
import { GetUsersUseCase } from "../../domain/use-cases/get-users";
import { GetUserByIdUseCase } from "../../domain/use-cases/get-user-by-id";
import { CreateUserUseCase } from "../../domain/use-cases/create-user";
import { UpdateUserUseCase } from './../../domain/use-cases/update-user';
import { UserService } from '../../domain/services/user-service';
import { AuthRequest } from '../../infrastructure/middlewares/auth-middleware';



export class UserController {
    private userService : UserService;
    constructor(
        private getUsersUseCase:GetUsersUseCase,
        private getUserByIdUseCase:GetUserByIdUseCase,
        private createUserUseCase:CreateUserUseCase,
        private updateUserUseCase:UpdateUserUseCase,
        private deleteUserUseCase:DeleteUserUseCase,
        
    ){
        this.userService = new UserService();
    }

    async signup(req: AuthRequest, res: Response) {
        try {
          const { email, password, role } = req.body;
          const user = await this.userService.signup(email, password, role);
          res.status(201).json({ message: 'User created', user: { id: user.id, email: user.email, role: user.role } });
        } catch (error: any) {
          console.error('Error in signup:', error.message);
          res.status(400).json({ error: error.message });
        }
      }
    
      async login(req: AuthRequest, res: Response) {
        try {
          const { email, password } = req.body;
          const token = await this.userService.login(email, password);
          res.json({ message: 'Login successful', token });
        } catch (error: any) {
          console.error('Error in login:', error.message);
          res.status(401).json({ error: error.message });
        }
      }
    
      async getProfile(req: AuthRequest, res: Response) {
        try {
          const userId = req.user!.userId; 
          const user = await this.userService.getUserById(userId);
          if (!user) {
            res.status(404).json({ error: 'User not found' });
          }
          else{
          res.json({ id: user.id, email: user.email, role: user.role });
        }
        } catch (error: any) {
          console.error('Error in getProfile:', error.message);
          res.status(500).json({ error: 'Failed to fetch profile' });
        }
      }

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