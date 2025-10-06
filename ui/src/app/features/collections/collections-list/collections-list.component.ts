import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { RecordCollectionModalComponent } from '../../../shared/components/record-collection-modal/record-collection-modal.component';
import { CollectionsService } from '../collections.service';
import { Collection } from '../collection.model';

@Component({
  selector: 'app-collections-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent, RecordCollectionModalComponent],
  template: `
    <div class="collections-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Milk Collections</h1>
          <p class="page-description">Track and manage milk collection from suppliers</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="openRecordCollectionModal()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            Record Collection
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
            <div class="stat-value">{{ stats.totalCollections }}</div>
            <div class="stat-label">Total Collections</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="check-circle" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.statusCounts.accepted }}</div>
            <div class="stat-label">Accepted</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="clock" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.statusCounts.pending }}</div>
            <div class="stat-label">Pending</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="droplet" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatVolume(stats.totalQuantity) }}</div>
            <div class="stat-label">Total Volume</div>
          </div>
        </div>
      </div>

      <!-- Collections Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>All Collections</h3>
            <span class="collection-count">{{ collections.length }} collections</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredCollections"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="collections.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #statusCell let-collection>
              <span class="status-badge" [ngClass]="'status-' + collection.status">
                {{ getStatusLabel(collection.status) }}
              </span>
            </ng-template>
            
            <ng-template #rowActions let-collection>
              <div class="dropdown" [class.show]="openDropdownId === collection.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(collection.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === collection.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewCollection(collection)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View
                    </a>
                  </li>
                  <li *ngIf="collection.status === 'pending'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="approveCollection(collection)">
                      <app-feather-icon name="check" size="14px" class="me-2"></app-feather-icon>
                      Approve
                    </a>
                  </li>
                  <li *ngIf="collection.status === 'pending'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="rejectCollection(collection)">
                      <app-feather-icon name="x" size="14px" class="me-2"></app-feather-icon>
                      Reject
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="editCollection(collection)">
                      <app-feather-icon name="edit" size="14px" class="me-2"></app-feather-icon>
                      Edit
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="deleteCollection(collection)">
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

      <!-- Record Collection Modal -->
      <app-record-collection-modal 
        *ngIf="showRecordCollectionModal"
        (collectionRecorded)="onCollectionRecorded($event)"
        (modalClosed)="closeRecordCollectionModal()">
      </app-record-collection-modal>
    </div>
  `,
  styleUrls: ['./collections-list.component.scss']
})
export class CollectionsListComponent implements OnInit {
  collections: Collection[] = [];
  filteredCollections: Collection[] = [];
  stats: any = {};
  loading = false;
  error: string | null = null;
  showRecordCollectionModal = false;

  columns: any[] = [];
  
  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  
  // Dropdown state
  openDropdownId: string | null = null;

  constructor(private collectionsService: CollectionsService) {}

  ngOnInit() {
    this.initializeColumns();
    this.loadCollections();
    this.loadStats();
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      this.closeDropdown();
    });
  }

  initializeColumns() {
    this.columns = [
      { key: 'index', title: 'No.', type: 'number', sortable: false },
      { key: 'supplierName', title: 'Supplier', type: 'text', sortable: true },
      { key: 'quantity', title: 'Quantity (L)', type: 'number', sortable: true },
      { key: 'pricePerLiter', title: 'Price/Liter (RWF)', type: 'number', sortable: true },
      { key: 'totalValue', title: 'Total Value (RWF)', type: 'number', sortable: true },
      { key: 'status', title: 'Status', type: 'custom', sortable: true, template: this.getStatusTemplate() },
      { key: 'collectionDate', title: 'Collection Date', type: 'date', sortable: true }
    ];
  }

  loadCollections() {
    this.loading = true;
    this.error = null;
    
    this.collectionsService.getCollections().subscribe({
      next: (collections) => {
        this.loading = false;
        this.collections = collections || [];
        // Add index to each collection for the No. column
        this.collections = this.collections.map((collection, index) => ({
          ...collection,
          index: index + 1
        }));
        this.filteredCollections = [...this.collections];
        this.loadStats();
      },
      error: (error) => {
        this.loading = false;
        this.error = error.message || 'Failed to load collections';
        console.error('Error loading collections:', error);
        
        // Load mock data for development
        this.loadMockCollections();
      }
    });
  }

  loadMockCollections() {
    // Mock data for development
    const now = new Date();
    this.collections = [
      {
        id: 'col_001',
        supplierId: 'SUP001',
        supplierName: 'Jean Baptiste',
        supplierPhone: '+250 788 123 456',
        quantity: 25.5,
        pricePerLiter: 400,
        totalValue: 10200,
        status: 'pending',
        collectionDate: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'col_002',
        supplierId: 'SUP002',
        supplierName: 'Marie Claire',
        supplierPhone: '+250 788 234 567',
        quantity: 30.0,
        pricePerLiter: 420,
        totalValue: 12600,
        status: 'accepted',
        collectionDate: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
      },
      {
        id: 'col_003',
        supplierId: 'SUP003',
        supplierName: 'Pierre Nkurunziza',
        supplierPhone: '+250 788 345 678',
        quantity: 15.0,
        pricePerLiter: 380,
        totalValue: 5700,
        status: 'rejected',
        rejectionReason: 'Poor Quality',
        collectionDate: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000)
      }
    ];
    // Add index to each collection for the No. column
    this.collections = this.collections.map((collection, index) => ({
      ...collection,
      index: index + 1
    }));
    this.filteredCollections = [...this.collections];
    this.loadStats();
  }

  loadStats() {
    this.stats = {
      totalCollections: this.collections.length,
      totalQuantity: this.collections.reduce((sum, c) => sum + c.quantity, 0),
      totalValue: this.collections.reduce((sum, c) => sum + c.totalValue, 0),
      statusCounts: {
        accepted: this.collections.filter(c => c.status === 'accepted').length,
        rejected: this.collections.filter(c => c.status === 'rejected').length,
        pending: this.collections.filter(c => c.status === 'pending').length,
        cancelled: this.collections.filter(c => c.status === 'cancelled').length,
      }
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

  viewCollection(collection: Collection) {
    this.closeDropdown();
    console.log('View collection:', collection);
  }

  editCollection(collection: Collection) {
    this.closeDropdown();
    console.log('Edit collection:', collection);
  }

  deleteCollection(collection: Collection) {
    this.closeDropdown();
    console.log('Delete collection:', collection);
  }

  approveCollection(collection: Collection) {
    this.closeDropdown();
    console.log('Approve collection:', collection);
  }

  rejectCollection(collection: Collection) {
    this.closeDropdown();
    console.log('Reject collection:', collection);
  }

  toggleDropdown(collectionId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === collectionId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = collectionId;
    }
  }

  closeDropdown() {
    this.openDropdownId = null;
  }

  openRecordCollectionModal() {
    this.showRecordCollectionModal = true;
  }

  closeRecordCollectionModal() {
    this.showRecordCollectionModal = false;
  }

  onCollectionRecorded(collectionData: any) {
    console.log('Collection recorded:', collectionData);
    // Reload collections from API
    this.loadCollections();
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