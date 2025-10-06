import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export type UserType = 'Human' | 'Application';

export interface User {
  id: number;
  name: string;
  email: string;
  type: UserType;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
  // Additional fields based on type
  apiKey?: string;        // For Application users
  phoneNumber?: string;   // For Human users
  department?: string;    // For Human users
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private mockUsers: User[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      type: 'Human',
      role: 'Admin',
      status: 'active',
      lastLogin: '2024-03-16T10:30:00',
      createdAt: '2024-01-15',
      phoneNumber: '+250789123456',
      department: 'IT'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      type: 'Human',
      role: 'Manager',
      status: 'active',
      lastLogin: '2024-03-15T16:45:00',
      createdAt: '2024-01-20',
      phoneNumber: '+250789123457',
      department: 'Operations'
    },
    {
      id: 3,
      name: 'Payment Gateway',
      email: 'payment.gateway@system.com',
      type: 'Application',
      role: 'System',
      status: 'active',
      lastLogin: '2024-03-10T09:15:00',
      createdAt: '2024-02-01',
      apiKey: 'pk_test_51NcezpLkdIwcKRf...'
    },
    {
      id: 4,
      name: 'Notification Service',
      email: 'notifications@system.com',
      type: 'Application',
      role: 'System',
      status: 'active',
      lastLogin: '2024-03-16T08:30:00',
      createdAt: '2024-02-15',
      apiKey: 'sk_live_51NcezpLkdIwcKRf...'
    },
    {
      id: 5,
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      type: 'Human',
      role: 'Support',
      status: 'active',
      lastLogin: '2024-03-16T11:20:00',
      createdAt: '2024-02-20',
      phoneNumber: '+250789123458',
      department: 'Customer Support'
    },
    {
      id: 6,
      name: 'Michael Chen',
      email: 'm.chen@example.com',
      type: 'Human',
      role: 'Developer',
      status: 'active',
      lastLogin: '2024-03-16T09:15:00',
      createdAt: '2024-02-25',
      phoneNumber: '+250789123459',
      department: 'Engineering'
    },
    {
      id: 7,
      name: 'Analytics Service',
      email: 'analytics@system.com',
      type: 'Application',
      role: 'System',
      status: 'active',
      lastLogin: '2024-03-16T00:00:00',
      createdAt: '2024-03-01',
      apiKey: 'ak_test_51NcezpLkdIwcKRf...'
    },
    {
      id: 8,
      name: 'Emma Wilson',
      email: 'e.wilson@example.com',
      type: 'Human',
      role: 'Analyst',
      status: 'inactive',
      lastLogin: '2024-03-10T14:30:00',
      createdAt: '2024-03-05',
      phoneNumber: '+250789123460',
      department: 'Analytics'
    },
    {
      id: 9,
      name: 'Reporting Service',
      email: 'reports@system.com',
      type: 'Application',
      role: 'System',
      status: 'inactive',
      lastLogin: '2024-03-15T23:59:59',
      createdAt: '2024-03-10',
      apiKey: 'rk_test_51NcezpLkdIwcKRf...'
    },
    {
      id: 10,
      name: 'David Brown',
      email: 'd.brown@example.com',
      type: 'Human',
      role: 'Manager',
      status: 'active',
      lastLogin: '2024-03-16T12:00:00',
      createdAt: '2024-03-15',
      phoneNumber: '+250789123461',
      department: 'Sales'
    }
  ];

  constructor(private http: HttpClient) {}

  getMockUsers(): User[] {
    return this.mockUsers;
  }

  getUsers(): Observable<User[]> {
    // TODO: Replace with actual API call
    return of(this.mockUsers).pipe(delay(100));
  }

  getUserById(id: number): Observable<User | undefined> {
    // TODO: Replace with actual API call
    const user = this.mockUsers.find(u => u.id === id);
    return of(user).pipe(delay(500));
  }

  createUser(user: Omit<User, 'id' | 'lastLogin' | 'createdAt'>): Observable<User> {
    // TODO: Replace with actual API call
    const newUser: User = {
      ...user,
      id: Math.max(...this.mockUsers.map(u => u.id)) + 1,
      lastLogin: '-',
      createdAt: new Date().toISOString()
    };
    this.mockUsers.push(newUser);
    return of(newUser).pipe(delay(500));
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    // TODO: Replace with actual API call
    const index = this.mockUsers.findIndex(u => u.id === id);
    if (index !== -1) {
      this.mockUsers[index] = { ...this.mockUsers[index], ...user };
      return of(this.mockUsers[index]).pipe(delay(500));
    }
    throw new Error('User not found');
  }

  deleteUser(id: number): Observable<void> {
    // TODO: Replace with actual API call
    const index = this.mockUsers.findIndex(u => u.id === id);
    if (index !== -1) {
      this.mockUsers.splice(index, 1);
      return of(undefined).pipe(delay(500));
    }
    throw new Error('User not found');
  }
}
