import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { Subject } from 'rxjs';

export interface LenderUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'officer' | 'analyst' | 'viewer';
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: Date;
  createdAt: Date;
  permissions: string[];
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="user-management">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>User Management</h1>
          <p class="page-description">Manage lender staff and user access</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="showAddModal()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            Add User
          </button>
        </div>
      </div>

      <!-- User Stats -->
      <div class="stats-grid" *ngIf="userStats">
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="users" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.total }}</div>
            <div class="stat-label">Total Users</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="check-circle" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.active }}</div>
            <div class="stat-label">Active Users</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="shield" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.admins }}</div>
            <div class="stat-label">Administrators</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="clock" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.online }}</div>
            <div class="stat-label">Online Now</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="roleFilter">Role</label>
            <select id="roleFilter" [(ngModel)]="selectedRole" (change)="filterUsers()">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="officer">Officer</option>
              <option value="analyst">Analyst</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="statusFilter">Status</label>
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterUsers()">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="searchInput">Search</label>
            <input 
              type="text" 
              id="searchInput" 
              [(ngModel)]="searchTerm" 
              (input)="filterUsers()"
              placeholder="Search by name, email..."
            />
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>Users</h3>
            <span class="user-count">{{ filteredUsers.length }} users</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredUsers"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="filteredUsers.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-user>
              <div class="dropdown" [class.show]="openDropdownId === user.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(user.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === user.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewUser(user)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View Details
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="editUser(user)">
                      <app-feather-icon name="edit" size="14px" class="me-2"></app-feather-icon>
                      Edit
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="resetPassword(user)">
                      <app-feather-icon name="key" size="14px" class="me-2"></app-feather-icon>
                      Reset Password
                    </a>
                  </li>
                  <li *ngIf="user.status === 'active'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="suspendUser(user)">
                      <app-feather-icon name="pause" size="14px" class="me-2"></app-feather-icon>
                      Suspend
                    </a>
                  </li>
                  <li *ngIf="user.status !== 'active'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="activateUser(user)">
                      <app-feather-icon name="play" size="14px" class="me-2"></app-feather-icon>
                      Activate
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="deleteUser(user)">
                      <app-feather-icon name="trash-2" size="14px" class="me-2"></app-feather-icon>
                      Delete
                    </a>
                  </li>
                </ul>
              </div>
            </ng-template>
          </app-data-table>
        </div>
      </div>

      <!-- Add/Edit User Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingUser ? 'Edit' : 'Add' }} User</h3>
            <button class="close-btn" (click)="closeModal()">
              <app-feather-icon name="x" size="20px"></app-feather-icon>
            </button>
          </div>
          
          <form [formGroup]="userForm" (ngSubmit)="saveUser()">
            <div class="modal-content">
              <div class="form-row">
                <div class="form-group">
                  <label for="userName">Full Name <span class="required">*</span></label>
                  <input 
                    type="text" 
                    id="userName" 
                    formControlName="name"
                    placeholder="Enter full name"
                  />
                </div>

                <div class="form-group">
                  <label for="userEmail">Email <span class="required">*</span></label>
                  <input 
                    type="email" 
                    id="userEmail" 
                    formControlName="email"
                    placeholder="Enter email"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="userPhone">Phone <span class="required">*</span></label>
                  <input 
                    type="tel" 
                    id="userPhone" 
                    formControlName="phone"
                    placeholder="+250788000000"
                  />
                </div>

                <div class="form-group">
                  <label for="userRole">Role <span class="required">*</span></label>
                  <select id="userRole" formControlName="role">
                    <option value="">Select role</option>
                    <option value="admin">Administrator</option>
                    <option value="manager">Manager</option>
                    <option value="officer">Loan Officer</option>
                    <option value="analyst">Analyst</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="userDepartment">Department</label>
                <input 
                  type="text" 
                  id="userDepartment" 
                  formControlName="department"
                  placeholder="Enter department"
                />
              </div>

              <div class="form-group" *ngIf="!editingUser">
                <label for="userPassword">Password <span class="required">*</span></label>
                <input 
                  type="password" 
                  id="userPassword" 
                  formControlName="password"
                  placeholder="Enter password"
                />
              </div>

              <div class="form-group">
                <label>Permissions</label>
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="canViewLoans" />
                    View Loans
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="canEditLoans" />
                    Edit Loans
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="canApproveLoans" />
                    Approve Loans
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="canDisburseLoans" />
                    Disburse Loans
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="canViewReports" />
                    View Reports
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="canManageUsers" />
                    Manage Users
                  </label>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="userForm.invalid">
                <app-feather-icon name="save" size="16px"></app-feather-icon>
                Save User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  users: LenderUser[] = [];
  filteredUsers: LenderUser[] = [];
  editingUser: LenderUser | null = null;
  showModal = false;
  
  // Filters
  selectedRole = '';
  selectedStatus = '';
  searchTerm = '';
  
  // Stats
  userStats: {
    total: number;
    active: number;
    admins: number;
    online: number;
  } | null = null;
  
  // Form
  userForm: FormGroup;
  
  // Table
  columns: any[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  openDropdownId: string | null = null;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      role: ['', [Validators.required]],
      department: [''],
      password: [''],
      canViewLoans: [true],
      canEditLoans: [false],
      canApproveLoans: [false],
      canDisburseLoans: [false],
      canViewReports: [true],
      canManageUsers: [false]
    });
  }

  ngOnInit() {
    this.initializeColumns();
    this.loadUsers();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeColumns() {
    this.columns = [
      { key: 'name', title: 'Name', type: 'text', sortable: true },
      { key: 'email', title: 'Email', type: 'text', sortable: true },
      { key: 'phone', title: 'Phone', type: 'text', sortable: true },
      { key: 'role', title: 'Role', type: 'text', sortable: true },
      { key: 'department', title: 'Department', type: 'text', sortable: true },
      { key: 'status', title: 'Status', type: 'status', sortable: true },
      { key: 'lastLogin', title: 'Last Login', type: 'date', sortable: true }
    ];
  }

  private loadUsers() {
    this.loading = true;
    
    // Mock users
    this.users = [
      {
        id: 'USER-001',
        name: 'John Doe',
        email: 'john.doe@lender.rw',
        phone: '+250788111111',
        role: 'admin',
        department: 'Administration',
        status: 'active',
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
        createdAt: new Date('2024-01-15'),
        permissions: ['all']
      },
      {
        id: 'USER-002',
        name: 'Jane Smith',
        email: 'jane.smith@lender.rw',
        phone: '+250788222222',
        role: 'manager',
        department: 'Operations',
        status: 'active',
        lastLogin: new Date(Date.now() - 5 * 60 * 60 * 1000),
        createdAt: new Date('2024-01-20'),
        permissions: ['view_loans', 'edit_loans', 'approve_loans']
      },
      {
        id: 'USER-003',
        name: 'Bob Johnson',
        email: 'bob.johnson@lender.rw',
        phone: '+250788333333',
        role: 'officer',
        department: 'Lending',
        status: 'active',
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
        createdAt: new Date('2024-02-01'),
        permissions: ['view_loans', 'edit_loans']
      }
    ];
    
    this.calculateStats();
    this.filterUsers();
    this.loading = false;
  }

  private calculateStats() {
    this.userStats = {
      total: this.users.length,
      active: this.users.filter(u => u.status === 'active').length,
      admins: this.users.filter(u => u.role === 'admin').length,
      online: this.users.filter(u => u.lastLogin && (Date.now() - new Date(u.lastLogin).getTime()) < 3600000).length
    };
  }

  filterUsers() {
    let filtered = [...this.users];

    if (this.selectedRole) {
      filtered = filtered.filter(u => u.role === this.selectedRole);
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(u => u.status === this.selectedStatus);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.phone.includes(term)
      );
    }

    this.filteredUsers = filtered;
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
  }

  showAddModal() {
    this.editingUser = null;
    this.userForm.reset();
    this.userForm.patchValue({
      canViewLoans: true,
      canViewReports: true
    });
    this.showModal = true;
  }

  editUser(user: LenderUser) {
    this.closeDropdown();
    this.editingUser = user;
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      canViewLoans: user.permissions.includes('view_loans'),
      canEditLoans: user.permissions.includes('edit_loans'),
      canApproveLoans: user.permissions.includes('approve_loans'),
      canDisburseLoans: user.permissions.includes('disburse_loans'),
      canViewReports: user.permissions.includes('view_reports'),
      canManageUsers: user.permissions.includes('manage_users')
    });
    this.showModal = true;
  }

  saveUser() {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const permissions: string[] = [];
      
      if (formValue.canViewLoans) permissions.push('view_loans');
      if (formValue.canEditLoans) permissions.push('edit_loans');
      if (formValue.canApproveLoans) permissions.push('approve_loans');
      if (formValue.canDisburseLoans) permissions.push('disburse_loans');
      if (formValue.canViewReports) permissions.push('view_reports');
      if (formValue.canManageUsers) permissions.push('manage_users');
      
      if (this.editingUser) {
        const index = this.users.findIndex(u => u.id === this.editingUser!.id);
        if (index !== -1) {
          this.users[index] = {
            ...this.users[index],
            ...formValue,
            permissions: permissions
          };
        }
      } else {
        const newUser: LenderUser = {
          id: `USER-${Date.now()}`,
          name: formValue.name,
          email: formValue.email,
          phone: formValue.phone,
          role: formValue.role,
          department: formValue.department,
          status: 'active',
          createdAt: new Date(),
          permissions: permissions
        };
        this.users.unshift(newUser);
      }
      
      this.calculateStats();
      this.filterUsers();
      this.closeModal();
    }
  }

  activateUser(user: LenderUser) {
    this.closeDropdown();
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users[index].status = 'active';
      this.calculateStats();
      this.filterUsers();
    }
  }

  suspendUser(user: LenderUser) {
    this.closeDropdown();
    if (confirm(`Suspend user ${user.name}?`)) {
      const index = this.users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        this.users[index].status = 'suspended';
        this.calculateStats();
        this.filterUsers();
      }
    }
  }

  deleteUser(user: LenderUser) {
    this.closeDropdown();
    if (confirm(`Delete user ${user.name}?`)) {
      this.users = this.users.filter(u => u.id !== user.id);
      this.calculateStats();
      this.filterUsers();
    }
  }

  resetPassword(user: LenderUser) {
    this.closeDropdown();
    if (confirm(`Reset password for ${user.name}?`)) {
      alert('Password reset email sent to user');
    }
  }

  viewUser(user: LenderUser) {
    this.closeDropdown();
    console.log('View user:', user.id);
    alert(`User Details:\nName: ${user.name}\nRole: ${user.role}\nStatus: ${user.status}`);
  }

  closeModal() {
    this.showModal = false;
    this.editingUser = null;
    this.userForm.reset();
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    const { column, direction } = event;
    
    this.filteredUsers.sort((a, b) => {
      let aValue: any = (a as any)[column];
      let bValue: any = (b as any)[column];
      
      if (column.includes('Date') || column.includes('Login')) {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }
      
      if (typeof aValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  handlePageChange(page: number) {
    this.currentPage = page;
  }

  handlePageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  // Dropdown handlers
  toggleDropdown(userId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === userId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = userId;
    }
  }

  closeDropdown() {
    this.openDropdownId = null;
  }

  private setupEventListeners() {
    document.addEventListener('click', () => {
      this.closeDropdown();
    });
  }
}

