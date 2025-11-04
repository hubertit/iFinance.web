import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { LenderService, LoanApplication } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-loan-applications',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="loan-applications">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Loan Applications</h1>
          <p class="page-description">Review and manage loan applications from borrowers</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="refreshApplications()">
            <app-feather-icon name="refresh-cw" size="16px"></app-feather-icon>
            Refresh
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="statusFilter">Status</label>
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterApplications()">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="disbursed">Disbursed</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="riskFilter">Risk Level</label>
            <select id="riskFilter" [(ngModel)]="selectedRiskLevel" (change)="filterApplications()">
              <option value="">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="loanTypeFilter">Loan Type</label>
            <select id="loanTypeFilter" [(ngModel)]="selectedLoanType" (change)="filterApplications()">
              <option value="">All Types</option>
              <option value="cash">Cash Loan</option>
              <option value="asset">Asset Loan</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="searchInput">Search</label>
            <input 
              type="text" 
              id="searchInput" 
              [(ngModel)]="searchTerm" 
              (input)="filterApplications()"
              placeholder="Search by applicant name or phone..."
            />
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon pending">
            <app-feather-icon name="clock" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pending }}</div>
            <div class="stat-label">Pending Review</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon under-review">
            <app-feather-icon name="eye" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.underReview }}</div>
            <div class="stat-label">Under Review</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon approved">
            <app-feather-icon name="check-circle" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.approved }}</div>
            <div class="stat-label">Approved</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon rejected">
            <app-feather-icon name="x-circle" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.rejected }}</div>
            <div class="stat-label">Rejected</div>
          </div>
        </div>
      </div>

      <!-- Applications Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>Loan Applications</h3>
            <span class="application-count">{{ filteredApplications.length }} applications</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredApplications"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="filteredApplications.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-application>
              <div class="dropdown" [class.show]="openDropdownId === application.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(application.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === application.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewApplication(application)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View Details
                    </a>
                  </li>
                  <li *ngIf="application.status === 'pending'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="startReview(application)">
                      <app-feather-icon name="play" size="14px" class="me-2"></app-feather-icon>
                      Start Review
                    </a>
                  </li>
                  <li *ngIf="application.status === 'under_review'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="approveApplication(application)">
                      <app-feather-icon name="check" size="14px" class="me-2"></app-feather-icon>
                      Approve
                    </a>
                  </li>
                  <li *ngIf="application.status === 'under_review'">
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="rejectApplication(application)">
                      <app-feather-icon name="x" size="14px" class="me-2"></app-feather-icon>
                      Reject
                    </a>
                  </li>
                  <li *ngIf="application.status === 'approved'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="disburseLoan(application)">
                      <app-feather-icon name="dollar-sign" size="14px" class="me-2"></app-feather-icon>
                      Disburse
                    </a>
                  </li>
                </ul>
              </div>
            </ng-template>
          </app-data-table>
        </div>
      </div>

      <!-- Application Details Modal -->
      <div class="modal-overlay" *ngIf="showApplicationModal" (click)="closeApplicationModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Application Details</h3>
            <button class="close-btn" (click)="closeApplicationModal()">
              <app-feather-icon name="x" size="20px"></app-feather-icon>
            </button>
          </div>
          
          <div class="modal-content" *ngIf="selectedApplication">
            <div class="application-info">
              <div class="info-section">
                <h4>Applicant Information</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Name:</label>
                    <span>{{ selectedApplication.applicantName }}</span>
                  </div>
                  <div class="info-item">
                    <label>Phone:</label>
                    <span>{{ selectedApplication.applicantPhone }}</span>
                  </div>
                  <div class="info-item">
                    <label>Credit Score:</label>
                    <span class="credit-score">{{ selectedApplication.creditScore || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Risk Level:</label>
                    <span class="risk-level" [style.color]="getRiskLevelColor(selectedApplication.riskLevel)">
                      {{ formatRiskLevel(selectedApplication.riskLevel) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <h4>Loan Details</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Product:</label>
                    <span>{{ selectedApplication.productName }}</span>
                  </div>
                  <div class="info-item">
                    <label>Loan Type:</label>
                    <span class="loan-type-badge" [class.cash]="selectedApplication.loanType === 'cash'" [class.asset]="selectedApplication.loanType === 'asset'">
                      {{ selectedApplication.loanType === 'cash' ? 'Cash Loan' : 'Asset Loan' }}
                    </span>
                  </div>
                  <div class="info-item">
                    <label>Amount:</label>
                    <span class="amount">{{ formatCurrency(selectedApplication.amount) }}</span>
                  </div>
                  <div class="info-item">
                    <label>Term:</label>
                    <span>{{ selectedApplication.termMonths }} months</span>
                  </div>
                  <div class="info-item">
                    <label>Purpose:</label>
                    <span>{{ selectedApplication.purpose }}</span>
                  </div>
                </div>
              </div>

              <div class="info-section" *ngIf="selectedApplication.loanType === 'asset' && selectedApplication.collateral">
                <h4>Asset Collateral Information</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Asset Type:</label>
                    <span>{{ formatStatusValue(selectedApplication.collateral.assetType) }}</span>
                  </div>
                  <div class="info-item">
                    <label>Asset Description:</label>
                    <span>{{ selectedApplication.collateral.assetDescription }}</span>
                  </div>
                  <div class="info-item">
                    <label>Asset Value:</label>
                    <span class="amount">{{ formatCurrency(selectedApplication.collateral.assetValue) }}</span>
                  </div>
                  <div class="info-item" *ngIf="selectedApplication.collateral.registrationNumber">
                    <label>Registration Number:</label>
                    <span>{{ selectedApplication.collateral.registrationNumber }}</span>
                  </div>
                  <div class="info-item" *ngIf="selectedApplication.collateral.location">
                    <label>Location:</label>
                    <span>{{ selectedApplication.collateral.location }}</span>
                  </div>
                  <div class="info-item" *ngIf="selectedApplication.collateral.condition">
                    <label>Condition:</label>
                    <span>{{ formatStatusValue(selectedApplication.collateral.condition) }}</span>
                  </div>
                  <div class="info-item" *ngIf="selectedApplication.collateral.insuranceCoverage">
                    <label>Insurance:</label>
                    <span class="badge badge-approved">Yes</span>
                    <span *ngIf="selectedApplication.collateral.insuranceDetails" class="insurance-details">
                      - {{ selectedApplication.collateral.insuranceDetails }}
                    </span>
                  </div>
                  <div class="info-item" *ngIf="selectedApplication.collateral.valuationDate">
                    <label>Valuation Date:</label>
                    <span>{{ formatDate(selectedApplication.collateral.valuationDate) }}</span>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <h4>Status & Timeline</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Status:</label>
                    <span class="status" [style.color]="getStatusColor(selectedApplication.status)">
                      {{ formatStatus(selectedApplication.status) }}
                    </span>
                  </div>
                  <div class="info-item">
                    <label>Submitted:</label>
                    <span>{{ formatDate(selectedApplication.submittedAt) }}</span>
                  </div>
                  <div class="info-item" *ngIf="selectedApplication.reviewedAt">
                    <label>Reviewed:</label>
                    <span>{{ formatDate(selectedApplication.reviewedAt) }}</span>
                  </div>
                  <div class="info-item" *ngIf="selectedApplication.approvedAt">
                    <label>Approved:</label>
                    <span>{{ formatDate(selectedApplication.approvedAt) }}</span>
                  </div>
                </div>
              </div>

              <div class="info-section" *ngIf="selectedApplication.notes">
                <h4>Notes</h4>
                <p class="notes">{{ selectedApplication.notes }}</p>
              </div>

              <div class="info-section" *ngIf="selectedApplication.rejectionReason">
                <h4>Rejection Reason</h4>
                <p class="rejection-reason">{{ selectedApplication.rejectionReason }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Reject Application Modal -->
      <div class="modal-overlay" *ngIf="showRejectModal" (click)="closeRejectModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Reject Application</h3>
            <button class="close-btn" (click)="closeRejectModal()">
              <app-feather-icon name="x" size="20px"></app-feather-icon>
            </button>
          </div>
          <div class="modal-content" *ngIf="selectedApplication">
            <div class="form-group">
              <label for="rejectionReason">Rejection Reason *</label>
              <textarea
                id="rejectionReason"
                [(ngModel)]="rejectionReason"
                placeholder="Please provide a reason for rejecting this application..."
                class="form-control"
                rows="4"
                required
              ></textarea>
            </div>
            <div class="modal-actions">
              <button 
                class="btn btn-primary" 
                (click)="confirmReject(rejectionReason)"
                [disabled]="!rejectionReason || !rejectionReason.trim()"
              >
                Confirm Rejection
              </button>
              <button class="btn btn-secondary" (click)="closeRejectModal()">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Disburse Loan Modal -->
      <div class="modal-overlay" *ngIf="showDisburseModal" (click)="closeDisburseModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Confirm Disbursement</h3>
            <button class="close-btn" (click)="closeDisburseModal()">
              <app-feather-icon name="x" size="20px"></app-feather-icon>
            </button>
          </div>
          <div class="modal-content" *ngIf="selectedApplication">
            <div class="disbursement-info">
              <p>Are you sure you want to disburse the following loan?</p>
              <div class="info-item">
                <label>Applicant:</label>
                <span>{{ selectedApplication.applicantName }}</span>
              </div>
              <div class="info-item">
                <label>Amount:</label>
                <span class="amount">{{ formatCurrency(selectedApplication.amount) }}</span>
              </div>
              <div class="info-item">
                <label>Product:</label>
                <span>{{ selectedApplication.productName }}</span>
              </div>
              <div class="info-item">
                <label>Term:</label>
                <span>{{ selectedApplication.termMonths }} months</span>
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn btn-primary" (click)="confirmDisburse()">
                Confirm Disbursement
              </button>
              <button class="btn btn-secondary" (click)="closeDisburseModal()">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./loan-applications.component.scss']
})
export class LoanApplicationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  applications: LoanApplication[] = [];
  filteredApplications: LoanApplication[] = [];
  selectedApplication: LoanApplication | null = null;
  showApplicationModal = false;
  showRejectModal = false;
  showDisburseModal = false;
  rejectionReason = '';
  
  // Filters
  selectedStatus = '';
  selectedRiskLevel = '';
  selectedLoanType = '';
  searchTerm = '';
  
  // Stats
  stats = {
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0
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
    this.loadApplications();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeColumns() {
    this.columns = [
      { key: 'applicantName', title: 'Applicant', type: 'text', sortable: true },
      { key: 'loanType', title: 'Loan Type', type: 'text', sortable: true },
      { key: 'productName', title: 'Product', type: 'text', sortable: true },
      { key: 'amount', title: 'Amount', type: 'currency', sortable: true },
      { key: 'termMonths', title: 'Term (Months)', type: 'number', sortable: true },
      { key: 'riskLevel', title: 'Risk Level', type: 'status', sortable: true },
      { key: 'status', title: 'Status', type: 'status', sortable: true },
      { key: 'submittedAt', title: 'Submitted', type: 'date', sortable: true }
    ];
  }

  private loadApplications() {
    this.loading = true;
    
    this.lenderService.loanApplications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(applications => {
        this.applications = applications;
        this.filterApplications();
        this.calculateStats();
        this.loading = false;
      });
  }

  private setupEventListeners() {
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      this.closeDropdown();
    });
  }

  filterApplications() {
    let filtered = [...this.applications];

    // Filter by status
    if (this.selectedStatus) {
      filtered = filtered.filter(app => app.status === this.selectedStatus);
    }

    // Filter by risk level
    if (this.selectedRiskLevel) {
      filtered = filtered.filter(app => app.riskLevel === this.selectedRiskLevel);
    }

    // Filter by loan type
    if (this.selectedLoanType) {
      filtered = filtered.filter(app => app.loanType === this.selectedLoanType);
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.applicantName.toLowerCase().includes(term) ||
        app.applicantPhone.includes(term) ||
        app.productName.toLowerCase().includes(term)
      );
    }

    this.filteredApplications = filtered;
    this.totalPages = Math.ceil(this.filteredApplications.length / this.pageSize);
  }

  private calculateStats() {
    this.stats = {
      pending: this.applications.filter(app => app.status === 'pending').length,
      underReview: this.applications.filter(app => app.status === 'under_review').length,
      approved: this.applications.filter(app => app.status === 'approved').length,
      rejected: this.applications.filter(app => app.status === 'rejected').length
    };
  }

  refreshApplications() {
    this.loadApplications();
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    const { column, direction } = event;
    
    this.filteredApplications.sort((a, b) => {
      let aValue: any = (a as any)[column];
      let bValue: any = (b as any)[column];
      
      // Handle date sorting
      if (column.includes('At') || column.includes('Date')) {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }
      
      // Handle numeric sorting
      if (typeof aValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string sorting
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
  toggleDropdown(applicationId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === applicationId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = applicationId;
    }
  }

  closeDropdown() {
    this.openDropdownId = null;
  }

  // Application actions
  viewApplication(application: LoanApplication) {
    this.closeDropdown();
    this.selectedApplication = application;
    this.showApplicationModal = true;
  }

  startReview(application: LoanApplication) {
    this.lenderService.updateApplicationStatus(application.id, 'under_review');
    this.closeDropdown();
    this.refreshApplications();
  }

  approveApplication(application: LoanApplication) {
    this.lenderService.approveApplication(application.id, 'Application approved by lender');
    this.closeDropdown();
    this.refreshApplications();
  }

  rejectApplication(application: LoanApplication) {
    this.closeDropdown();
    this.selectedApplication = application;
    this.showRejectModal = true;
  }

  disburseLoan(application: LoanApplication) {
    this.closeDropdown();
    this.selectedApplication = application;
    this.showDisburseModal = true;
  }

  confirmReject(reason: string) {
    if (reason && reason.trim()) {
      this.lenderService.rejectApplication(this.selectedApplication!.id, reason);
      this.closeRejectModal();
      this.refreshApplications();
    }
  }

  confirmDisburse() {
    this.lenderService.disburseLoan(this.selectedApplication!.id);
    this.closeDisburseModal();
    this.refreshApplications();
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.rejectionReason = '';
  }

  closeDisburseModal() {
    this.showDisburseModal = false;
  }

  closeApplicationModal() {
    this.showApplicationModal = false;
    this.selectedApplication = null;
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return this.lenderService.formatCurrency(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  formatStatus(status: string): string {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatRiskLevel(riskLevel: string): string {
    return riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) + ' Risk';
  }

  getStatusColor(status: string): string {
    return this.lenderService.getStatusColor(status);
  }

  getRiskLevelColor(riskLevel: string): string {
    return this.lenderService.getRiskLevelColor(riskLevel);
  }
}
