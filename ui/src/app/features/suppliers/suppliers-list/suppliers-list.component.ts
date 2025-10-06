import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SuppliersService } from '../suppliers.service';
import { Supplier } from '../supplier.model';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { AddSupplierModalComponent } from '../../../shared/components/add-supplier-modal/add-supplier-modal.component';

@Component({
  selector: 'app-suppliers-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent, AddSupplierModalComponent],
  template: `
    <div class="suppliers-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Suppliers</h1>
          <p class="page-description">Manage your milk suppliers and collection schedules</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="openAddSupplierModal()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            Add Supplier
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="truck" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalSuppliers }}</div>
            <div class="stat-label">Total Suppliers</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="user-check" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.activeSuppliers }}</div>
            <div class="stat-label">Active Suppliers</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="dollar-sign" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(stats.averagePrice) }}</div>
            <div class="stat-label">Avg Price/Liter</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="droplet" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatVolume(stats.totalProduction) }}</div>
            <div class="stat-label">Total Production</div>
          </div>
        </div>
      </div>

      <!-- Suppliers Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>All Suppliers</h3>
            <span class="supplier-count">{{ suppliers.length }} suppliers</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredSuppliers"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="suppliers.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-supplier>
              <div class="dropdown" [class.show]="openDropdownId === supplier.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(supplier.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === supplier.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewSupplier(supplier)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="editSupplier(supplier)">
                      <app-feather-icon name="edit" size="14px" class="me-2"></app-feather-icon>
                      Edit
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="deleteSupplier(supplier)">
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

      <!-- Add Supplier Modal -->
      <app-add-supplier-modal 
        *ngIf="showAddSupplierModal"
        (supplierAdded)="onSupplierAdded($event)"
        (modalClosed)="closeAddSupplierModal()">
      </app-add-supplier-modal>
    </div>
  `,
  styleUrls: ['./suppliers-list.component.scss']
})
export class SuppliersListComponent implements OnInit {
  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  stats: any = {};
  loading = false;
  error: string | null = null;
  showAddSupplierModal = false;

  columns: any[] = [];
  
  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  
  // Dropdown state
  openDropdownId: string | null = null;

  constructor(private suppliersService: SuppliersService) {}

  ngOnInit() {
    this.initializeColumns();
    this.loadSuppliers();
    this.loadStats();
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      this.closeDropdown();
    });
  }

  initializeColumns() {
    this.columns = [
      { key: 'index', title: 'No.', type: 'number', sortable: false },
      { key: 'name', title: 'Supplier', type: 'text', sortable: true },
      { key: 'phone', title: 'Phone', type: 'text', sortable: true },
      { key: 'location', title: 'Location', type: 'text', sortable: true },
      { key: 'sellingPricePerLiter', title: 'Price/Liter (RWF)', type: 'number', sortable: true },
      { key: 'dailyProduction', title: 'Daily Production (L)', type: 'number', sortable: true },
      { key: 'businessType', title: 'Business Type', type: 'text', sortable: true },
      { key: 'isActive', title: 'Status', type: 'status', sortable: true }
    ];
  }

  loadSuppliers() {
    this.loading = true;
    this.error = null;
    
    this.suppliersService.getSuppliers().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.code === 200 && response.data) {
          this.suppliers = response.data;
          // Add index to each supplier for the No. column
          this.suppliers = this.suppliers.map((supplier, index) => ({
            ...supplier,
            index: index + 1
          }));
          this.filteredSuppliers = [...this.suppliers];
          this.loadStats();
        } else {
          this.error = response.message || 'Failed to load suppliers';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.message || 'Failed to load suppliers';
        console.error('Error loading suppliers:', error);
      }
    });
  }

  loadStats() {
    this.stats = {
      totalSuppliers: this.suppliers.length,
      activeSuppliers: this.suppliers.filter(s => s.isActive).length,
      averagePrice: this.suppliers.length > 0 ? 
        this.suppliers.reduce((sum, s) => sum + (s.sellingPricePerLiter || 0), 0) / this.suppliers.length : 0,
      totalProduction: this.suppliers.reduce((sum, s) => sum + (s.dailyProduction || 0), 0)
    };
  }

  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    // TODO: Implement sorting
    console.log('Sort:', event);
  }

  handlePageChange(page: number) {
    this.currentPage = page;
  }

  handlePageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  viewSupplier(supplier: Supplier) {
    this.closeDropdown();
    console.log('View supplier:', supplier);
  }

  editSupplier(supplier: Supplier) {
    this.closeDropdown();
    console.log('Edit supplier:', supplier);
  }

  deleteSupplier(supplier: Supplier) {
    this.closeDropdown();
    console.log('Delete supplier:', supplier);
  }

  toggleDropdown(supplierId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === supplierId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = supplierId;
    }
  }

  closeDropdown() {
    this.openDropdownId = null;
  }

  openAddSupplierModal() {
    this.showAddSupplierModal = true;
  }

  closeAddSupplierModal() {
    this.showAddSupplierModal = false;
  }

  onSupplierAdded(supplierData: any) {
    console.log('Supplier added:', supplierData);
    // Reload suppliers from API
    this.loadSuppliers();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount);
  }

  formatVolume(volume: number): string {
    return `${volume.toFixed(1)}L`;
  }
}
