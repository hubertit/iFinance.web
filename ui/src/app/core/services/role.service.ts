import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Permission {
  id: number;
  name: string;
  description: string;
  module: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive';
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private mockRoles: Role[] = [
    {
      id: 1,
      name: 'Super Admin',
      description: 'Full system access',
      permissions: [
        { id: 1, name: 'CREATE_USER', description: 'Create new users', module: 'Users' },
        { id: 2, name: 'EDIT_USER', description: 'Edit existing users', module: 'Users' },
        { id: 3, name: 'DELETE_USER', description: 'Delete users', module: 'Users' },
        { id: 4, name: 'VIEW_REPORTS', description: 'View all reports', module: 'Reports' }
      ],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      status: 'active'
    },
    {
      id: 2,
      name: 'Admin',
      description: 'Administrative access with some restrictions',
      permissions: [
        { id: 1, name: 'CREATE_USER', description: 'Create new users', module: 'Users' },
        { id: 2, name: 'EDIT_USER', description: 'Edit existing users', module: 'Users' },
        { id: 4, name: 'VIEW_REPORTS', description: 'View all reports', module: 'Reports' }
      ],
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15',
      status: 'active'
    },
    {
      id: 3,
      name: 'User Manager',
      description: 'Manage users and their permissions',
      permissions: [
        { id: 1, name: 'CREATE_USER', description: 'Create new users', module: 'Users' },
        { id: 2, name: 'EDIT_USER', description: 'Edit existing users', module: 'Users' }
      ],
      createdAt: '2024-02-01',
      updatedAt: '2024-02-01',
      status: 'active'
    },
    {
      id: 4,
      name: 'Report Viewer',
      description: 'View and export reports',
      permissions: [
        { id: 4, name: 'VIEW_REPORTS', description: 'View all reports', module: 'Reports' }
      ],
      createdAt: '2024-02-15',
      updatedAt: '2024-02-15',
      status: 'active'
    }
  ];

  constructor(private http: HttpClient) {}

  getRoles(): Observable<Role[]> {
    // TODO: Replace with actual API call
    return of(this.mockRoles).pipe(delay(100));
  }

  getPermissions(): Observable<Permission[]> {
    // TODO: Replace with actual API call
    const allPermissions = Array.from(
      new Set(this.mockRoles.flatMap(role => role.permissions))
    );
    return of(allPermissions).pipe(delay(100));
  }
}
