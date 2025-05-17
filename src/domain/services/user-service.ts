
import { Repository } from "typeorm";
import { User } from "../entities/user";
import { AppDataSource } from "../../infrastructure/data-source";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from "../enums/role.enum";

export class UserService{
    private userRepository : Repository<User>;

    constructor(){
        this.userRepository = AppDataSource.getRepository(User)
    }

    async signup(email:string , password:string , role:Role = Role.User):Promise<User>{
        const exitingUser = await this.userRepository.findOneBy({ email });

        if(exitingUser){
            throw new Error('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password,10);
        const user = this.userRepository.create({
            email,
            password:hashedPassword,
            role : role as Role.User | Role.Admin
        })

        return await this.userRepository.save(user)
    }

    async login(email:string , password:string):Promise<string>{
        const user = await this.userRepository.findOneBy({email});
        if (!user){
            throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password,user.password);
        if(!isPasswordValid){
            throw new Error('Invalid email or password');
        }

        const token = jwt.sign(
            {userId:user.id,email:user.email,role:user.role},
            process.env.JWT_SECRET || 'your_jwt_secret',
            {expiresIn:'1h'}
        )

        return token
    }

    async getUserById(userId: string): Promise<User | null> {
        return await this.userRepository.findOneBy({ id: userId });
      }

}