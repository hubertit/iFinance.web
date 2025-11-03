import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { LenderService, ActiveLoan, LoanApplication } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

export interface LoanHistory {
  id: string;
  loanNumber: string;
  productName: string;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  disbursedAmount: number;
  totalPaid: number;
  outstandingBalance: number;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  disbursedAt: Date;
  completedAt?: Date;
  defaultedAt?: Date;
}

@Component({
  selector: 'app-borrower-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="borrower-history">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Borrower Loan History</h1>
          <p class="page-description">Complete loan history for {{ borrowerName || 'borrower' }}</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="goBack()">
            <app-feather-icon name="arrow-left" size="16px"></app-feather-icon>
            Back
          </button>
          <button class="btn-primary" (click)="exportHistory()">
            <app-feather-icon name="download" size="16px"></app-feather-icon>
            Export
          </button>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="summary-section" *ngIf="loanHistory.length > 0">
        <div class="summary-card">
          <div class="summary-label">Total Loans</div>
          <div class="summary-value">{{ loanHistory.length }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Borrowed</div>
          <div class="summary-value">{{ formatCurrency(totalBorrowed) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Paid</div>
          <div class="summary-value">{{ formatCurrency(totalPaid) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Outstanding</div>
          <div class="summary-value">{{ formatCurrency(totalOutstanding) }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="statusFilter">Loan Status</label>
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterHistory()">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="dateFrom">From Date</label>
            <input 
              type="date" 
              id="dateFrom" 
              [(ngModel)]="dateFrom" 
              (change)="filterHistory()"
            />
          </div>

          <div class="filter-group">
            <label for="dateTo">To Date</label>
            <input 
              type="date" 
              id="dateTo" 
              [(ngModel)]="dateTo" 
              (change)="filterHistory()"
            />
          </div>

          <div class="filter-group">
            <label for="searchInput">Search</label>
            <input 
              type="text" 
              id="searchInput" 
              [(ngModel)]="searchTerm" 
              (input)="filterHistory()"
              placeholder="Search by loan number..."
            />
          </div>
        </div>
      </div>

      <!-- History Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>Loan History</h3>
            <span class="history-count">{{ filteredHistory.length }} loans</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredHistory"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="filteredHistory.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-history>
              <div class="dropdown" [class.show]="openDropdownId === history.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(history.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === history.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewLoanDetails(history)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View Details
                    </a>
                  </li>
                  <li *ngIf="history.status === 'active'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewSchedule(history)">
                      <app-feather-icon name="calendar" size="14px" class="me-2"></app-feather-icon>
                      View Schedule
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="downloadStatement(history)">
                      <app-feather-icon name="download" size="14px" class="me-2"></app-feather-icon>
                      Download Statement
                    </a>
                  </li>
                </ul>
              </div>
            </ng-template>
          </app-data-table>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading && loanHistory.length === 0">
        <app-feather-icon name="loader" size="32px"></app-feather-icon>
        <p>Loading loan history...</p>
      </div>
    </div>
  `,
  styleUrls: ['./borrower-history.component.scss']
})
export class BorrowerHistoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  borrowerId: string = '';
  borrowerName: string = '';
  loanHistory: LoanHistory[] = [];
  filteredHistory: LoanHistory[] = [];
  
  // Filters
  selectedStatus = '';
  dateFrom = '';
  dateTo = '';
  searchTerm = '';
  
  // Stats
  totalBorrowed = 0;
  totalPaid = 0;
  totalOutstanding = 0;
  
  // Table
  columns: any[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  openDropdownId: string | null = null;

  constructor(
    private lenderService: LenderService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.initializeColumns();
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.borrowerId = params['id'];
        this.loadLoanHistory();
      }
    });
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeColumns() {
    this.columns = [
      { key: 'loanNumber', title: 'Loan Number', type: 'text', sortable: true },
      { key: 'productName', title: 'Product', type: 'text', sortable: true },
      { key: 'disbursedAmount', title: 'Principal', type: 'currency', sortable: true },
      { key: 'interestRate', title: 'Interest Rate', type: 'number', sortable: true },
      { key: 'termMonths', title: 'Term (Months)', type: 'number', sortable: true },
      { key: 'totalPaid', title: 'Total Paid', type: 'currency', sortable: true },
      { key: 'outstandingBalance', title: 'Outstanding', type: 'currency', sortable: true },
      { key: 'status', title: 'Status', type: 'status', sortable: true },
      { key: 'disbursedAt', title: 'Disbursed', type: 'date', sortable: true }
    ];
  }

  private loadLoanHistory() {
    this.loading = true;

    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loans => {
        const borrowerLoans = loans.filter(l => l.borrowerId === this.borrowerId);
        
        if (borrowerLoans.length > 0) {
          this.borrowerName = borrowerLoans[0].borrowerName;
          
          this.loanHistory = borrowerLoans.map(loan => ({
            id: loan.id,
            loanNumber: loan.loanNumber,
            productName: loan.productName,
            principalAmount: loan.principalAmount,
            interestRate: loan.interestRate,
            termMonths: loan.termMonths,
            disbursedAmount: loan.disbursedAmount,
            totalPaid: loan.totalPaid,
            outstandingBalance: loan.outstandingBalance,
            status: loan.status,
            disbursedAt: loan.disbursedAt,
            completedAt: loan.status === 'completed' ? new Date() : undefined,
            defaultedAt: loan.status === 'defaulted' ? new Date() : undefined
          }));
          
          this.calculateStats();
          this.filterHistory();
        }
        
        this.loading = false;
      });
  }

  private calculateStats() {
    this.totalBorrowed = this.loanHistory.reduce((sum, loan) => sum + loan.disbursedAmount, 0);
    this.totalPaid = this.loanHistory.reduce((sum, loan) => sum + loan.totalPaid, 0);
    this.totalOutstanding = this.loanHistory.reduce((sum, loan) => sum + loan.outstandingBalance, 0);
  }

  filterHistory() {
    let filtered = [...this.loanHistory];

    if (this.selectedStatus) {
      filtered = filtered.filter(h => h.status === this.selectedStatus);
    }

    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      filtered = filtered.filter(h => new Date(h.disbursedAt) >= fromDate);
    }

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      filtered = filtered.filter(h => new Date(h.disbursedAt) <= toDate);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(h =>
        h.loanNumber.toLowerCase().includes(term) ||
        h.productName.toLowerCase().includes(term)
      );
    }

    this.filteredHistory = filtered;
    this.totalPages = Math.ceil(this.filteredHistory.length / this.pageSize);
  }

  goBack() {
    window.history.back();
  }

  exportHistory() {
    console.log('Export loan history');
    alert('Export functionality will be implemented');
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    const { column, direction } = event;
    
    this.filteredHistory.sort((a, b) => {
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
  toggleDropdown(historyId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === historyId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = historyId;
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
  viewLoanDetails(history: LoanHistory) {
    this.closeDropdown();
    console.log('View loan details:', history.id);
  }

  viewSchedule(history: LoanHistory) {
    this.closeDropdown();
    console.log('View schedule:', history.id);
  }

  downloadStatement(history: LoanHistory) {
    this.closeDropdown();
    console.log('Download statement:', history.id);
    alert(`Downloading statement for ${history.loanNumber}...`);
  }

  formatCurrency(amount: number): string {
    return this.lenderService.formatCurrency(amount);
  }
}

