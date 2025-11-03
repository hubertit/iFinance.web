import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { LenderService, LoanProduct } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

export interface InterestRate {
  id: string;
  productId: string;
  productName: string;
  baseRate: number;
  minRate: number;
  maxRate: number;
  effectiveRate: number;
  rateType: 'fixed' | 'variable';
  applicableFrom: Date;
  applicableTo?: Date;
  status: 'active' | 'inactive' | 'archived';
  createdBy?: string;
  createdAt: Date;
}

@Component({
  selector: 'app-interest-rates',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="interest-rates">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Interest Rates</h1>
          <p class="page-description">Manage interest rate structures and configurations</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="showAddModal()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            Add Rate
          </button>
        </div>
      </div>

      <!-- Rate Stats -->
      <div class="stats-grid" *ngIf="rateStats">
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="percent" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ rateStats.averageRate }}%</div>
            <div class="stat-label">Average Rate</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="check-circle" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ rateStats.active }}</div>
            <div class="stat-label">Active Rates</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="trending-up" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ rateStats.maxRate }}%</div>
            <div class="stat-label">Highest Rate</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="trending-down" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ rateStats.minRate }}%</div>
            <div class="stat-label">Lowest Rate</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="statusFilter">Status</label>
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterRates()">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="typeFilter">Rate Type</label>
            <select id="typeFilter" [(ngModel)]="selectedType" (change)="filterRates()">
              <option value="">All Types</option>
              <option value="fixed">Fixed</option>
              <option value="variable">Variable</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="searchInput">Search</label>
            <input 
              type="text" 
              id="searchInput" 
              [(ngModel)]="searchTerm" 
              (input)="filterRates()"
              placeholder="Search by product name..."
            />
          </div>
        </div>
      </div>

      <!-- Rates Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>Interest Rates</h3>
            <span class="rate-count">{{ filteredRates.length }} rates</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredRates"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="filteredRates.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-rate>
              <div class="dropdown" [class.show]="openDropdownId === rate.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(rate.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === rate.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="editRate(rate)">
                      <app-feather-icon name="edit" size="14px" class="me-2"></app-feather-icon>
                      Edit
                    </a>
                  </li>
                  <li *ngIf="rate.status === 'active'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="deactivateRate(rate)">
                      <app-feather-icon name="pause" size="14px" class="me-2"></app-feather-icon>
                      Deactivate
                    </a>
                  </li>
                  <li *ngIf="rate.status === 'inactive'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="activateRate(rate)">
                      <app-feather-icon name="play" size="14px" class="me-2"></app-feather-icon>
                      Activate
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="deleteRate(rate)">
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

      <!-- Add/Edit Rate Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingRate ? 'Edit' : 'Add' }} Interest Rate</h3>
            <button class="close-btn" (click)="closeModal()">
              <app-feather-icon name="x" size="20px"></app-feather-icon>
            </button>
          </div>
          
          <form [formGroup]="rateForm" (ngSubmit)="saveRate()">
            <div class="modal-content">
              <div class="form-group">
                <label for="productId">Loan Product <span class="required">*</span></label>
                <select id="productId" formControlName="productId">
                  <option value="">Select product</option>
                  <option *ngFor="let product of products" [value]="product.id">
                    {{ product.name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="baseRate">Base Rate (%) <span class="required">*</span></label>
                <input 
                  type="number" 
                  id="baseRate" 
                  formControlName="baseRate"
                  placeholder="Enter base rate"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="minRate">Min Rate (%)</label>
                  <input 
                    type="number" 
                    id="minRate" 
                    formControlName="minRate"
                    placeholder="Min"
                    step="0.1"
                    min="0"
                    max="100"
                  />
                </div>

                <div class="form-group">
                  <label for="maxRate">Max Rate (%)</label>
                  <input 
                    type="number" 
                    id="maxRate" 
                    formControlName="maxRate"
                    placeholder="Max"
                    step="0.1"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div class="form-group">
                <label for="rateType">Rate Type <span class="required">*</span></label>
                <select id="rateType" formControlName="rateType">
                  <option value="">Select type</option>
                  <option value="fixed">Fixed</option>
                  <option value="variable">Variable</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="applicableFrom">Applicable From <span class="required">*</span></label>
                  <input 
                    type="date" 
                    id="applicableFrom" 
                    formControlName="applicableFrom"
                  />
                </div>

                <div class="form-group">
                  <label for="applicableTo">Applicable To</label>
                  <input 
                    type="date" 
                    id="applicableTo" 
                    formControlName="applicableTo"
                  />
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="rateForm.invalid">
                <app-feather-icon name="save" size="16px"></app-feather-icon>
                Save Rate
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./interest-rates.component.scss']
})
export class InterestRatesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  rates: InterestRate[] = [];
  filteredRates: InterestRate[] = [];
  products: LoanProduct[] = [];
  editingRate: InterestRate | null = null;
  showModal = false;
  
  // Filters
  selectedStatus = '';
  selectedType = '';
  searchTerm = '';
  
  // Stats
  rateStats: {
    averageRate: number;
    active: number;
    maxRate: number;
    minRate: number;
  } | null = null;
  
  // Form
  rateForm: FormGroup;
  
  // Table
  columns: any[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  openDropdownId: string | null = null;

  constructor(
    private lenderService: LenderService,
    private fb: FormBuilder
  ) {
    this.rateForm = this.fb.group({
      productId: ['', [Validators.required]],
      baseRate: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      minRate: ['', [Validators.min(0), Validators.max(100)]],
      maxRate: ['', [Validators.min(0), Validators.max(100)]],
      rateType: ['', [Validators.required]],
      applicableFrom: ['', [Validators.required]],
      applicableTo: ['']
    });
  }

  ngOnInit() {
    this.initializeColumns();
    this.loadProducts();
    this.loadRates();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeColumns() {
    this.columns = [
      { key: 'productName', title: 'Product', type: 'text', sortable: true },
      { key: 'baseRate', title: 'Base Rate', type: 'number', sortable: true },
      { key: 'minRate', title: 'Min Rate', type: 'number', sortable: true },
      { key: 'maxRate', title: 'Max Rate', type: 'number', sortable: true },
      { key: 'rateType', title: 'Type', type: 'text', sortable: true },
      { key: 'status', title: 'Status', type: 'status', sortable: true },
      { key: 'applicableFrom', title: 'From Date', type: 'date', sortable: true }
    ];
  }

  private loadProducts() {
    this.lenderService.loanProducts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(products => {
        this.products = products;
      });
  }

  private loadRates() {
    this.loading = true;

    this.lenderService.loanProducts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(products => {
        this.rates = products.map(product => this.createRateFromProduct(product));
        this.calculateStats();
        this.filterRates();
        this.loading = false;
      });
  }

  private createRateFromProduct(product: LoanProduct): InterestRate {
    return {
      id: `RATE-${product.id}`,
      productId: product.id,
      productName: product.name,
      baseRate: product.interestRate,
      minRate: product.interestRate - 2,
      maxRate: product.interestRate + 2,
      effectiveRate: product.interestRate,
      rateType: Math.random() > 0.5 ? 'fixed' : 'variable',
      applicableFrom: product.createdAt,
      status: 'active',
      createdBy: 'System',
      createdAt: product.createdAt
    };
  }

  private calculateStats() {
    const activeRates = this.rates.filter(r => r.status === 'active');
    this.rateStats = {
      averageRate: activeRates.length > 0
        ? activeRates.reduce((sum, r) => sum + r.baseRate, 0) / activeRates.length
        : 0,
      active: activeRates.length,
      maxRate: activeRates.length > 0
        ? Math.max(...activeRates.map(r => r.baseRate))
        : 0,
      minRate: activeRates.length > 0
        ? Math.min(...activeRates.map(r => r.baseRate))
        : 0
    };
  }

  filterRates() {
    let filtered = [...this.rates];

    if (this.selectedStatus) {
      filtered = filtered.filter(r => r.status === this.selectedStatus);
    }

    if (this.selectedType) {
      filtered = filtered.filter(r => r.rateType === this.selectedType);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.productName.toLowerCase().includes(term)
      );
    }

    this.filteredRates = filtered;
    this.totalPages = Math.ceil(this.filteredRates.length / this.pageSize);
  }

  showAddModal() {
    this.editingRate = null;
    this.rateForm.reset();
    this.rateForm.patchValue({
      applicableFrom: new Date().toISOString().split('T')[0]
    });
    this.showModal = true;
  }

  editRate(rate: InterestRate) {
    this.closeDropdown();
    this.editingRate = rate;
    this.rateForm.patchValue({
      productId: rate.productId,
      baseRate: rate.baseRate,
      minRate: rate.minRate,
      maxRate: rate.maxRate,
      rateType: rate.rateType,
      applicableFrom: new Date(rate.applicableFrom).toISOString().split('T')[0],
      applicableTo: rate.applicableTo ? new Date(rate.applicableTo).toISOString().split('T')[0] : ''
    });
    this.showModal = true;
  }

  saveRate() {
    if (this.rateForm.valid) {
      const formValue = this.rateForm.value;
      const product = this.products.find(p => p.id === formValue.productId);
      
      if (this.editingRate) {
        const index = this.rates.findIndex(r => r.id === this.editingRate!.id);
        if (index !== -1) {
          this.rates[index] = {
            ...this.rates[index],
            ...formValue,
            productName: product?.name || this.rates[index].productName,
            effectiveRate: formValue.baseRate,
            applicableFrom: new Date(formValue.applicableFrom),
            applicableTo: formValue.applicableTo ? new Date(formValue.applicableTo) : undefined
          };
        }
      } else {
        const newRate: InterestRate = {
          id: `RATE-${Date.now()}`,
          productId: formValue.productId,
          productName: product?.name || '',
          baseRate: formValue.baseRate,
          minRate: formValue.minRate || formValue.baseRate,
          maxRate: formValue.maxRate || formValue.baseRate,
          effectiveRate: formValue.baseRate,
          rateType: formValue.rateType,
          applicableFrom: new Date(formValue.applicableFrom),
          applicableTo: formValue.applicableTo ? new Date(formValue.applicableTo) : undefined,
          status: 'active',
          createdBy: 'Current User',
          createdAt: new Date()
        };
        this.rates.unshift(newRate);
      }
      
      this.calculateStats();
      this.filterRates();
      this.closeModal();
    }
  }

  activateRate(rate: InterestRate) {
    this.closeDropdown();
    const index = this.rates.findIndex(r => r.id === rate.id);
    if (index !== -1) {
      this.rates[index].status = 'active';
      this.calculateStats();
      this.filterRates();
    }
  }

  deactivateRate(rate: InterestRate) {
    this.closeDropdown();
    if (confirm(`Deactivate interest rate for ${rate.productName}?`)) {
      const index = this.rates.findIndex(r => r.id === rate.id);
      if (index !== -1) {
        this.rates[index].status = 'inactive';
        this.calculateStats();
        this.filterRates();
      }
    }
  }

  deleteRate(rate: InterestRate) {
    this.closeDropdown();
    if (confirm(`Delete interest rate for ${rate.productName}?`)) {
      this.rates = this.rates.filter(r => r.id !== rate.id);
      this.calculateStats();
      this.filterRates();
    }
  }

  closeModal() {
    this.showModal = false;
    this.editingRate = null;
    this.rateForm.reset();
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    const { column, direction } = event;
    
    this.filteredRates.sort((a, b) => {
      let aValue: any = (a as any)[column];
      let bValue: any = (b as any)[column];
      
      if (column.includes('Date')) {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      if (typeof aValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
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
  toggleDropdown(rateId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === rateId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = rateId;
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

