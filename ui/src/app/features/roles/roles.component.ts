import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FeatherIconComponent } from '../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { TableColumn } from '../../shared/components/data-table/data-table.component';

import { RoleService, Role } from '../../core/services/role.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="dashboard-container">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h4 class="card-title mb-0">Roles</h4>
              <div class="dropdown">
                <button class="btn btn-primary btn-sm d-flex align-items-center gap-2" type="button" id="addRoleDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                  <app-feather-icon name="plus" size="14px"></app-feather-icon>
                  Add Role
                </button>
                <ul class="dropdown-menu" aria-labelledby="addRoleDropdown">
                  <li>
                    <a class="dropdown-item d-flex align-items-center gap-2" (click)="openAddRoleModal('System')">
                      <app-feather-icon name="shield" size="14px"></app-feather-icon>
                      Add System Role
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item d-flex align-items-center gap-2" (click)="openAddRoleModal('Custom')">
                      <app-feather-icon name="users" size="14px"></app-feather-icon>
                      Add Custom Role
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div class="card-body">
              <app-data-table
                [columns]="columns"
                [data]="roles"
                [striped]="true"
                (onSort)="handleSort($event)"
                (onSearch)="handleSearch($event)"
                (onPageChange)="handlePageChange($event)"
                (onPageSizeChange)="handlePageSizeChange($event)"
              ></app-data-table>
            </div>
          </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 12px;
    }

    .card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .card-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      background-color: #fff;
    }

    .card-title {
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .card-body {
      padding: 1rem;
    }

    .btn-primary {
      background-color: #1b2e4b;
      border-color: #1b2e4b;

      &:hover {
        background-color: #3498db;
        border-color: #3498db;
      }

      app-feather-icon {
        color: white;
      }
    }

    :host ::ng-deep {
      .badge {
        padding: 0.35em 0.65em;
        font-size: 0.75em;
        font-weight: 500;
        border-radius: 0.25rem;
        text-align: center;
        white-space: nowrap;
        vertical-align: baseline;
      }

      .badge-primary {
        color: #fff;
        background-color: #1b2e4b;
      }

      .badge-info {
        color: #fff;
        background-color: #3498db;
      }
    }
  `]
})
export class RolesComponent implements OnInit {
  permissionCountTemplate = (item: Role) => `
    <span class="badge badge-info">
      ${item.permissions.length} permissions
    </span>
  `;

  columns: TableColumn[] = [
    { key: 'id', title: 'ID', type: 'text', sortable: true },
    { key: 'name', title: 'Name', type: 'text', sortable: true },
    { key: 'description', title: 'Description', type: 'text', sortable: true },
    { key: 'permissions', title: 'Permissions', type: 'custom', sortable: true, template: this.permissionCountTemplate },
    { key: 'status', title: 'Status', type: 'status', sortable: true },
    { key: 'createdAt', title: 'Created At', type: 'date', sortable: true },
    { key: 'updatedAt', title: 'Updated At', type: 'date', sortable: true }
  ];

  roles: Role[] = [];

  constructor(private roleService: RoleService) {}

  ngOnInit() {
    this.loadRoles();
  }

  private loadRoles() {
    this.roleService.getRoles().subscribe(roles => {
      this.roles = roles;
    });
  }

  openAddRoleModal(type: 'System' | 'Custom') {
    // TODO: Implement add role modal
    console.log('Open add role modal for type:', type);
  }

  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    // TODO: Implement sorting
    console.log('Sort:', event);
  }

  handleSearch(term: string) {
    // TODO: Implement search
    console.log('Search term:', term);
  }

  handlePageChange(page: number) {
    // TODO: Implement pagination
    console.log('Page:', page);
  }

  handlePageSizeChange(size: number) {
    // TODO: Implement page size change
    console.log('Page size:', size);
  }
}
