import { Component, OnInit, OnDestroy, inject, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { SalesService } from '../sales.service';
import { Sale, SaleStats } from '../sale.model';
import { Subject, takeUntil } from 'rxjs';
import { RecordSaleModalComponent } from '../../../shared/components/record-sale-modal/record-sale-modal.component';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    FeatherIconComponent,
    DataTableComponent,
    RecordSaleModalComponent,
  ],
  template: `
    <div class="sales-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Milk Sales</h1>
          <p class="page-description">Manage all milk sales records to customers</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="openRecordSaleModal()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            Record Sale
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="droplet" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatVolume(stats.totalQuantity) }}</div>
            <div class="stat-label">Total Liters Sold</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="dollar-sign" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(stats.totalValue) }}</div>
            <div class="stat-label">Total Revenue</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="check-circle" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.statusCounts['accepted'] || 0 }}</div>
            <div class="stat-label">Accepted Sales</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="x-circle" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.statusCounts['rejected'] || 0 }}</div>
            <div class="stat-label">Rejected Sales</div>
          </div>
        </div>
      </div>

      <!-- Sales Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>All Sales</h3>
            <span class="sale-count">{{ sales.length }} sales</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredSales"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="sales.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)"
          >
            <ng-template #statusCell let-sale>
              <span class="status-badge" [ngClass]="'status-' + sale.status">
                {{ getStatusLabel(sale.status) }}
              </span>
            </ng-template>
            
            <ng-template #rowActions let-sale>
              <div class="dropdown" [class.show]="openDropdownId === sale.id">
                <button
                  class="btn btn-outline-secondary btn-sm dropdown-toggle"
                  type="button"
                  (click)="toggleDropdown(sale.id, $event)"
                >
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === sale.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewSale(sale)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View
                    </a>
                  </li>
                  <li *ngIf="sale.status === 'pending'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="approveSale(sale)">
                      <app-feather-icon name="check" size="14px" class="me-2"></app-feather-icon>
                      Approve
                    </a>
                  </li>
                  <li *ngIf="sale.status === 'pending'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="rejectSale(sale)">
                      <app-feather-icon name="x" size="14px" class="me-2"></app-feather-icon>
                      Reject
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="editSale(sale)">
                      <app-feather-icon name="edit" size="14px" class="me-2"></app-feather-icon>
                      Edit
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="deleteSale(sale)">
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

      <!-- Record Sale Modal -->
      <app-record-sale-modal
        *ngIf="showRecordSaleModal"
        (saleRecorded)="onSaleRecorded($event)"
        (modalClosed)="closeRecordSaleModal()"
      ></app-record-sale-modal>
    </div>
  `,
  styleUrls: ['./sales-list.component.scss'],
})
export class SalesListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private salesService = inject(SalesService);

  sales: Sale[] = [];
  filteredSales: Sale[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  error: string | null = null;

  stats: SaleStats = {
    totalQuantity: 0,
    totalValue: 0,
    totalSales: 0,
    statusCounts: {
      accepted: 0,
      rejected: 0,
      pending: 0,
      cancelled: 0,
    },
  };

  columns = [
    { key: 'index', title: 'No.', type: 'number' as const, sortable: false },
    { key: 'customerName', title: 'Customer', type: 'text' as const, sortable: true },
    { key: 'quantity', title: 'Quantity (L)', type: 'number' as const, sortable: true },
    { key: 'pricePerLiter', title: 'Price/Liter (RWF)', type: 'number' as const, sortable: true },
    { key: 'totalValue', title: 'Total Value (RWF)', type: 'number' as const, sortable: true },
    { key: 'status', title: 'Status', type: 'custom' as const, sortable: true, template: this.getStatusTemplate() },
    { key: 'saleAt', title: 'Sale Date', type: 'date' as const, sortable: true }
  ];

  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  openDropdownId: string | null = null;
  showRecordSaleModal: boolean = false;

  ngOnInit() {
    this.loadSales();
    document.addEventListener('click', this.onDocumentClick);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.onDocumentClick);
  }

  loadSales() {
    this.loading = true;
    this.error = null;
    this.salesService.getSales()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sales) => {
          this.loading = false;
          this.sales = sales || [];
          // Add index to each sale for the No. column
          this.sales = this.sales.map((sale, index) => ({
            ...sale,
            index: index + 1
          }));
          this.filteredSales = [...this.sales];
          this.loadStats();
        },
        error: (err) => {
          this.loading = false;
          this.error = err.message || 'Failed to load sales';
          console.error('Error loading sales:', err);
          this.loadMockSales(); // Load mock data for development
        }
      });
  }

  loadMockSales() {
    const now = new Date();
    this.sales = [
      {
        id: 'sale_001',
        customerId: 'CUST001',
        customerName: 'John Doe',
        customerPhone: '+250 788 123 456',
        quantity: 20.0,
        pricePerLiter: 500,
        totalValue: 10000,
        status: 'pending',
        saleAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
      },
      {
        id: 'sale_002',
        customerId: 'CUST002',
        customerName: 'Jane Smith',
        customerPhone: '+250 788 234 567',
        quantity: 15.5,
        pricePerLiter: 520,
        totalValue: 8060,
        status: 'accepted',
        saleAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000)
      },
      {
        id: 'sale_003',
        customerId: 'CUST003',
        customerName: 'Bob Johnson',
        customerPhone: '+250 788 345 678',
        quantity: 25.0,
        pricePerLiter: 480,
        totalValue: 12000,
        status: 'rejected',
        rejectionReason: 'Quality Issues',
        saleAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000)
      },
      {
        id: 'sale_004',
        customerId: 'CUST004',
        customerName: 'Alice Brown',
        customerPhone: '+250 788 456 789',
        quantity: 12.0,
        pricePerLiter: 510,
        totalValue: 6120,
        status: 'cancelled',
        rejectionReason: 'Customer cancelled',
        saleAt: new Date(now.getTime() - 7 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 7 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 7 * 60 * 60 * 1000)
      }
    ];
    this.filteredSales = [...this.sales];
    this.updatePagination();
    this.calculateStats();
  }

  loadStats() {
    this.salesService.getSaleStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stats = data;
        },
        error: (err) => {
          console.error('Error loading stats:', err);
          this.calculateStats(); // Fallback to calculate from loaded sales
        }
      });
  }

  calculateStats() {
    this.stats.totalSales = this.sales.length;
    this.stats.totalQuantity = this.sales.reduce((sum, s) => sum + s.quantity, 0);
    this.stats.totalValue = this.sales.reduce((sum, s) => sum + s.totalValue, 0);
    this.stats.statusCounts = { accepted: 0, rejected: 0, pending: 0, cancelled: 0 };
    this.sales.forEach(s => {
      if (this.stats.statusCounts.hasOwnProperty(s.status)) {
        this.stats.statusCounts[s.status as keyof typeof this.stats.statusCounts]++;
      }
    });
  }

  applyFilter() {
    const query = this.searchTerm.toLowerCase();
    const filtered = this.sales.filter(sale =>
      sale.customerName.toLowerCase().includes(query) ||
      sale.customerPhone.toLowerCase().includes(query) ||
      sale.status.toLowerCase().includes(query) ||
      sale.notes?.toLowerCase().includes(query)
    );
    this.filteredSales = filtered;
    this.updatePagination();
    this.currentPage = 1; // Reset to first page on filter
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredSales.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredSales = this.filteredSales.slice(startIndex, endIndex);
  }

  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    const { column: key, direction } = event;
    this.sales.sort((a, b) => {
      const aValue = (a as any)[key];
      const bValue = (b as any)[key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      if (aValue instanceof Date && bValue instanceof Date) {
        return direction === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
      }
      return 0;
    });
    this.updatePagination();
  }

  handlePageChange(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  handlePageSizeChange(pageSize: number) {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.updatePagination();
  }

  toggleDropdown(id: string, event: Event) {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === id ? null : id;
  }

  onDocumentClick = () => {
    this.openDropdownId = null;
  };

  viewSale(sale: Sale) {
    console.log('View sale:', sale);
    // TODO: Implement view sale modal/page
  }

  editSale(sale: Sale) {
    console.log('Edit sale:', sale);
    // TODO: Implement edit sale modal/page
  }

  approveSale(sale: Sale) {
    console.log('Approve sale:', sale);
    const updateRequest = { 
      saleId: sale.id, 
      status: 'accepted' as const,
      notes: 'Approved by user'
    };
    this.salesService.updateSale(updateRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadSales(),
        error: (err) => console.error('Error approving sale:', err)
      });
  }

  rejectSale(sale: Sale) {
    console.log('Reject sale:', sale);
    const rejectionReason = prompt('Enter rejection reason:');
    if (rejectionReason) {
      const updateRequest = { 
        saleId: sale.id, 
        status: 'rejected' as const,
        notes: `Rejected: ${rejectionReason}`
      };
      this.salesService.updateSale(updateRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.loadSales(),
          error: (err) => console.error('Error rejecting sale:', err)
        });
    }
  }

  cancelSale(sale: Sale) {
    console.log('Cancel sale:', sale);
    if (confirm('Are you sure you want to cancel this sale?')) {
      this.salesService.cancelSale(sale.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.loadSales(),
          error: (err) => console.error('Error cancelling sale:', err)
        });
    }
  }

  deleteSale(sale: Sale) {
    console.log('Delete sale:', sale);
    if (confirm('Are you sure you want to delete this sale?')) {
      // TODO: Implement delete sale API call
      console.log('Delete sale API not implemented yet');
    }
  }

  openRecordSaleModal() {
    this.showRecordSaleModal = true;
  }

  closeRecordSaleModal() {
    this.showRecordSaleModal = false;
  }

  onSaleRecorded(sale: Sale) {
    console.log('Sale recorded:', sale);
    this.closeRecordSaleModal();
    this.loadSales(); // Refresh the list
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  formatVolume(volume: number): string {
    return `${volume.toFixed(1)}L`;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  getStatusTemplate() {
    return (item: any) => {
      const status = item.status;
      const label = this.getStatusLabel(status);
      const statusClass = `status-${status}`;
      return `<span class="status-badge ${statusClass}">${label}</span>`;
    };
  }
}
