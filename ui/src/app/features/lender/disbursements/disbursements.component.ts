import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { LenderService, LoanApplication } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

export interface Disbursement {
  id: string;
  applicationId: string;
  loanNumber: string;
  borrowerName: string;
  borrowerPhone: string;
  productName: string;
  approvedAmount: number;
  disbursedAmount: number;
  disbursementMethod: 'bank_transfer' | 'mobile_money' | 'cash' | 'cheque';
  status: 'pending' | 'approved' | 'disbursed' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedAt?: Date;
  disbursedBy?: string;
  disbursedAt?: Date;
  scheduledDate?: Date;
  accountNumber?: string;
  bankName?: string;
  referenceNumber?: string;
  notes?: string;
}

@Component({
  selector: 'app-disbursements',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="disbursements">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Disbursements</h1>
          <p class="page-description">Manage loan disbursements and approvals</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="exportReport()">
            <app-feather-icon name="download" size="16px"></app-feather-icon>
            Export
          </button>
          <button class="btn-primary" (click)="refreshDisbursements()">
            <app-feather-icon name="refresh-cw" size="16px"></app-feather-icon>
            Refresh
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid" *ngIf="disbursementStats">
        <div class="stat-card">
          <div class="stat-icon pending">
            <app-feather-icon name="clock" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ disbursementStats.pending }}</div>
            <div class="stat-label">Pending Approval</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon approved">
            <app-feather-icon name="check-circle" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ disbursementStats.approved }}</div>
            <div class="stat-label">Approved</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon disbursed">
            <app-feather-icon name="dollar-sign" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(disbursementStats.totalDisbursed) }}</div>
            <div class="stat-label">Total Disbursed</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon today">
            <app-feather-icon name="calendar" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ disbursementStats.today }}</div>
            <div class="stat-label">Today</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="statusFilter">Status</label>
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterDisbursements()">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="disbursed">Disbursed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="methodFilter">Disbursement Method</label>
            <select id="methodFilter" [(ngModel)]="selectedMethod" (change)="filterDisbursements()">
              <option value="">All Methods</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="searchInput">Search</label>
            <input 
              type="text" 
              id="searchInput" 
              [(ngModel)]="searchTerm" 
              (input)="filterDisbursements()"
              placeholder="Search by loan number or borrower..."
            />
          </div>
        </div>
      </div>

      <!-- Disbursements Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>Disbursements</h3>
            <span class="disbursement-count">{{ filteredDisbursements.length }} disbursements</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredDisbursements"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="filteredDisbursements.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-disbursement>
              <div class="dropdown" [class.show]="openDropdownId === disbursement.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(disbursement.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === disbursement.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewDetails(disbursement)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View Details
                    </a>
                  </li>
                  <li *ngIf="disbursement.status === 'pending'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="approveDisbursement(disbursement)">
                      <app-feather-icon name="check" size="14px" class="me-2"></app-feather-icon>
                      Approve
                    </a>
                  </li>
                  <li *ngIf="disbursement.status === 'approved'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="processDisbursement(disbursement)">
                      <app-feather-icon name="send" size="14px" class="me-2"></app-feather-icon>
                      Process Disbursement
                    </a>
                  </li>
                  <li *ngIf="disbursement.status === 'pending'">
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="rejectDisbursement(disbursement)">
                      <app-feather-icon name="x" size="14px" class="me-2"></app-feather-icon>
                      Reject
                    </a>
                  </li>
                  <li *ngIf="disbursement.status === 'disbursed'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="downloadReceipt(disbursement)">
                      <app-feather-icon name="download" size="14px" class="me-2"></app-feather-icon>
                      Download Receipt
                    </a>
                  </li>
                </ul>
              </div>
            </ng-template>
          </app-data-table>
        </div>
      </div>

      <!-- Disbursement Modal -->
      <div class="modal-overlay" *ngIf="showDisbursementModal" (click)="closeModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Process Disbursement</h3>
            <button class="close-btn" (click)="closeModal()">
              <app-feather-icon name="x" size="20px"></app-feather-icon>
            </button>
          </div>
          
          <div class="modal-content" *ngIf="selectedDisbursement">
            <div class="form-section">
              <div class="info-row">
                <label>Borrower:</label>
                <span>{{ selectedDisbursement.borrowerName }}</span>
              </div>
              <div class="info-row">
                <label>Loan Number:</label>
                <span>{{ selectedDisbursement.loanNumber }}</span>
              </div>
              <div class="info-row">
                <label>Approved Amount:</label>
                <span>{{ formatCurrency(selectedDisbursement.approvedAmount) }}</span>
              </div>
              
              <div class="form-group">
                <label for="disbursementMethod">Disbursement Method <span class="required">*</span></label>
                <select id="disbursementMethod" [(ngModel)]="disbursementForm.method">
                  <option value="">Select method</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div class="form-group" *ngIf="disbursementForm.method === 'bank_transfer'">
                <label for="accountNumber">Account Number</label>
                <input type="text" id="accountNumber" [(ngModel)]="disbursementForm.accountNumber" placeholder="Enter account number" />
              </div>

              <div class="form-group" *ngIf="disbursementForm.method === 'bank_transfer'">
                <label for="bankName">Bank Name</label>
                <input type="text" id="bankName" [(ngModel)]="disbursementForm.bankName" placeholder="Enter bank name" />
              </div>

              <div class="form-group" *ngIf="disbursementForm.method === 'mobile_money'">
                <label for="mobileNumber">Mobile Number</label>
                <input type="tel" id="mobileNumber" [(ngModel)]="disbursementForm.accountNumber" placeholder="+250788000000" />
              </div>

              <div class="form-group">
                <label for="disbursedAmount">Disbursed Amount <span class="required">*</span></label>
                <input type="number" id="disbursedAmount" [(ngModel)]="disbursementForm.amount" placeholder="Enter amount" min="0" [max]="selectedDisbursement.approvedAmount" />
              </div>

              <div class="form-group">
                <label for="referenceNumber">Reference Number</label>
                <input type="text" id="referenceNumber" [(ngModel)]="disbursementForm.referenceNumber" placeholder="Enter reference number" />
              </div>

              <div class="form-group">
                <label for="notes">Notes</label>
                <textarea id="notes" [(ngModel)]="disbursementForm.notes" rows="3" placeholder="Additional notes..."></textarea>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button class="btn-primary" (click)="confirmDisbursement()">
                <app-feather-icon name="send" size="16px"></app-feather-icon>
                Process Disbursement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./disbursements.component.scss']
})
export class DisbursementsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  disbursements: Disbursement[] = [];
  filteredDisbursements: Disbursement[] = [];
  selectedDisbursement: Disbursement | null = null;
  showDisbursementModal = false;
  
  // Filters
  selectedStatus = '';
  selectedMethod = '';
  searchTerm = '';
  
  // Stats
  disbursementStats: {
    pending: number;
    approved: number;
    totalDisbursed: number;
    today: number;
  } | null = null;
  
  // Form
  disbursementForm: {
    method: string;
    amount: number;
    accountNumber: string;
    bankName: string;
    referenceNumber: string;
    notes: string;
  } = {
    method: '',
    amount: 0,
    accountNumber: '',
    bankName: '',
    referenceNumber: '',
    notes: ''
  };
  
  // Table
  columns: any[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  openDropdownId: string | null = null;

  constructor(private lenderService: LenderService) {}

  ngOnInit() {
    this.initializeColumns();
    this.loadDisbursements();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeColumns() {
    this.columns = [
      { key: 'loanNumber', title: 'Loan Number', type: 'text', sortable: true },
      { key: 'borrowerName', title: 'Borrower', type: 'text', sortable: true },
      { key: 'productName', title: 'Product', type: 'text', sortable: true },
      { key: 'approvedAmount', title: 'Approved', type: 'currency', sortable: true },
      { key: 'disbursedAmount', title: 'Disbursed', type: 'currency', sortable: true },
      { key: 'disbursementMethod', title: 'Method', type: 'text', sortable: true },
      { key: 'status', title: 'Status', type: 'status', sortable: true },
      { key: 'approvedAt', title: 'Approved', type: 'date', sortable: true },
      { key: 'disbursedAt', title: 'Disbursed', type: 'date', sortable: true }
    ];
  }

  private loadDisbursements() {
    this.loading = true;

    this.lenderService.loanApplications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(applications => {
        this.disbursements = applications
          .filter(app => app.status === 'approved' || app.status === 'pending')
          .map(app => this.createDisbursement(app));
        this.calculateStats();
        this.filterDisbursements();
        this.loading = false;
      });
  }

  private createDisbursement(application: LoanApplication): Disbursement {
    const statuses: Array<'pending' | 'approved' | 'disbursed'> = ['pending', 'approved', 'disbursed'];
    const methods: Array<'bank_transfer' | 'mobile_money' | 'cash' | 'cheque'> = ['bank_transfer', 'mobile_money', 'cash', 'cheque'];
    
    const status = application.status === 'approved' ? 'approved' : 'pending';
    const method = methods[Math.floor(Math.random() * methods.length)];

    return {
      id: `DISB-${application.id}`,
      applicationId: application.id,
      loanNumber: `LOAN-${application.id}`,
      borrowerName: application.applicantName,
      borrowerPhone: application.applicantPhone,
      productName: application.productName,
      approvedAmount: application.requestedAmount,
      disbursedAmount: status === 'disbursed' ? application.requestedAmount : 0,
      disbursementMethod: method,
      status: status,
      approvedBy: status !== 'pending' ? 'John Doe' : undefined,
      approvedAt: status !== 'pending' ? new Date(application.submittedAt.getTime() + 24 * 60 * 60 * 1000) : undefined,
      disbursedBy: status === 'disbursed' ? 'Jane Smith' : undefined,
      disbursedAt: status === 'disbursed' ? new Date(application.submittedAt.getTime() + 48 * 60 * 60 * 1000) : undefined,
      scheduledDate: status === 'approved' ? new Date(application.submittedAt.getTime() + 72 * 60 * 60 * 1000) : undefined,
      accountNumber: method === 'bank_transfer' ? '1234567890' : method === 'mobile_money' ? application.applicantPhone : undefined,
      bankName: method === 'bank_transfer' ? 'Bank of Rwanda' : undefined,
      referenceNumber: status === 'disbursed' ? `REF-${Date.now()}` : undefined
    };
  }

  private calculateStats() {
    const today = new Date().toDateString();
    
    this.disbursementStats = {
      pending: this.disbursements.filter(d => d.status === 'pending').length,
      approved: this.disbursements.filter(d => d.status === 'approved').length,
      totalDisbursed: this.disbursements
        .filter(d => d.status === 'disbursed')
        .reduce((sum, d) => sum + d.disbursedAmount, 0),
      today: this.disbursements.filter(d => 
        d.disbursedAt && new Date(d.disbursedAt).toDateString() === today
      ).length
    };
  }

  filterDisbursements() {
    let filtered = [...this.disbursements];

    if (this.selectedStatus) {
      filtered = filtered.filter(d => d.status === this.selectedStatus);
    }

    if (this.selectedMethod) {
      filtered = filtered.filter(d => d.disbursementMethod === this.selectedMethod);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.loanNumber.toLowerCase().includes(term) ||
        d.borrowerName.toLowerCase().includes(term)
      );
    }

    this.filteredDisbursements = filtered;
    this.totalPages = Math.ceil(this.filteredDisbursements.length / this.pageSize);
  }

  refreshDisbursements() {
    this.loadDisbursements();
  }

  exportReport() {
    console.log('Export disbursements report');
    alert('Export functionality will be implemented');
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    const { column, direction } = event;
    
    this.filteredDisbursements.sort((a, b) => {
      let aValue: any = (a as any)[column];
      let bValue: any = (b as any)[column];
      
      if (column.includes('At') || column.includes('Date')) {
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
  toggleDropdown(disbursementId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === disbursementId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = disbursementId;
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

  // Action methods
  viewDetails(disbursement: Disbursement) {
    this.closeDropdown();
    console.log('View details:', disbursement.id);
    alert(`Viewing details for ${disbursement.loanNumber}`);
  }

  approveDisbursement(disbursement: Disbursement) {
    this.closeDropdown();
    if (confirm(`Approve disbursement for ${disbursement.loanNumber}?`)) {
      const index = this.disbursements.findIndex(d => d.id === disbursement.id);
      if (index !== -1) {
        this.disbursements[index].status = 'approved';
        this.disbursements[index].approvedBy = 'Current User';
        this.disbursements[index].approvedAt = new Date();
        this.calculateStats();
        this.filterDisbursements();
      }
    }
  }

  processDisbursement(disbursement: Disbursement) {
    this.closeDropdown();
    this.selectedDisbursement = disbursement;
    this.disbursementForm = {
      method: disbursement.disbursementMethod,
      amount: disbursement.approvedAmount,
      accountNumber: disbursement.accountNumber || '',
      bankName: disbursement.bankName || '',
      referenceNumber: '',
      notes: ''
    };
    this.showDisbursementModal = true;
  }

  confirmDisbursement() {
    if (!this.selectedDisbursement) return;
    
    if (!this.disbursementForm.method || !this.disbursementForm.amount) {
      alert('Please fill in all required fields');
      return;
    }

    const index = this.disbursements.findIndex(d => d.id === this.selectedDisbursement!.id);
    if (index !== -1) {
      this.disbursements[index].status = 'disbursed';
      this.disbursements[index].disbursedAmount = this.disbursementForm.amount;
      this.disbursements[index].disbursementMethod = this.disbursementForm.method as any;
      this.disbursements[index].disbursedBy = 'Current User';
      this.disbursements[index].disbursedAt = new Date();
      this.disbursements[index].accountNumber = this.disbursementForm.accountNumber;
      this.disbursements[index].bankName = this.disbursementForm.bankName;
      this.disbursements[index].referenceNumber = this.disbursementForm.referenceNumber;
      this.disbursements[index].notes = this.disbursementForm.notes;
      
      this.calculateStats();
      this.filterDisbursements();
    }
    
    this.closeModal();
    alert('Disbursement processed successfully!');
  }

  rejectDisbursement(disbursement: Disbursement) {
    this.closeDropdown();
    const reason = prompt('Please provide rejection reason:');
    if (reason) {
      const index = this.disbursements.findIndex(d => d.id === disbursement.id);
      if (index !== -1) {
        this.disbursements[index].status = 'rejected';
        this.calculateStats();
        this.filterDisbursements();
      }
    }
  }

  downloadReceipt(disbursement: Disbursement) {
    this.closeDropdown();
    console.log('Download receipt:', disbursement.id);
    alert(`Downloading receipt for ${disbursement.loanNumber}...`);
  }

  closeModal() {
    this.showDisbursementModal = false;
    this.selectedDisbursement = null;
    this.disbursementForm = {
      method: '',
      amount: 0,
      accountNumber: '',
      bankName: '',
      referenceNumber: '',
      notes: ''
    };
  }

  formatCurrency(amount: number): string {
    return this.lenderService.formatCurrency(amount);
  }
}

