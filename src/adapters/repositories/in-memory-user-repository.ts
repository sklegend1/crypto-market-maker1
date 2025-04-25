import { User } from '../../domain/entities/user';
import { UserRepository } from "../../domain/repositories/user-repository";

export class InMemoryUserRepository implements UserRepository{
    private users:User[] = [];

    findAll(): User[] {
        return this.users;
    }

    findById(id: number): User | undefined {
        return this.users.find((user)=>user.id === id);
    }

    create(user: Omit<User, 'id'>): User {
        const newUser :User={
            id:this.users.length+1 ,
            name:user.name,
            email:user.email
        };
        this.users.push(newUser);
        return newUser;
    }

    update(id: number, user: User): User {
        const currentUserIndex = this.users.findIndex((u)=>u.id === id)
        if (currentUserIndex === -1) {
            throw new Error('User not found');
          }
        this.users[currentUserIndex] = user;
        return this.users[currentUserIndex]
    }

    delete(id: number): void {
        const currentUserIndex = this.users.findIndex((u)=>u.id === id)
        if (currentUserIndex === -1) {
            throw new Error('User not found');
          }
        this.users.splice(currentUserIndex,1);
    }
}