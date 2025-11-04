import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { LenderService } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

export interface LoanTerm {
  id: string;
  name: string;
  durationMonths: number;
  paymentFrequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annually';
  gracePeriodDays: number;
  earlyPaymentAllowed: boolean;
  earlyPaymentPenalty?: number;
  latePaymentPenalty: number;
  defaultInterestRate?: number;
  minAmount?: number;
  maxAmount?: number;
  status: 'active' | 'inactive' | 'archived';
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
}

@Component({
  selector: 'app-loan-terms',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="loan-terms">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Loan Terms</h1>
          <p class="page-description">Configure and manage loan term structures</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="showAddModal()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            Add Term
          </button>
        </div>
      </div>

      <!-- Term Stats -->
      <div class="stats-grid" *ngIf="termStats">
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="calendar" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ termStats.total }}</div>
            <div class="stat-label">Total Terms</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon active">
            <app-feather-icon name="check-circle" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ termStats.active }}</div>
            <div class="stat-label">Active Terms</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="clock" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ termStats.averageDuration }} months</div>
            <div class="stat-label">Avg Duration</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="trending-up" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ termStats.mostUsed }}</div>
            <div class="stat-label">Most Used Term</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="statusFilter">Status</label>
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterTerms()">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="frequencyFilter">Payment Frequency</label>
            <select id="frequencyFilter" [(ngModel)]="selectedFrequency" (change)="filterTerms()">
              <option value="">All Frequencies</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="durationFilter">Duration</label>
            <select id="durationFilter" [(ngModel)]="selectedDuration" (change)="filterTerms()">
              <option value="">All Durations</option>
              <option value="short">Short (1-6 months)</option>
              <option value="medium">Medium (7-24 months)</option>
              <option value="long">Long (25+ months)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Terms Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>Loan Terms</h3>
            <span class="term-count">{{ filteredTerms.length }} terms</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredTerms"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="filteredTerms.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-term>
              <div class="dropdown" [class.show]="openDropdownId === term.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(term.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === term.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewTerm(term)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View Details
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="editTerm(term)">
                      <app-feather-icon name="edit" size="14px" class="me-2"></app-feather-icon>
                      Edit Term
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="toggleTermStatus(term)">
                      <app-feather-icon [name]="term.status === 'active' ? 'pause' : 'play'" size="14px" class="me-2"></app-feather-icon>
                      {{ term.status === 'active' ? 'Deactivate' : 'Activate' }}
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="deleteTerm(term)">
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

      <!-- Create/Edit Term Modal -->
      <div class="modal-overlay" *ngIf="showTermModal" (click)="closeTermModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Edit Term' : 'Create New Term' }}</h3>
            <button class="close-btn" (click)="closeTermModal()">
              <app-feather-icon name="x" size="20px"></app-feather-icon>
            </button>
          </div>
          
          <form class="modal-content" [formGroup]="termForm" (ngSubmit)="saveTerm()">
            <div class="form-grid">
              <div class="form-group">
                <label for="termName">Term Name <span class="required">*</span></label>
                <input
                  type="text"
                  id="termName"
                  formControlName="name"
                  placeholder="e.g., Short Term 3 Months"
                  class="form-control"
                />
                <div class="error-message" *ngIf="termForm.get('name')?.invalid && termForm.get('name')?.touched">
                  Term name is required
                </div>
              </div>

              <div class="form-group">
                <label for="durationMonths">Duration (Months) <span class="required">*</span></label>
                <input
                  type="number"
                  id="durationMonths"
                  formControlName="durationMonths"
                  min="1"
                  placeholder="Enter duration in months"
                  class="form-control"
                />
                <div class="error-message" *ngIf="termForm.get('durationMonths')?.invalid && termForm.get('durationMonths')?.touched">
                  Duration must be at least 1 month
                </div>
              </div>

              <div class="form-group">
                <label for="paymentFrequency">Payment Frequency <span class="required">*</span></label>
                <select id="paymentFrequency" formControlName="paymentFrequency" class="form-control">
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>

              <div class="form-group">
                <label for="gracePeriodDays">Grace Period (Days)</label>
                <input
                  type="number"
                  id="gracePeriodDays"
                  formControlName="gracePeriodDays"
                  min="0"
                  placeholder="Enter grace period"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label for="latePaymentPenalty">Late Payment Penalty (%) <span class="required">*</span></label>
                <input
                  type="number"
                  id="latePaymentPenalty"
                  formControlName="latePaymentPenalty"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Enter penalty percentage"
                  class="form-control"
                />
                <div class="error-message" *ngIf="termForm.get('latePaymentPenalty')?.invalid && termForm.get('latePaymentPenalty')?.touched">
                  Penalty must be between 0-100%
                </div>
              </div>

              <div class="form-group">
                <label for="status">Status</label>
                <select id="status" formControlName="status" class="form-control">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" formControlName="earlyPaymentAllowed" />
                Allow Early Payment
              </label>
            </div>

            <div class="form-group" *ngIf="termForm.get('earlyPaymentAllowed')?.value">
              <label for="earlyPaymentPenalty">Early Payment Penalty (%)</label>
              <input
                type="number"
                id="earlyPaymentPenalty"
                formControlName="earlyPaymentPenalty"
                min="0"
                max="100"
                step="0.1"
                placeholder="Enter early payment penalty (optional)"
                class="form-control"
              />
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="minAmount">Minimum Amount (RWF)</label>
                <input
                  type="number"
                  id="minAmount"
                  formControlName="minAmount"
                  min="0"
                  placeholder="Enter minimum amount"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label for="maxAmount">Maximum Amount (RWF)</label>
                <input
                  type="number"
                  id="maxAmount"
                  formControlName="maxAmount"
                  min="0"
                  placeholder="Enter maximum amount"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label for="defaultInterestRate">Default Interest Rate (%)</label>
                <input
                  type="number"
                  id="defaultInterestRate"
                  formControlName="defaultInterestRate"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Enter default interest rate"
                  class="form-control"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea
                id="description"
                formControlName="description"
                placeholder="Enter term description..."
                class="form-control"
                rows="3"
              ></textarea>
            </div>

            <!-- Validation Summary -->
            <div class="validation-summary" *ngIf="validationErrors.length > 0">
              <div class="validation-header">
                <app-feather-icon name="alert-triangle" size="16px"></app-feather-icon>
                <span>Please fix the following issues:</span>
              </div>
              <ul class="validation-errors">
                <li *ngFor="let error of validationErrors">{{ error }}</li>
              </ul>
            </div>

            <!-- Modal Actions -->
            <div class="modal-actions">
              <button 
                type="submit" 
                class="btn btn-primary"
                [disabled]="!termForm.valid || isSubmitting"
              >
                <app-feather-icon name="save" size="16px" *ngIf="!isSubmitting"></app-feather-icon>
                <app-feather-icon name="loader" size="16px" *ngIf="isSubmitting"></app-feather-icon>
                {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update Term' : 'Create Term') }}
              </button>
              <button type="button" class="btn btn-secondary" (click)="closeTermModal()">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./loan-terms.component.scss']
})
export class LoanTermsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  terms: LoanTerm[] = [];
  filteredTerms: LoanTerm[] = [];
  loading = false;
  showTermModal = false;
  isEditing = false;
  isSubmitting = false;
  validationErrors: string[] = [];
  
  // Filters
  selectedStatus = '';
  selectedFrequency = '';
  selectedDuration = '';
  
  // Form
  termForm: FormGroup;
  
  // Table
  columns: any[] = [];
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  openDropdownId: string | null = null;
  
  // Stats
  termStats = {
    total: 0,
    active: 0,
    averageDuration: 0,
    mostUsed: ''
  };

  constructor(
    private lenderService: LenderService,
    private fb: FormBuilder
  ) {
    this.termForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      durationMonths: [1, [Validators.required, Validators.min(1)]],
      paymentFrequency: ['monthly', Validators.required],
      gracePeriodDays: [0, [Validators.min(0)]],
      earlyPaymentAllowed: [false],
      earlyPaymentPenalty: [0, [Validators.min(0), Validators.max(100)]],
      latePaymentPenalty: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      defaultInterestRate: [0, [Validators.min(0), Validators.max(100)]],
      minAmount: [0, [Validators.min(0)]],
      maxAmount: [0, [Validators.min(0)]],
      status: ['active'],
      description: ['']
    });
  }

  ngOnInit() {
    this.initializeColumns();
    this.loadTerms();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeColumns() {
    this.columns = [
      { key: 'name', title: 'Term Name', type: 'text', sortable: true },
      { key: 'durationMonths', title: 'Duration', type: 'text', sortable: true },
      { key: 'paymentFrequency', title: 'Payment Frequency', type: 'text', sortable: true },
      { key: 'gracePeriodDays', title: 'Grace Period', type: 'text', sortable: true },
      { key: 'latePaymentPenalty', title: 'Late Penalty', type: 'percentage', sortable: true },
      { key: 'status', title: 'Status', type: 'status', sortable: true },
      { key: 'createdAt', title: 'Created', type: 'date', sortable: true }
    ];
  }

  private loadTerms() {
    this.loading = true;
    
    // Mock data for now
    setTimeout(() => {
      this.terms = [
        {
          id: '1',
          name: 'Short Term 3 Months',
          durationMonths: 3,
          paymentFrequency: 'monthly',
          gracePeriodDays: 7,
          earlyPaymentAllowed: true,
          earlyPaymentPenalty: 0,
          latePaymentPenalty: 5,
          defaultInterestRate: 12,
          minAmount: 100000,
          maxAmount: 5000000,
          status: 'active',
          description: 'Short-term loan with monthly payments',
          createdAt: new Date('2024-01-15')
        },
        {
          id: '2',
          name: 'Medium Term 12 Months',
          durationMonths: 12,
          paymentFrequency: 'monthly',
          gracePeriodDays: 14,
          earlyPaymentAllowed: true,
          earlyPaymentPenalty: 2,
          latePaymentPenalty: 5,
          defaultInterestRate: 15,
          minAmount: 500000,
          maxAmount: 20000000,
          status: 'active',
          description: 'Medium-term loan with monthly payments',
          createdAt: new Date('2024-01-20')
        },
        {
          id: '3',
          name: 'Long Term 36 Months',
          durationMonths: 36,
          paymentFrequency: 'monthly',
          gracePeriodDays: 30,
          earlyPaymentAllowed: false,
          latePaymentPenalty: 5,
          defaultInterestRate: 18,
          minAmount: 1000000,
          maxAmount: 50000000,
          status: 'active',
          description: 'Long-term loan with monthly payments',
          createdAt: new Date('2024-02-01')
        }
      ];
      
      this.filteredTerms = [...this.terms];
      this.calculateStats();
      this.loading = false;
    }, 500);
  }

  private setupEventListeners() {
    document.addEventListener('click', () => {
      this.closeDropdown();
    });
  }

  private calculateStats() {
    this.termStats = {
      total: this.terms.length,
      active: this.terms.filter(t => t.status === 'active').length,
      averageDuration: this.terms.length > 0 
        ? Math.round(this.terms.reduce((sum, t) => sum + t.durationMonths, 0) / this.terms.length)
        : 0,
      mostUsed: '12 months' // TODO: Calculate from actual usage
    };
  }

  filterTerms() {
    this.filteredTerms = this.terms.filter(term => {
      const statusMatch = !this.selectedStatus || term.status === this.selectedStatus;
      const frequencyMatch = !this.selectedFrequency || term.paymentFrequency === this.selectedFrequency;
      
      let durationMatch = true;
      if (this.selectedDuration) {
        if (this.selectedDuration === 'short') {
          durationMatch = term.durationMonths >= 1 && term.durationMonths <= 6;
        } else if (this.selectedDuration === 'medium') {
          durationMatch = term.durationMonths >= 7 && term.durationMonths <= 24;
        } else if (this.selectedDuration === 'long') {
          durationMatch = term.durationMonths >= 25;
        }
      }
      
      return statusMatch && frequencyMatch && durationMatch;
    });
  }

  // Modal methods
  showAddModal() {
    this.isEditing = false;
    this.resetForm();
    this.showTermModal = true;
  }

  closeTermModal() {
    this.showTermModal = false;
    this.isEditing = false;
    this.resetForm();
    this.validationErrors = [];
  }

  private resetForm() {
    this.termForm.reset({
      name: '',
      durationMonths: 1,
      paymentFrequency: 'monthly',
      gracePeriodDays: 0,
      earlyPaymentAllowed: false,
      earlyPaymentPenalty: 0,
      latePaymentPenalty: 0,
      defaultInterestRate: 0,
      minAmount: 0,
      maxAmount: 0,
      status: 'active',
      description: ''
    });
  }

  // Term actions
  viewTerm(term: LoanTerm) {
    this.closeDropdown();
    // TODO: Show term details modal
    console.log('View term:', term);
  }

  editTerm(term: LoanTerm) {
    this.closeDropdown();
    this.isEditing = true;
    this.termForm.patchValue({
      ...term,
      earlyPaymentAllowed: term.earlyPaymentAllowed || false
    });
    this.showTermModal = true;
  }

  toggleTermStatus(term: LoanTerm) {
    const newStatus = term.status === 'active' ? 'inactive' : 'active';
    // TODO: Update term status
    term.status = newStatus;
    this.closeDropdown();
    this.calculateStats();
  }

  deleteTerm(term: LoanTerm) {
    if (confirm(`Are you sure you want to delete "${term.name}"? This action cannot be undone.`)) {
      this.terms = this.terms.filter(t => t.id !== term.id);
      this.filteredTerms = this.filteredTerms.filter(t => t.id !== term.id);
      this.closeDropdown();
      this.calculateStats();
    }
  }

  saveTerm() {
    if (this.isSubmitting) return;
    
    if (!this.termForm.valid) {
      this.validateForm();
      return;
    }
    
    this.isSubmitting = true;
    
    const termData = this.termForm.value;
    const termToSave: LoanTerm = {
      id: this.isEditing ? (this.terms.find(t => t.name === termData.name)?.id || '') : this.generateId(),
      ...termData,
      createdAt: this.isEditing ? (this.terms.find(t => t.id === this.termForm.get('id')?.value)?.createdAt || new Date()) : new Date(),
      updatedAt: new Date()
    };
    
    if (this.isEditing) {
      const index = this.terms.findIndex(t => t.id === termToSave.id);
      if (index !== -1) {
        this.terms[index] = termToSave;
      }
    } else {
      this.terms.push(termToSave);
    }
    
    setTimeout(() => {
      this.isSubmitting = false;
      this.closeTermModal();
      this.filterTerms();
      this.calculateStats();
    }, 1000);
  }

  private validateForm() {
    this.validationErrors = [];
    
    if (this.termForm.get('name')?.invalid) {
      this.validationErrors.push('Term name is required and must be at least 3 characters.');
    }
    
    if (this.termForm.get('durationMonths')?.invalid) {
      this.validationErrors.push('Duration must be at least 1 month.');
    }
    
    if (this.termForm.get('latePaymentPenalty')?.invalid) {
      this.validationErrors.push('Late payment penalty must be between 0-100%.');
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    console.log('Sort:', event);
  }

  handlePageChange(page: number) {
    this.currentPage = page;
  }

  handlePageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  // Dropdown handlers
  toggleDropdown(termId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === termId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = termId;
    }
  }

  closeDropdown() {
    this.openDropdownId = null;
  }
}

