import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { LenderService, ActiveLoan } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

export interface PaymentSchedule {
  id: string;
  loanId: string;
  loanNumber: string;
  paymentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  paidDate?: Date;
  daysPastDue?: number;
}

@Component({
  selector: 'app-repayment-schedule',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="repayment-schedule">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Repayment Schedule</h1>
          <p class="page-description">View and manage loan repayment schedules</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="exportSchedule()">
            <app-feather-icon name="download" size="16px"></app-feather-icon>
            Export
          </button>
        </div>
      </div>

      <!-- Loan Selector -->
      <div class="loan-selector" *ngIf="loans.length > 0">
        <div class="selector-card">
          <label for="loanSelect">Select Loan</label>
          <select id="loanSelect" [(ngModel)]="selectedLoanId" (change)="loadSchedule()">
            <option value="">All Loans</option>
            <option *ngFor="let loan of loans" [value]="loan.id">{{ loan.loanNumber }} - {{ loan.borrowerName }}</option>
          </select>
        </div>
      </div>

      <!-- Schedule Summary -->
      <div class="summary-section" *ngIf="selectedLoan && scheduleSummary">
        <div class="summary-card">
          <div class="summary-label">Total Payments</div>
          <div class="summary-value">{{ scheduleSummary.totalPayments }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Paid</div>
          <div class="summary-value">{{ scheduleSummary.paid }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Pending</div>
          <div class="summary-value">{{ scheduleSummary.pending }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Overdue</div>
          <div class="summary-value">{{ scheduleSummary.overdue }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Due</div>
          <div class="summary-value">{{ formatCurrency(scheduleSummary.totalDue) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Paid</div>
          <div class="summary-value">{{ formatCurrency(scheduleSummary.totalPaid) }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section" *ngIf="schedules.length > 0">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="statusFilter">Payment Status</label>
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterSchedule()">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="dateFrom">From Date</label>
            <input 
              type="date" 
              id="dateFrom" 
              [(ngModel)]="dateFrom" 
              (change)="filterSchedule()"
            />
          </div>

          <div class="filter-group">
            <label for="dateTo">To Date</label>
            <input 
              type="date" 
              id="dateTo" 
              [(ngModel)]="dateTo" 
              (change)="filterSchedule()"
            />
          </div>
        </div>
      </div>

      <!-- Schedule Table -->
      <div class="card" *ngIf="schedules.length > 0">
        <div class="card-header">
          <div class="card-title-section">
            <h3>Payment Schedule</h3>
            <span class="schedule-count">{{ filteredSchedules.length }} payments</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredSchedules"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="filteredSchedules.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-schedule>
              <div class="dropdown" [class.show]="openDropdownId === schedule.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(schedule.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === schedule.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewDetails(schedule)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View Details
                    </a>
                  </li>
                  <li *ngIf="schedule.status === 'pending' || schedule.status === 'overdue'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="recordPayment(schedule)">
                      <app-feather-icon name="dollar-sign" size="14px" class="me-2"></app-feather-icon>
                      Record Payment
                    </a>
                  </li>
                  <li *ngIf="schedule.status === 'paid'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewReceipt(schedule)">
                      <app-feather-icon name="file-text" size="14px" class="me-2"></app-feather-icon>
                      View Receipt
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="sendReminder(schedule)">
                      <app-feather-icon name="bell" size="14px" class="me-2"></app-feather-icon>
                      Send Reminder
                    </a>
                  </li>
                </ul>
              </div>
            </ng-template>
          </app-data-table>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading && schedules.length === 0">
        <app-feather-icon name="calendar" size="48px"></app-feather-icon>
        <h3>No Schedule Found</h3>
        <p>Select a loan to view its repayment schedule</p>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <app-feather-icon name="loader" size="32px"></app-feather-icon>
        <p>Loading schedule...</p>
      </div>
    </div>
  `,
  styleUrls: ['./repayment-schedule.component.scss']
})
export class RepaymentScheduleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loans: ActiveLoan[] = [];
  selectedLoanId: string = '';
  selectedLoan: ActiveLoan | null = null;
  schedules: PaymentSchedule[] = [];
  filteredSchedules: PaymentSchedule[] = [];
  
  // Filters
  selectedStatus = '';
  dateFrom = '';
  dateTo = '';
  
  // Summary
  scheduleSummary: {
    totalPayments: number;
    paid: number;
    pending: number;
    overdue: number;
    totalDue: number;
    totalPaid: number;
  } | null = null;
  
  // Table
  columns: any[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;
  openDropdownId: string | null = null;

  constructor(
    private lenderService: LenderService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.initializeColumns();
    this.loadLoans();
    this.route.queryParams.subscribe(params => {
      if (params['loanId']) {
        this.selectedLoanId = params['loanId'];
        this.loadSchedule();
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
      { key: 'paymentNumber', title: '#', type: 'number', sortable: true },
      { key: 'dueDate', title: 'Due Date', type: 'date', sortable: true },
      { key: 'principalAmount', title: 'Principal', type: 'currency', sortable: true },
      { key: 'interestAmount', title: 'Interest', type: 'currency', sortable: true },
      { key: 'totalAmount', title: 'Total Due', type: 'currency', sortable: true },
      { key: 'paidAmount', title: 'Paid', type: 'currency', sortable: true },
      { key: 'status', title: 'Status', type: 'status', sortable: true },
      { key: 'paidDate', title: 'Paid Date', type: 'date', sortable: true }
    ];
  }

  private loadLoans() {
    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loans => {
        this.loans = loans;
        if (loans.length > 0 && !this.selectedLoanId) {
          this.selectedLoanId = loans[0].id;
          this.loadSchedule();
        }
      });
  }

  loadSchedule() {
    if (!this.selectedLoanId) {
      this.schedules = [];
      this.filteredSchedules = [];
      this.selectedLoan = null;
      this.scheduleSummary = null;
      return;
    }

    this.loading = true;
    this.selectedLoan = this.loans.find(l => l.id === this.selectedLoanId) || null;

    if (this.selectedLoan) {
      this.schedules = this.generateSchedule(this.selectedLoan);
      this.calculateSummary();
      this.filterSchedule();
    }
    
    this.loading = false;
  }

  private generateSchedule(loan: ActiveLoan): PaymentSchedule[] {
    const schedule: PaymentSchedule[] = [];
    const monthlyPayment = loan.monthlyPayment;
    let remainingPrincipal = loan.outstandingBalance + loan.totalPaid - loan.disbursedAmount;
    const monthlyInterestRate = loan.interestRate / 100 / 12;
    
    const startDate = new Date(loan.disbursedAt);
    
    for (let i = 1; i <= loan.termMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const interestAmount = remainingPrincipal * monthlyInterestRate;
      const principalAmount = monthlyPayment - interestAmount;
      remainingPrincipal -= principalAmount;
      
      const isPaid = i <= loan.paymentsCompleted;
      const isOverdue = !isPaid && new Date(dueDate) < new Date() && new Date(dueDate) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      let status: 'pending' | 'paid' | 'overdue' | 'partial' = 'pending';
      let paidAmount = 0;
      let paidDate: Date | undefined;
      
      if (isPaid) {
        status = 'paid';
        paidAmount = monthlyPayment;
        paidDate = new Date(dueDate);
        paidDate.setDate(paidDate.getDate() + Math.floor(Math.random() * 5));
      } else if (isOverdue) {
        status = 'overdue';
      }
      
      schedule.push({
        id: `SCHED-${loan.id}-${i}`,
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        paymentNumber: i,
        dueDate: dueDate,
        principalAmount: principalAmount,
        interestAmount: interestAmount,
        totalAmount: monthlyPayment,
        paidAmount: paidAmount,
        status: status,
        paidDate: paidDate,
        daysPastDue: isOverdue ? Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined
      });
    }
    
    return schedule;
  }

  private calculateSummary() {
    this.scheduleSummary = {
      totalPayments: this.schedules.length,
      paid: this.schedules.filter(s => s.status === 'paid').length,
      pending: this.schedules.filter(s => s.status === 'pending').length,
      overdue: this.schedules.filter(s => s.status === 'overdue').length,
      totalDue: this.schedules.reduce((sum, s) => sum + s.totalAmount, 0),
      totalPaid: this.schedules.reduce((sum, s) => sum + s.paidAmount, 0)
    };
  }

  filterSchedule() {
    let filtered = [...this.schedules];

    if (this.selectedStatus) {
      filtered = filtered.filter(s => s.status === this.selectedStatus);
    }

    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      filtered = filtered.filter(s => new Date(s.dueDate) >= fromDate);
    }

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      filtered = filtered.filter(s => new Date(s.dueDate) <= toDate);
    }

    this.filteredSchedules = filtered;
    this.totalPages = Math.ceil(this.filteredSchedules.length / this.pageSize);
  }

  exportSchedule() {
    console.log('Export repayment schedule');
    alert('Export functionality will be implemented');
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    const { column, direction } = event;
    
    this.filteredSchedules.sort((a, b) => {
      let aValue: any = (a as any)[column];
      let bValue: any = (b as any)[column];
      
      if (column.includes('Date') || column.includes('date')) {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
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
  toggleDropdown(scheduleId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === scheduleId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = scheduleId;
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
  viewDetails(schedule: PaymentSchedule) {
    this.closeDropdown();
    console.log('View details:', schedule.id);
    alert(`Payment #${schedule.paymentNumber} - ${this.formatCurrency(schedule.totalAmount)}`);
  }

  recordPayment(schedule: PaymentSchedule) {
    this.closeDropdown();
    const amount = prompt(`Enter payment amount (Due: ${this.formatCurrency(schedule.totalAmount)}):`);
    if (amount && parseFloat(amount) > 0) {
      const index = this.schedules.findIndex(s => s.id === schedule.id);
      if (index !== -1) {
        const paidAmt = parseFloat(amount);
        this.schedules[index].paidAmount = paidAmt;
        this.schedules[index].status = paidAmt >= schedule.totalAmount ? 'paid' : 'partial';
        this.schedules[index].paidDate = new Date();
        this.calculateSummary();
        this.filterSchedule();
      }
    }
  }

  viewReceipt(schedule: PaymentSchedule) {
    this.closeDropdown();
    console.log('View receipt:', schedule.id);
    alert(`Downloading receipt for Payment #${schedule.paymentNumber}...`);
  }

  sendReminder(schedule: PaymentSchedule) {
    this.closeDropdown();
    console.log('Send reminder:', schedule.id);
    alert('Payment reminder sent to borrower');
  }

  formatCurrency(amount: number): string {
    return this.lenderService.formatCurrency(amount);
  }
}

