import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { TableColumn } from '../../shared/components/data-table/data-table.component';

import { LogService, Log, LogLevel } from '../../core/services/log.service';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="dashboard-container">
      <!-- Filter Card -->
      <div class="card filter-card mb-4">
        <div class="card-header">
          <h5 class="card-title mb-0 d-flex align-items-center">
            <app-feather-icon name="filter" size="18px" class="me-2"></app-feather-icon>
            Filters
          </h5>
        </div>
        <div class="card-body">
          <form (ngSubmit)="applyFilters()" class="row g-3">
            <!-- Status Filter -->
            <div class="col-md-3">
              <label for="statusFilter" class="form-label">Status</label>
              <select id="statusFilter" class="form-select" [(ngModel)]="filters.status" name="status">
                <option value="">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
              </select>
            </div>

            <!-- Date Range Filter -->
            <div class="col-md-3">
              <label for="startDate" class="form-label">Start Date</label>
              <input type="date" id="startDate" class="form-control" [(ngModel)]="filters.startDate" name="startDate">
            </div>

            <div class="col-md-3">
              <label for="endDate" class="form-label">End Date</label>
              <input type="date" id="endDate" class="form-control" [(ngModel)]="filters.endDate" name="endDate">
            </div>

            <!-- Transaction Type Filter -->
            <div class="col-md-3">
              <label for="transactionType" class="form-label">Transaction Type</label>
              <select id="transactionType" class="form-select" [(ngModel)]="filters.transactionType" name="transactionType">
                <option value="">All Types</option>
                <option value="PUSH">Push</option>
                <option value="PULL">Pull</option>
                <option value="INTERNAL">Internal</option>
              </select>
            </div>

            <!-- Action Buttons -->
            <div class="col-12">
              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary">
                  <app-feather-icon name="search" size="14px" class="me-1"></app-feather-icon>
                  Apply Filters
                </button>
                <button type="button" class="btn btn-outline-secondary" (click)="clearFilters()">
                  <app-feather-icon name="x" size="14px" class="me-1"></app-feather-icon>
                  Clear
                </button>
                <button type="button" class="btn btn-outline-primary" (click)="exportLogs()">
                  <app-feather-icon name="download" size="14px" class="me-1"></app-feather-icon>
                  Export
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Logs Table Card -->
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h4 class="card-title mb-0">System Logs</h4>
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted small">Showing {{ filteredLogs.length }} of {{ logs.length }} logs</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredLogs"
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

    .filter-card {
      background: white;
      border: 1px solid #e5e7eb;
    }

    .filter-card .card-header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
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

    .btn-outline-secondary {
      color: #1b2e4b;
      border-color: #e5e7eb;

      &:hover {
        background-color: #f8fafc;
        border-color: #1b2e4b;
      }

      app-feather-icon {
        color: #1b2e4b;
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

      .badge-info {
        color: #fff;
        background-color: #3498db;
      }

      .badge-warning {
        color: #fff;
        background-color: #f1c40f;
      }

      .badge-danger {
        color: #fff;
        background-color: #e74c3c;
      }

      .badge-secondary {
        color: #fff;
        background-color: #95a5a6;
      }
    }
  `]
})
export class LogsComponent implements OnInit {
  logLevelTemplate = (item: Log) => `
    <span class="badge ${this.getLogLevelClass(item.level)}">
      ${item.level}
    </span>
  `;

  columns: TableColumn[] = [
    { key: 'timestamp', title: 'Timestamp', type: 'date', sortable: true },
    { key: 'level', title: 'Level', type: 'custom', sortable: true, template: this.logLevelTemplate },
    { key: 'source', title: 'Source', type: 'text', sortable: true },
    { key: 'message', title: 'Message', type: 'text', sortable: true },
    { key: 'userId', title: 'User', type: 'text', sortable: true },
    { key: 'entityId', title: 'Entity', type: 'text', sortable: true },
    { key: 'transactionId', title: 'Transaction', type: 'text', sortable: true }
  ];

  logs: Log[] = [];
  filteredLogs: Log[] = [];
  logLevels: LogLevel[] = [];

  filters = {
    status: '',
    startDate: '',
    endDate: '',
    transactionType: ''
  };

  constructor(private logService: LogService) {
    this.logLevels = this.logService.getLogLevels();
  }

  ngOnInit() {
    this.logs = this.logService.getMockLogs();
    this.filteredLogs = [...this.logs];
  }

  getLogLevelClass(level: LogLevel): string {
    switch (level) {
      case 'INFO': return 'badge-info';
      case 'WARNING': return 'badge-warning';
      case 'ERROR': return 'badge-danger';
      case 'DEBUG': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  applyFilters() {
    this.filteredLogs = this.logs.filter(log => {
      // Status filter
      if (this.filters.status && log.level !== this.filters.status) {
        return false;
      }

      // Date range filter
      if (this.filters.startDate || this.filters.endDate) {
        const logDate = new Date(log.timestamp);
        const startDate = this.filters.startDate ? new Date(this.filters.startDate) : null;
        const endDate = this.filters.endDate ? new Date(this.filters.endDate) : null;

        if (startDate && logDate < startDate) {
          return false;
        }
        if (endDate && logDate > endDate) {
          return false;
        }
      }

      // Transaction type filter (assuming transaction type is in the message or source)
      if (this.filters.transactionType) {
        const message = log.message.toLowerCase();
        const source = log.source.toLowerCase();
        const type = this.filters.transactionType.toLowerCase();
        
        if (!message.includes(type) && !source.includes(type)) {
          return false;
        }
      }

      return true;
    });
  }

  clearFilters() {
    this.filters = {
      status: '',
      startDate: '',
      endDate: '',
      transactionType: ''
    };
    this.filteredLogs = [...this.logs];
  }

  exportLogs() {
    // TODO: Implement log export
    console.log('Export logs');
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
