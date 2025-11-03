import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { LenderService, ActiveLoan } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

export interface DelinquentLoan extends ActiveLoan {
  daysOverdue: number;
  overdueAmount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastContactDate?: Date;
  contactAttempts: number;
  recoveryProbability: number;
}

@Component({
  selector: 'app-delinquency-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="delinquency-management">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Delinquency Management</h1>
          <p class="page-description">Monitor and manage overdue loans and collection activities</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="exportReport()">
            <app-feather-icon name="download" size="16px"></app-feather-icon>
            Export Report
          </button>
          <button class="btn-primary" (click)="refreshData()">
            <app-feather-icon name="refresh-cw" size="16px"></app-feather-icon>
            Refresh
          </button>
        </div>
      </div>

      <!-- Risk Overview Cards -->
      <div class="risk-overview" *ngIf="delinquentLoans.length > 0">
        <div class="risk-card critical">
          <div class="risk-icon">
            <app-feather-icon name="alert-triangle" size="24px"></app-feather-icon>
          </div>
          <div class="risk-content">
            <div class="risk-label">Critical Risk</div>
            <div class="risk-value">{{ getRiskCount('critical') }}</div>
            <div class="risk-amount">{{ formatCurrency(getRiskAmount('critical')) }}</div>
          </div>
        </div>

        <div class="risk-card high">
          <div class="risk-icon">
            <app-feather-icon name="alert-circle" size="24px"></app-feather-icon>
          </div>
          <div class="risk-content">
            <div class="risk-label">High Risk</div>
            <div class="risk-value">{{ getRiskCount('high') }}</div>
            <div class="risk-amount">{{ formatCurrency(getRiskAmount('high')) }}</div>
          </div>
        </div>

        <div class="risk-card medium">
          <div class="risk-icon">
            <app-feather-icon name="clock" size="24px"></app-feather-icon>
          </div>
          <div class="risk-content">
            <div class="risk-label">Medium Risk</div>
            <div class="risk-value">{{ getRiskCount('medium') }}</div>
            <div class="risk-amount">{{ formatCurrency(getRiskAmount('medium')) }}</div>
          </div>
        </div>

        <div class="risk-card low">
          <div class="risk-icon">
            <app-feather-icon name="check-circle" size="24px"></app-feather-icon>
          </div>
          <div class="risk-content">
            <div class="risk-label">Low Risk</div>
            <div class="risk-value">{{ getRiskCount('low') }}</div>
            <div class="risk-amount">{{ formatCurrency(getRiskAmount('low')) }}</div>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="summary-stats" *ngIf="delinquentLoans.length > 0">
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="dollar-sign" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Overdue Amount</div>
            <div class="stat-value">{{ formatCurrency(totalOverdueAmount) }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="file-text" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">Delinquent Loans</div>
            <div class="stat-value">{{ delinquentLoans.length }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="calendar" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">Avg Days Overdue</div>
            <div class="stat-value">{{ averageDaysOverdue.toFixed(0) }} days</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="target" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">Recovery Rate</div>
            <div class="stat-value">{{ recoveryRate.toFixed(1) }}%</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="riskFilter">Risk Level</label>
            <select id="riskFilter" [(ngModel)]="selectedRiskLevel" (change)="filterLoans()">
              <option value="">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="daysFilter">Days Overdue</label>
            <select id="daysFilter" [(ngModel)]="selectedDaysRange" (change)="filterLoans()">
              <option value="">All Periods</option>
              <option value="1-30">1-30 days</option>
              <option value="31-60">31-60 days</option>
              <option value="61-90">61-90 days</option>
              <option value="90+">90+ days</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="searchInput">Search</label>
            <input 
              type="text" 
              id="searchInput" 
              [(ngModel)]="searchTerm" 
              (input)="filterLoans()"
              placeholder="Search by borrower name or loan number..."
            />
          </div>
        </div>
      </div>

      <!-- Delinquent Loans Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>Delinquent Loans</h3>
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
                    <a class="dropdown-item" href="javascript:void(0)" (click)="contactBorrower(loan)">
                      <app-feather-icon name="phone" size="14px" class="me-2"></app-feather-icon>
                      Contact Borrower
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="sendReminder(loan)">
                      <app-feather-icon name="mail" size="14px" class="me-2"></app-feather-icon>
                      Send Reminder
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="scheduleFollowUp(loan)">
                      <app-feather-icon name="calendar" size="14px" class="me-2"></app-feather-icon>
                      Schedule Follow-up
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="recordPayment(loan)">
                      <app-feather-icon name="check-circle" size="14px" class="me-2"></app-feather-icon>
                      Record Payment
                    </a>
                  </li>
                  <li *ngIf="loan.riskLevel === 'critical' || loan.daysOverdue > 90">
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="initiateLegalAction(loan)">
                      <app-feather-icon name="gavel" size="14px" class="me-2"></app-feather-icon>
                      Initiate Legal Action
                    </a>
                  </li>
                </ul>
              </div>
            </ng-template>
          </app-data-table>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading && filteredLoans.length === 0">
        <app-feather-icon name="check-circle" size="48px"></app-feather-icon>
        <h3>No Delinquent Loans</h3>
        <p>All loans are current. Great job!</p>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <app-feather-icon name="loader" size="32px"></app-feather-icon>
        <p>Loading delinquency data...</p>
      </div>
    </div>
  `,
  styleUrls: ['./delinquency-management.component.scss']
})
export class DelinquencyManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  delinquentLoans: DelinquentLoan[] = [];
  filteredLoans: DelinquentLoan[] = [];
  
  // Filters
  selectedRiskLevel = '';
  selectedDaysRange = '';
  searchTerm = '';
  
  // Stats
  totalOverdueAmount = 0;
  averageDaysOverdue = 0;
  recoveryRate = 0;
  
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
    this.loadDelinquentLoans();
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
      { key: 'overdueAmount', title: 'Overdue Amount', type: 'currency', sortable: true },
      { key: 'daysOverdue', title: 'Days Overdue', type: 'number', sortable: true },
      { key: 'riskLevel', title: 'Risk Level', type: 'status', sortable: true },
      { key: 'recoveryProbability', title: 'Recovery Prob.', type: 'percentage', sortable: true },
      { key: 'lastContactDate', title: 'Last Contact', type: 'date', sortable: true }
    ];
  }

  private loadDelinquentLoans() {
    this.loading = true;

    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loans => {
        // Filter and enhance loans with delinquency data
        this.delinquentLoans = loans
          .filter(loan => loan.daysPastDue > 0)
          .map(loan => this.enhanceLoanWithDelinquencyData(loan));

        this.calculateStats();
        this.filterLoans();
        this.loading = false;
      });
  }

  private enhanceLoanWithDelinquencyData(loan: ActiveLoan): DelinquentLoan {
    const daysOverdue = loan.daysPastDue;
    const overdueAmount = loan.monthlyPayment;
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (daysOverdue > 90) riskLevel = 'critical';
    else if (daysOverdue > 60) riskLevel = 'high';
    else if (daysOverdue > 30) riskLevel = 'medium';

    // Calculate recovery probability (mock calculation)
    const recoveryProbability = Math.max(0, Math.min(100, 95 - (daysOverdue * 0.5)));

    return {
      ...loan,
      daysOverdue,
      overdueAmount,
      riskLevel,
      lastContactDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last 7 days
      contactAttempts: Math.floor(Math.random() * 5),
      recoveryProbability
    };
  }

  private calculateStats() {
    if (this.delinquentLoans.length === 0) {
      this.totalOverdueAmount = 0;
      this.averageDaysOverdue = 0;
      this.recoveryRate = 0;
      return;
    }

    this.totalOverdueAmount = this.delinquentLoans.reduce((sum, loan) => sum + loan.overdueAmount, 0);
    this.averageDaysOverdue = this.delinquentLoans.reduce((sum, loan) => sum + loan.daysOverdue, 0) / this.delinquentLoans.length;
    
    // Mock recovery rate calculation
    this.recoveryRate = this.delinquentLoans.reduce((sum, loan) => sum + loan.recoveryProbability, 0) / this.delinquentLoans.length;
  }

  filterLoans() {
    let filtered = [...this.delinquentLoans];

    // Filter by risk level
    if (this.selectedRiskLevel) {
      filtered = filtered.filter(loan => loan.riskLevel === this.selectedRiskLevel);
    }

    // Filter by days range
    if (this.selectedDaysRange) {
      switch (this.selectedDaysRange) {
        case '1-30':
          filtered = filtered.filter(loan => loan.daysOverdue >= 1 && loan.daysOverdue <= 30);
          break;
        case '31-60':
          filtered = filtered.filter(loan => loan.daysOverdue >= 31 && loan.daysOverdue <= 60);
          break;
        case '61-90':
          filtered = filtered.filter(loan => loan.daysOverdue >= 61 && loan.daysOverdue <= 90);
          break;
        case '90+':
          filtered = filtered.filter(loan => loan.daysOverdue > 90);
          break;
      }
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(loan =>
        loan.borrowerName.toLowerCase().includes(term) ||
        loan.loanNumber.toLowerCase().includes(term) ||
        loan.borrowerPhone.includes(term)
      );
    }

    this.filteredLoans = filtered;
    this.totalPages = Math.ceil(this.filteredLoans.length / this.pageSize);
  }

  getRiskCount(riskLevel: string): number {
    return this.delinquentLoans.filter(loan => loan.riskLevel === riskLevel).length;
  }

  getRiskAmount(riskLevel: string): number {
    return this.delinquentLoans
      .filter(loan => loan.riskLevel === riskLevel)
      .reduce((sum, loan) => sum + loan.overdueAmount, 0);
  }

  refreshData() {
    this.loadDelinquentLoans();
  }

  exportReport() {
    console.log('Export delinquency report');
    alert('Export functionality will be implemented');
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

  private setupEventListeners() {
    document.addEventListener('click', () => {
      this.closeDropdown();
    });
  }

  // Action methods
  viewLoanDetails(loan: DelinquentLoan) {
    this.closeDropdown();
    console.log('View loan details:', loan.loanNumber);
  }

  contactBorrower(loan: DelinquentLoan) {
    this.closeDropdown();
    console.log('Contact borrower:', loan.borrowerPhone);
    alert(`Contacting ${loan.borrowerName} at ${loan.borrowerPhone}`);
  }

  sendReminder(loan: DelinquentLoan) {
    this.closeDropdown();
    console.log('Send reminder for loan:', loan.loanNumber);
    alert(`Reminder sent to ${loan.borrowerName} for loan ${loan.loanNumber}`);
  }

  scheduleFollowUp(loan: DelinquentLoan) {
    this.closeDropdown();
    console.log('Schedule follow-up for loan:', loan.loanNumber);
    alert(`Follow-up scheduled for loan ${loan.loanNumber}`);
  }

  recordPayment(loan: DelinquentLoan) {
    this.closeDropdown();
    console.log('Record payment for loan:', loan.loanNumber);
    alert(`Payment recording interface will open for loan ${loan.loanNumber}`);
  }

  initiateLegalAction(loan: DelinquentLoan) {
    this.closeDropdown();
    if (confirm(`Are you sure you want to initiate legal action for loan ${loan.loanNumber}? This action should only be taken after all collection attempts have been exhausted.`)) {
      console.log('Initiate legal action for loan:', loan.loanNumber);
      alert('Legal action initiated. The case has been forwarded to the legal department.');
    }
  }

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
}

