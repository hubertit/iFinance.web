import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild, AfterContentInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  type?: 'text' | 'date' | 'number' | 'boolean' | 'custom' | 'status';
  template?: any;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="data-table-wrapper">
      <!-- Table Header Actions -->
      <div class="data-table-header" *ngIf="showHeader">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="d-flex align-items-center gap-2">
            <div class="search-box" *ngIf="showSearch">
              <input
                type="text"
                class="form-control"
                placeholder="Search..."
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearchChange()">
            </div>
            <ng-content select="[table-actions-left]"></ng-content>
          </div>
          <div class="d-flex align-items-center gap-2">
            <ng-content select="[table-actions-right]"></ng-content>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="loading-header">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
          <p class="loading-text">Loading data...</p>
        </div>
        
        <!-- Skeleton Table -->
        <div class="skeleton-table">
          <div class="skeleton-header">
            <div *ngFor="let col of columns" class="skeleton-header-cell"></div>
            <div *ngIf="showActions && rowActions" class="skeleton-header-cell actions-skeleton"></div>
          </div>
          <div class="skeleton-body">
            <div *ngFor="let row of [1,2,3,4,5]" class="skeleton-row">
              <div *ngFor="let col of columns" class="skeleton-cell"></div>
              <div *ngIf="showActions && rowActions" class="skeleton-cell actions-skeleton"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Table -->
      <div class="table-responsive" *ngIf="!loading">
        <table class="table" [class.table-hover]="hover" [class.table-striped]="striped">
          <thead>
            <tr>
              <th *ngFor="let col of columns" 
                  [class.sortable]="col.sortable"
                  (click)="col.sortable && sort(col.key)">
                {{ col.title }}
                <i *ngIf="col.sortable" class="sort-icon"
                   [class.asc]="sortColumn === col.key && sortDirection === 'asc'"
                   [class.desc]="sortColumn === col.key && sortDirection === 'desc'">
                </i>
              </th>
              <th *ngIf="showActions && rowActions" class="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of getPaginatedData(); let i = index" (click)="onRowClick.emit(item)" style="cursor: pointer;">
              <td *ngFor="let col of columns">
                <ng-container [ngSwitch]="col.type">
                  <ng-container *ngSwitchCase="'date'">
                    {{ item[col.key] | date:'medium' }}
                  </ng-container>
                  <ng-container *ngSwitchCase="'boolean'">
                    <span class="badge" [class.bg-success]="item[col.key]" [class.bg-danger]="!item[col.key]">
                      {{ item[col.key] ? 'Yes' : 'No' }}
                    </span>
                  </ng-container>
                  <ng-container *ngSwitchCase="'status'">
                    <span class="badge status-badge" 
                          [ngClass]="getStatusBadgeClass(item[col.key])">
                      {{ formatStatusValue(item[col.key]) }}
                    </span>
                  </ng-container>
                  <ng-container *ngSwitchCase="'custom'">
                    <ng-container *ngIf="col.template && typeof col.template === 'function'">
                      <span [innerHTML]="col.template(item, i)"></span>
                    </ng-container>
                    <ng-container *ngIf="col.template && typeof col.template !== 'function'">
                      <ng-container *ngTemplateOutlet="col.template; context: { $implicit: item }">
                      </ng-container>
                    </ng-container>
                  </ng-container>
                  <ng-container *ngSwitchDefault>
                    {{ item[col.key] }}
                  </ng-container>
                </ng-container>
              </td>
              <td *ngIf="showActions && rowActions" class="actions-column">
                <ng-container [ngTemplateOutlet]="rowActions" [ngTemplateOutletContext]="{ $implicit: item }">
                </ng-container>
              </td>
            </tr>
            <tr *ngIf="!getPaginatedData()?.length">
              <td [attr.colspan]="columns.length + (showActions && rowActions ? 1 : 0)" class="text-center py-4">
                {{ noDataMessage }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="data-table-footer d-flex justify-content-between align-items-center mt-3" *ngIf="showPagination">
        <div class="d-flex align-items-center gap-3">
          <div class="page-size">
            <select class="form-select" [ngModel]="pageSize" (ngModelChange)="onPageSizeChange.emit($event)">
              <option *ngFor="let size of pageSizes" [value]="size">{{ size }} per page</option>
            </select>
          </div>
          <div class="page-info text-muted small">
            Showing {{ ((currentPage - 1) * pageSize) + 1 }} to {{ (currentPage * pageSize) > filteredData.length ? filteredData.length : (currentPage * pageSize) }} of {{ filteredData.length }} entries
          </div>
        </div>
        <nav aria-label="Table navigation" *ngIf="totalPages > 1">
          <ul class="pagination mb-0">
            <li class="page-item" [class.disabled]="currentPage === 1">
              <a class="page-link" href="javascript:void(0)" (click)="onPageChange.emit(currentPage - 1)">Previous</a>
            </li>
            <li class="page-item" *ngFor="let page of getPages()" [class.active]="page === currentPage">
              <a class="page-link" href="javascript:void(0)" (click)="onPageChange.emit(page)">{{ page }}</a>
            </li>
            <li class="page-item" [class.disabled]="currentPage === totalPages">
              <a class="page-link" href="javascript:void(0)" (click)="onPageChange.emit(currentPage + 1)">Next</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  `,
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements AfterContentInit, OnChanges {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() showHeader = true;
  @Input() showSearch = true;
  @Input() showActions = true;
  @Input() showPagination = true;
  @Input() hover = true;
  @Input() striped = true;
  @Input() noDataMessage = 'No data available';
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSizes = [5, 10, 25, 50, 100];
  @Input() loading = false;

  @ContentChild('rowActions') rowActions!: TemplateRef<any>;

  @Output() onSort = new EventEmitter<{column: string, direction: 'asc' | 'desc'}>();
  @Output() onSearch = new EventEmitter<string>();
  @Output() onPageChange = new EventEmitter<number>();
  @Output() onPageSizeChange = new EventEmitter<number>();
  @Output() onRowClick = new EventEmitter<any>();

  searchTerm = '';
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  filteredData: any[] = [];

  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.onSort.emit({ column: this.sortColumn, direction: this.sortDirection });
  }

  ngAfterContentInit() {
    // Component initialization complete
    this.filteredData = [...this.data];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.filteredData = [...this.data];
      this.performSearch();
    }
  }

  performSearch() {
    if (!this.searchTerm.trim()) {
      this.filteredData = [...this.data];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredData = this.data.filter(item => {
        return this.columns.some(col => {
          const value = item[col.key];
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().includes(searchLower);
        });
      });
    }
    // Reset to first page when searching
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    this.onSearch.emit(this.searchTerm);
  }

  onSearchChange() {
    this.performSearch();
  }

  getPaginatedData() {
    if (!this.showPagination) {
      return this.filteredData;
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredData.slice(startIndex, endIndex);
  }

  getPages(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getStatusBadgeClass(value: any): string {
    if (!value) return 'badge-default';
    
    const val = String(value).toLowerCase();
    
    // Status badges
    if (val === 'pending' || val === 'pending review') {
      return 'badge-pending';
    }
    if (val === 'under_review' || val === 'under review') {
      return 'badge-under-review';
    }
    if (val === 'approved' || val === 'active' || val === 'success' || val === 'completed') {
      return 'badge-approved';
    }
    if (val === 'rejected' || val === 'error' || val === 'failed' || val === 'failure' || val === 'suspended') {
      return 'badge-rejected';
    }
    if (val === 'disbursed') {
      return 'badge-disbursed';
    }
    
    // Risk level badges
    if (val === 'low' || val === 'low risk') {
      return 'badge-low-risk';
    }
    if (val === 'medium' || val === 'medium risk') {
      return 'badge-medium-risk';
    }
    if (val === 'high' || val === 'high risk') {
      return 'badge-high-risk';
    }
    if (val === 'critical' || val === 'critical risk') {
      return 'badge-critical-risk';
    }
    
    // Default cases
    if (val === 'inactive' || val === 'processing') {
      return 'badge-inactive';
    }
    
    return 'badge-default';
  }

  formatStatusValue(value: any): string {
    if (!value) return '';
    
    const val = String(value);
    
    // Handle snake_case
    if (val.includes('_')) {
      return val.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    
    // Handle camelCase
    if (val !== val.toUpperCase() && val !== val.toLowerCase()) {
      return val.replace(/([A-Z])/g, ' $1').trim()
        .split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }
    
    // Default: capitalize first letter
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
  }
}
