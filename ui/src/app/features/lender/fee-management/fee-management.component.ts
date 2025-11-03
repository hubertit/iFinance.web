import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { Subject } from 'rxjs';

export interface Fee {
  id: string;
  name: string;
  type: 'processing' | 'late_payment' | 'early_repayment' | 'administration' | 'other';
  calculationMethod: 'fixed' | 'percentage' | 'tiered';
  amount?: number;
  percentage?: number;
  minAmount?: number;
  maxAmount?: number;
  applicableTo: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt?: Date;
}

@Component({
  selector: 'app-fee-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="fee-management">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Fee Management</h1>
          <p class="page-description">Configure and manage loan fees</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="showAddModal()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            Add Fee
          </button>
        </div>
      </div>

      <!-- Fee Stats -->
      <div class="stats-grid" *ngIf="feeStats">
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="file-text" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ feeStats.total }}</div>
            <div class="stat-label">Total Fees</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="check-circle" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ feeStats.active }}</div>
            <div class="stat-label">Active Fees</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="dollar-sign" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ feeStats.fixedCount }}</div>
            <div class="stat-label">Fixed Fees</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="percent" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ feeStats.percentageCount }}</div>
            <div class="stat-label">Percentage Fees</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="typeFilter">Fee Type</label>
            <select id="typeFilter" [(ngModel)]="selectedType" (change)="filterFees()">
              <option value="">All Types</option>
              <option value="processing">Processing</option>
              <option value="late_payment">Late Payment</option>
              <option value="early_repayment">Early Repayment</option>
              <option value="administration">Administration</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="methodFilter">Calculation Method</label>
            <select id="methodFilter" [(ngModel)]="selectedMethod" (change)="filterFees()">
              <option value="">All Methods</option>
              <option value="fixed">Fixed</option>
              <option value="percentage">Percentage</option>
              <option value="tiered">Tiered</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="statusFilter">Status</label>
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterFees()">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="searchInput">Search</label>
            <input 
              type="text" 
              id="searchInput" 
              [(ngModel)]="searchTerm" 
              (input)="filterFees()"
              placeholder="Search by fee name..."
            />
          </div>
        </div>
      </div>

      <!-- Fees Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>Fees</h3>
            <span class="fee-count">{{ filteredFees.length }} fees</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredFees"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="filteredFees.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-fee>
              <div class="dropdown" [class.show]="openDropdownId === fee.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(fee.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === fee.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="editFee(fee)">
                      <app-feather-icon name="edit" size="14px" class="me-2"></app-feather-icon>
                      Edit
                    </a>
                  </li>
                  <li *ngIf="fee.status === 'active'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="deactivateFee(fee)">
                      <app-feather-icon name="pause" size="14px" class="me-2"></app-feather-icon>
                      Deactivate
                    </a>
                  </li>
                  <li *ngIf="fee.status === 'inactive'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="activateFee(fee)">
                      <app-feather-icon name="play" size="14px" class="me-2"></app-feather-icon>
                      Activate
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="deleteFee(fee)">
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

      <!-- Add/Edit Fee Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingFee ? 'Edit' : 'Add' }} Fee</h3>
            <button class="close-btn" (click)="closeModal()">
              <app-feather-icon name="x" size="20px"></app-feather-icon>
            </button>
          </div>
          
          <form [formGroup]="feeForm" (ngSubmit)="saveFee()">
            <div class="modal-content">
              <div class="form-group">
                <label for="feeName">Fee Name <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="feeName" 
                  formControlName="name"
                  placeholder="Enter fee name"
                />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="feeType">Fee Type <span class="required">*</span></label>
                  <select id="feeType" formControlName="type">
                    <option value="">Select type</option>
                    <option value="processing">Processing Fee</option>
                    <option value="late_payment">Late Payment Fee</option>
                    <option value="early_repayment">Early Repayment Fee</option>
                    <option value="administration">Administration Fee</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="calculationMethod">Calculation Method <span class="required">*</span></label>
                  <select id="calculationMethod" formControlName="calculationMethod" (change)="onMethodChange()">
                    <option value="">Select method</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                    <option value="tiered">Tiered</option>
                  </select>
                </div>
              </div>

              <div class="form-row" *ngIf="feeForm.get('calculationMethod')?.value === 'fixed'">
                <div class="form-group">
                  <label for="amount">Amount (RWF) <span class="required">*</span></label>
                  <input 
                    type="number" 
                    id="amount" 
                    formControlName="amount"
                    placeholder="Enter amount"
                    min="0"
                  />
                </div>
              </div>

              <div class="form-row" *ngIf="feeForm.get('calculationMethod')?.value === 'percentage'">
                <div class="form-group">
                  <label for="percentage">Percentage (%) <span class="required">*</span></label>
                  <input 
                    type="number" 
                    id="percentage" 
                    formControlName="percentage"
                    placeholder="Enter percentage"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div class="form-group">
                  <label for="minAmount">Min Amount (RWF)</label>
                  <input 
                    type="number" 
                    id="minAmount" 
                    formControlName="minAmount"
                    placeholder="Minimum"
                    min="0"
                  />
                </div>
                <div class="form-group">
                  <label for="maxAmount">Max Amount (RWF)</label>
                  <input 
                    type="number" 
                    id="maxAmount" 
                    formControlName="maxAmount"
                    placeholder="Maximum"
                    min="0"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Applicable To</label>
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="applicableToAll" (change)="onApplicableToChange()" />
                    All Loan Products
                  </label>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="feeForm.invalid">
                <app-feather-icon name="save" size="16px"></app-feather-icon>
                Save Fee
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./fee-management.component.scss']
})
export class FeeManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  fees: Fee[] = [];
  filteredFees: Fee[] = [];
  editingFee: Fee | null = null;
  showModal = false;
  
  // Filters
  selectedType = '';
  selectedMethod = '';
  selectedStatus = '';
  searchTerm = '';
  
  // Stats
  feeStats: {
    total: number;
    active: number;
    fixedCount: number;
    percentageCount: number;
  } | null = null;
  
  // Form
  feeForm: FormGroup;
  
  // Table
  columns: any[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  openDropdownId: string | null = null;

  constructor(private fb: FormBuilder) {
    this.feeForm = this.fb.group({
      name: ['', [Validators.required]],
      type: ['', [Validators.required]],
      calculationMethod: ['', [Validators.required]],
      amount: [''],
      percentage: [''],
      minAmount: [''],
      maxAmount: [''],
      applicableToAll: [true]
    });
  }

  ngOnInit() {
    this.initializeColumns();
    this.loadFees();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeColumns() {
    this.columns = [
      { key: 'name', title: 'Fee Name', type: 'text', sortable: true },
      { key: 'type', title: 'Type', type: 'text', sortable: true },
      { key: 'calculationMethod', title: 'Calculation', type: 'text', sortable: true },
      { key: 'amount', title: 'Amount/Percentage', type: 'text', sortable: false },
      { key: 'status', title: 'Status', type: 'status', sortable: true },
      { key: 'createdAt', title: 'Created', type: 'date', sortable: true }
    ];
  }

  private loadFees() {
    this.loading = true;
    
    // Mock data
    this.fees = [
      {
        id: 'FEE-001',
        name: 'Loan Processing Fee',
        type: 'processing',
        calculationMethod: 'fixed',
        amount: 50000,
        applicableTo: ['all'],
        status: 'active',
        createdAt: new Date('2024-01-15')
      },
      {
        id: 'FEE-002',
        name: 'Late Payment Fee',
        type: 'late_payment',
        calculationMethod: 'percentage',
        percentage: 5,
        minAmount: 10000,
        maxAmount: 50000,
        applicableTo: ['all'],
        status: 'active',
        createdAt: new Date('2024-01-15')
      },
      {
        id: 'FEE-003',
        name: 'Early Repayment Fee',
        type: 'early_repayment',
        calculationMethod: 'percentage',
        percentage: 2,
        applicableTo: ['all'],
        status: 'active',
        createdAt: new Date('2024-01-15')
      },
      {
        id: 'FEE-004',
        name: 'Administration Fee',
        type: 'administration',
        calculationMethod: 'fixed',
        amount: 25000,
        applicableTo: ['all'],
        status: 'active',
        createdAt: new Date('2024-01-15')
      }
    ];
    
    this.calculateStats();
    this.filterFees();
    this.loading = false;
  }

  private calculateStats() {
    this.feeStats = {
      total: this.fees.length,
      active: this.fees.filter(f => f.status === 'active').length,
      fixedCount: this.fees.filter(f => f.calculationMethod === 'fixed').length,
      percentageCount: this.fees.filter(f => f.calculationMethod === 'percentage').length
    };
  }

  filterFees() {
    let filtered = [...this.fees];

    if (this.selectedType) {
      filtered = filtered.filter(f => f.type === this.selectedType);
    }

    if (this.selectedMethod) {
      filtered = filtered.filter(f => f.calculationMethod === this.selectedMethod);
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(f => f.status === this.selectedStatus);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(term)
      );
    }

    this.filteredFees = filtered;
    this.totalPages = Math.ceil(this.filteredFees.length / this.pageSize);
  }

  showAddModal() {
    this.editingFee = null;
    this.feeForm.reset();
    this.feeForm.patchValue({
      applicableToAll: true
    });
    this.showModal = true;
  }

  editFee(fee: Fee) {
    this.closeDropdown();
    this.editingFee = fee;
    this.feeForm.patchValue({
      name: fee.name,
      type: fee.type,
      calculationMethod: fee.calculationMethod,
      amount: fee.amount || '',
      percentage: fee.percentage || '',
      minAmount: fee.minAmount || '',
      maxAmount: fee.maxAmount || '',
      applicableToAll: fee.applicableTo.includes('all')
    });
    this.showModal = true;
  }

  onMethodChange() {
    const method = this.feeForm.get('calculationMethod')?.value;
    if (method === 'fixed') {
      this.feeForm.get('percentage')?.clearValidators();
      this.feeForm.get('amount')?.setValidators([Validators.required, Validators.min(0)]);
    } else if (method === 'percentage') {
      this.feeForm.get('amount')?.clearValidators();
      this.feeForm.get('percentage')?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
    }
    this.feeForm.get('amount')?.updateValueAndValidity();
    this.feeForm.get('percentage')?.updateValueAndValidity();
  }

  onApplicableToChange() {
    // Handle applicable to change
  }

  saveFee() {
    if (this.feeForm.valid) {
      const formValue = this.feeForm.value;
      
      if (this.editingFee) {
        const index = this.fees.findIndex(f => f.id === this.editingFee!.id);
        if (index !== -1) {
          this.fees[index] = {
            ...this.fees[index],
            ...formValue,
            applicableTo: formValue.applicableToAll ? ['all'] : [],
            updatedAt: new Date()
          };
        }
      } else {
        const newFee: Fee = {
          id: `FEE-${Date.now()}`,
          name: formValue.name,
          type: formValue.type,
          calculationMethod: formValue.calculationMethod,
          amount: formValue.amount || undefined,
          percentage: formValue.percentage || undefined,
          minAmount: formValue.minAmount || undefined,
          maxAmount: formValue.maxAmount || undefined,
          applicableTo: formValue.applicableToAll ? ['all'] : [],
          status: 'active',
          createdAt: new Date()
        };
        this.fees.unshift(newFee);
      }
      
      this.calculateStats();
      this.filterFees();
      this.closeModal();
    }
  }

  activateFee(fee: Fee) {
    this.closeDropdown();
    const index = this.fees.findIndex(f => f.id === fee.id);
    if (index !== -1) {
      this.fees[index].status = 'active';
      this.calculateStats();
      this.filterFees();
    }
  }

  deactivateFee(fee: Fee) {
    this.closeDropdown();
    if (confirm(`Deactivate fee ${fee.name}?`)) {
      const index = this.fees.findIndex(f => f.id === fee.id);
      if (index !== -1) {
        this.fees[index].status = 'inactive';
        this.calculateStats();
        this.filterFees();
      }
    }
  }

  deleteFee(fee: Fee) {
    this.closeDropdown();
    if (confirm(`Delete fee ${fee.name}?`)) {
      this.fees = this.fees.filter(f => f.id !== fee.id);
      this.calculateStats();
      this.filterFees();
    }
  }

  closeModal() {
    this.showModal = false;
    this.editingFee = null;
    this.feeForm.reset();
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    const { column, direction } = event;
    
    this.filteredFees.sort((a, b) => {
      let aValue: any = (a as any)[column];
      let bValue: any = (b as any)[column];
      
      if (column.includes('Date')) {
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
  toggleDropdown(feeId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === feeId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = feeId;
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

