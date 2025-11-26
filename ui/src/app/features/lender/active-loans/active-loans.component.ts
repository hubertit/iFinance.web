import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { LenderService, ActiveLoan } from '../../../core/services/lender.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-active-loans',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="active-loans">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Active Loans</h1>
          <p class="page-description">Monitor and manage all active loan accounts</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="refreshLoans()">
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
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterLoans()">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="overdueFilter">Payment Status</label>
            <select id="overdueFilter" [(ngModel)]="selectedPaymentStatus" (change)="filterLoans()">
              <option value="">All</option>
              <option value="current">Current</option>
              <option value="overdue">Overdue</option>
              <option value="due_soon">Due Soon (7 days)</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="searchInput">Search</label>
            <input 
              type="text" 
              id="searchInput" 
              [(ngModel)]="searchTerm" 
              (input)="filterLoans()"
              placeholder="Search by borrower name, phone, or loan number..."
            />
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card active">
          <div class="stat-icon">
            <app-feather-icon name="dollar-sign" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.activeLoans }}</div>
            <div class="stat-label">Active Loans</div>
          </div>
        </div>
        
        <div class="stat-card portfolio">
          <div class="stat-icon">
            <app-feather-icon name="briefcase" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(stats.totalPortfolio) }}</div>
            <div class="stat-label">Total Portfolio</div>
          </div>
        </div>
        
        <div class="stat-card overdue">
          <div class="stat-icon">
            <app-feather-icon name="alert-circle" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.overdueLoans }}</div>
            <div class="stat-label">Overdue Loans</div>
            <div class="stat-change negative" *ngIf="stats.overdueAmount > 0">
              {{ formatCurrency(stats.overdueAmount) }} overdue
            </div>
          </div>
        </div>
        
        <div class="stat-card collections">
          <div class="stat-icon">
            <app-feather-icon name="trending-up" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(stats.totalCollections) }}</div>
            <div class="stat-label">Total Collections</div>
          </div>
        </div>
      </div>

      <!-- Loans Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>Active Loans</h3>
            <span class="loan-count">{{ filteredLoans.length }} loans</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredLoans"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="filteredLoans.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-loan>
              <div class="dropdown" [class.show]="openDropdownId === loan.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(loan.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === loan.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewLoanDetails(loan)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View Details
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewPaymentSchedule(loan)">
                      <app-feather-icon name="calendar" size="14px" class="me-2"></app-feather-icon>
                      Payment Schedule
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="recordPayment(loan)">
                      <app-feather-icon name="check-circle" size="14px" class="me-2"></app-feather-icon>
                      Record Payment
                    </a>
                  </li>
                  <li *ngIf="loan.daysPastDue > 0">
                    <a class="dropdown-item text-warning" href="javascript:void(0)" (click)="sendReminder(loan)">
                      <app-feather-icon name="mail" size="14px" class="me-2"></app-feather-icon>
                      Send Reminder
                    </a>
                  </li>
                  <li *ngIf="loan.status === 'active'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="markAsDefaulted(loan)">
                      <app-feather-icon name="alert-triangle" size="14px" class="me-2"></app-feather-icon>
                      Mark as Defaulted
                    </a>
                  </li>
                </ul>
              </div>
            </ng-template>
          </app-data-table>
        </div>
      </div>

      <!-- Loan Details Modal -->
      <div class="modal-overlay" *ngIf="showLoanModal" (click)="closeLoanModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Loan Details</h3>
            <button class="close-btn" (click)="closeLoanModal()">
              <app-feather-icon name="x" size="20px"></app-feather-icon>
            </button>
          </div>
          
          <div class="modal-content" *ngIf="selectedLoan">
            <div class="loan-info">
              <div class="info-section">
                <h4>Loan Information</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Loan Number:</label>
                    <span class="loan-number">{{ selectedLoan.loanNumber }}</span>
                  </div>
                  <div class="info-item">
                    <label>Status:</label>
                    <span class="status" [style.color]="getStatusColor(selectedLoan.status)">
                      {{ formatStatus(selectedLoan.status) }}
                    </span>
                  </div>
                  <div class="info-item">
                    <label>Product:</label>
                    <span>{{ selectedLoan.productName }}</span>
                  </div>
                  <div class="info-item">
                    <label>Interest Rate:</label>
                    <span>{{ selectedLoan.interestRate }}%</span>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <h4>Borrower Information</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Name:</label>
                    <span>{{ selectedLoan.borrowerName }}</span>
                  </div>
                  <div class="info-item">
                    <label>Phone:</label>
                    <span>{{ selectedLoan.borrowerPhone }}</span>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <h4>Loan Terms</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Principal Amount:</label>
                    <span class="amount">{{ formatCurrency(selectedLoan.principalAmount) }}</span>
                  </div>
                  <div class="info-item">
                    <label>Disbursed Amount:</label>
                    <span class="amount">{{ formatCurrency(selectedLoan.disbursedAmount) }}</span>
                  </div>
                  <div class="info-item">
                    <label>Term:</label>
                    <span>{{ selectedLoan.termMonths }} months</span>
                  </div>
                  <div class="info-item">
                    <label>Monthly Payment:</label>
                    <span class="amount">{{ formatCurrency(selectedLoan.monthlyPayment) }}</span>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <h4>Payment Status</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Outstanding Balance:</label>
                    <span class="amount">{{ formatCurrency(selectedLoan.outstandingBalance) }}</span>
                  </div>
                  <div class="info-item">
                    <label>Total Paid:</label>
                    <span class="amount positive">{{ formatCurrency(selectedLoan.totalPaid) }}</span>
                  </div>
                  <div class="info-item">
                    <label>Next Payment Date:</label>
                    <span [class.overdue]="selectedLoan.daysPastDue > 0">
                      {{ formatDate(selectedLoan.nextPaymentDate) }}
                    </span>
                  </div>
                  <div class="info-item">
                    <label>Days Past Due:</label>
                    <span class="days-past-due" [class]="selectedLoan.daysPastDue > 0 ? 'negative' : 'positive'">
                      {{ selectedLoan.daysPastDue }} days
                    </span>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <h4>Payment Progress</h4>
                <div class="progress-info">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="(selectedLoan.paymentsCompleted / selectedLoan.termMonths) * 100"></div>
                  </div>
                  <div class="progress-text">
                    {{ selectedLoan.paymentsCompleted }} of {{ selectedLoan.termMonths }} payments completed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./active-loans.component.scss']
})
export class ActiveLoansComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loans: ActiveLoan[] = [];
  filteredLoans: ActiveLoan[] = [];
  selectedLoan: ActiveLoan | null = null;
  showLoanModal = false;
  
  // Filters
  selectedStatus = '';
  selectedPaymentStatus = '';
  searchTerm = '';
  
  // Stats
  stats = {
    activeLoans: 0,
    totalPortfolio: 0,
    overdueLoans: 0,
    overdueAmount: 0,
    totalCollections: 0
  };
  
  // Table
  columns: any[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  openDropdownId: string | null = null;

  constructor(
    private lenderService: LenderService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.initializeColumns();
    this.loadLoans();
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
      { key: 'principalAmount', title: 'Principal', type: 'currency', sortable: true },
      { key: 'outstandingBalance', title: 'Outstanding', type: 'currency', sortable: true },
      { key: 'monthlyPayment', title: 'Monthly Payment', type: 'currency', sortable: true },
      { key: 'nextPaymentDate', title: 'Next Payment', type: 'date', sortable: true },
      { key: 'daysPastDue', title: 'Days Past Due', type: 'number', sortable: true },
      { key: 'status', title: 'Status', type: 'status', sortable: true }
    ];
  }

  private loadLoans() {
    this.loading = true;
    
    // Check if loans exist, if not, fetch borrowers and generate loans
    const currentLoans = this.lenderService.getActiveLoans();
    if (currentLoans.length === 0) {
      // No loans yet, fetch borrowers from API and generate loans
      this.fetchBorrowersAndGenerateLoans();
    } else {
      // Loans exist, use them
      this.loans = currentLoans;
      this.filterLoans();
      this.calculateStats();
      this.loading = false;
    }

    // Subscribe to loan updates
    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loans => {
        if (loans.length > 0) {
          this.loans = loans;
          this.filterLoans();
          this.calculateStats();
          this.loading = false;
        }
      });
  }

  /**
   * Fetch borrowers from DJYH API and generate loans
   */
  private fetchBorrowersAndGenerateLoans() {
    const token = this.authService.getToken();
    if (!token) {
      console.error('🔧 ActiveLoansComponent: No authentication token found.');
      this.loading = false;
      return;
    }

    const apiUrl = '/djyh-api/api/v1/users/dcc?limit=500';
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<any>(apiUrl, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let apiUsers: any[] = [];
          if (response?.success && response?.data && Array.isArray(response.data)) {
            apiUsers = response.data;
          } else if (response && Array.isArray(response)) {
            apiUsers = response;
          }

          if (apiUsers.length > 0) {
            // Generate loans from borrowers
            const borrowersForLoans = apiUsers.map((user: any) => ({
              id: user.id || '',
              name: user.name || 'Unknown',
              phone: user.phone || '',
              email: user.email || ''
            }));
            this.lenderService.generateLoansFromBorrowers(borrowersForLoans);
            console.log(`✅ ActiveLoansComponent: Generated ${borrowersForLoans.length * 2} loans from ${borrowersForLoans.length} borrowers`);
          }
        },
        error: (error) => {
          console.error('❌ ActiveLoansComponent: Error fetching borrowers:', error);
          this.loading = false;
        }
      });
  }

  private setupEventListeners() {
    document.addEventListener('click', () => {
      this.closeDropdown();
    });
  }

  filterLoans() {
    let filtered = [...this.loans];

    // Filter by status
    if (this.selectedStatus) {
      filtered = filtered.filter(loan => loan.status === this.selectedStatus);
    }

    // Filter by payment status
    if (this.selectedPaymentStatus) {
      switch (this.selectedPaymentStatus) {
        case 'current':
          filtered = filtered.filter(loan => loan.daysPastDue === 0);
          break;
        case 'overdue':
          filtered = filtered.filter(loan => loan.daysPastDue > 0);
          break;
        case 'due_soon':
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
          filtered = filtered.filter(loan => {
            const nextPayment = new Date(loan.nextPaymentDate);
            return nextPayment <= sevenDaysFromNow && loan.daysPastDue === 0;
          });
          break;
      }
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(loan => 
        loan.borrowerName.toLowerCase().includes(term) ||
        loan.borrowerPhone.includes(term) ||
        loan.loanNumber.toLowerCase().includes(term) ||
        loan.productName.toLowerCase().includes(term)
      );
    }

    this.filteredLoans = filtered;
    this.totalPages = Math.ceil(this.filteredLoans.length / this.pageSize);
  }

  private calculateStats() {
    // Calculate stats from real loan data (from DJYH API borrowers)
    const activeLoans = this.loans.filter(loan => loan.status === 'active');
    const overdueLoans = this.loans.filter(loan => loan.daysPastDue > 0);
    
    this.stats = {
      activeLoans: activeLoans.length,
      totalPortfolio: this.loans.reduce((sum, loan) => sum + loan.outstandingBalance, 0),
      overdueLoans: overdueLoans.length,
      overdueAmount: overdueLoans.reduce((sum, loan) => sum + loan.outstandingBalance, 0), // Total overdue amount
      totalCollections: this.loans.reduce((sum, loan) => sum + loan.totalPaid, 0)
    };
  }

  refreshLoans() {
    this.loadLoans();
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    const { column, direction } = event;
    
    this.filteredLoans.sort((a, b) => {
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
  toggleDropdown(loanId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === loanId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = loanId;
    }
  }

  closeDropdown() {
    this.openDropdownId = null;
  }

  // Loan actions
  viewLoanDetails(loan: ActiveLoan) {
    this.closeDropdown();
    this.selectedLoan = loan;
    this.showLoanModal = true;
  }

  viewPaymentSchedule(loan: ActiveLoan) {
    this.closeDropdown();
    // TODO: Navigate to payment schedule page
    console.log('View payment schedule for loan:', loan.loanNumber);
  }

  recordPayment(loan: ActiveLoan) {
    this.closeDropdown();
    // TODO: Open record payment modal
    console.log('Record payment for loan:', loan.loanNumber);
  }

  sendReminder(loan: ActiveLoan) {
    this.closeDropdown();
    // TODO: Implement send reminder
    console.log('Send reminder for loan:', loan.loanNumber);
    alert(`Reminder sent to ${loan.borrowerName} for loan ${loan.loanNumber}`);
  }

  markAsDefaulted(loan: ActiveLoan) {
    this.closeDropdown();
    if (confirm(`Are you sure you want to mark loan ${loan.loanNumber} as defaulted?`)) {
      this.lenderService.updateActiveLoan(loan.id, { status: 'defaulted' });
      this.refreshLoans();
    }
  }

  closeLoanModal() {
    this.showLoanModal = false;
    this.selectedLoan = null;
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return this.lenderService.formatCurrency(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  getStatusColor(status: string): string {
    return this.lenderService.getStatusColor(status);
  }
}

