import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User {
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private users: User[] = [
    { name: 'John Doe', email: 'john.doe@example.com', role: 'Admin' },
    { name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Editor' },
    { name: 'Peter Jones', email: 'peter.jones@example.com', role: 'Viewer' },
    { name: 'Admin User', email: 'admin.user@example.com', role: 'Admin' },
  ];
  private users$ = new BehaviorSubject<User[]>(this.users);

  getUsers() {
    return this.users$.asObservable();
  }

  addUser(user: User) {
    this.users.push(user);
    this.users$.next([...this.users]);
  }

  updateUserRole(userToUpdate: User, role: User['role']) {
    this.users = this.users.map(user =>
      user === userToUpdate ? { ...user, role } : user
    );
    this.users$.next([...this.users]);
  }
}
