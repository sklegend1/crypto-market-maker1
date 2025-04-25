import { User } from '../../domain/entities/user';
import { UserRepository } from "../../domain/repositories/user-repository";
import { AppDataSource } from '../../infrastructure/data-source';

export class PostgresUserRepository implements UserRepository{
    private users:User[] = [];
    private repository = AppDataSource.getRepository(User)

    async findAll(): Promise<User[]> {
        return this.repository.find();
    }

    async findById(id: number): Promise<User | null> {
        
            return this.repository.findOneBy({id});
    }

    async create(user: Omit<User, 'id'>): Promise<User> {
        const newUser = this.repository.create(user)
        // this.users.push(newUser);
        return this.repository.save(newUser);
    }

    async update(id: number, user: User): Promise<User> {
        const existingUser = await this.repository.findOneBy({ id });
        if (!existingUser) {
        throw new Error('User not found');
        }
        return this.repository.save({ ...existingUser, ...user });
    }

    async delete(id: number): Promise<void> {
        const result = await this.repository.delete(id);
        if (result.affected === 0) {
        throw new Error('User not found');
        }
    }
}