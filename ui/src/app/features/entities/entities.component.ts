import { Component, OnInit, AfterViewInit } from '@angular/core';
import { TableColumn } from '../../shared/components/data-table/data-table.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FeatherIconComponent } from '../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';

declare var $: any;

interface Entity {
  id: number;
  name: string;
  type: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-entities',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="dashboard-container">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h4 class="card-title mb-0">Entities</h4>
              <div class="dropdown">
                <button class="btn btn-primary btn-sm d-flex align-items-center gap-2" type="button" id="addEntityDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                  <app-feather-icon name="plus" size="14px"></app-feather-icon>
                  Add Entity
                </button>
                <ul class="dropdown-menu" aria-labelledby="addEntityDropdown">
                  <li>
                    <a class="dropdown-item d-flex align-items-center gap-2" (click)="openAddEntityModal('Financial')">
                      <app-feather-icon name="briefcase" size="14px"></app-feather-icon>
                      Add Financial Institution
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item d-flex align-items-center gap-2" (click)="openAddEntityModal('Payment')">
                      <app-feather-icon name="credit-card" size="14px"></app-feather-icon>
                      Add Payment Service
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div class="card-body">
              <app-data-table
                [columns]="columns"
                [data]="entities"
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
    .dashboard-container {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 16px;
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
  `]
})
export class EntitiesComponent implements OnInit, AfterViewInit {
  columns: TableColumn[] = [
    { key: 'id', title: 'ID', type: 'text', sortable: true },
    { key: 'name', title: 'Name', type: 'text', sortable: true },
    { key: 'type', title: 'Type', type: 'text', sortable: true },
    { key: 'status', title: 'Status', type: 'status', sortable: true },
    { key: 'createdAt', title: 'Created At', type: 'date', sortable: true },
    { key: 'updatedAt', title: 'Updated At', type: 'date', sortable: true }
  ];

  entities: Entity[] = [
    {
      id: 1,
      name: 'Bank A',
      type: 'Financial Institution',
      status: 'active',
      createdAt: '2024-03-15',
      updatedAt: '2024-03-15'
    },
    {
      id: 2,
      name: 'SACCO B',
      type: 'Cooperative',
      status: 'active',
      createdAt: '2024-03-14',
      updatedAt: '2024-03-15'
    },
    {
      id: 3,
      name: 'Payment Provider C',
      type: 'Payment Service',
      status: 'inactive',
      createdAt: '2024-03-13',
      updatedAt: '2024-03-14'
    }
  ];

  ngOnInit() {}

  ngAfterViewInit() {
    // DataTable initialization is handled by the DataTableComponent
  }

  openAddEntityModal(type: 'Financial' | 'Payment') {
    // TODO: Implement add entity modal
    console.log('Open add entity modal for type:', type);
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

  editEntity(entity: Entity) {
    // TODO: Implement edit entity
    console.log('Edit entity:', entity);
  }

  deleteEntity(entity: Entity) {
    // TODO: Implement delete entity
    console.log('Delete entity:', entity);
  }
}
