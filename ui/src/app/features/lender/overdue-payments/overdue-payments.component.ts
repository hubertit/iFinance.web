import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { LenderService, ActiveLoan } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

export interface OverduePayment {
  id: string;
  loanId: string;
  loanNumber: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerEmail?: string;
  dueDate: Date;
  amountDue: number;
  daysPastDue: number;
  overdueAmount: number;
  lastReminderSent?: Date;
  reminderCount: number;
  status: 'active' | 'in_collection' | 'resolved';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

@Component({
  selector: 'app-overdue-payments',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="overdue-payments">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Overdue Payments</h1>
          <p class="page-description">Manage overdue loan payments and collections</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="exportReport()">
            <app-feather-icon name="download" size="16px"></app-feather-icon>
            Export
          </button>
          <button class="btn-primary" (click)="sendBulkReminders()">
            <app-feather-icon name="send" size="16px"></app-feather-icon>
            Send Bulk Reminders
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid" *ngIf="overdueStats">
        <div class="stat-card critical">
          <div class="stat-icon">
            <app-feather-icon name="alert-triangle" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ overdueStats.critical }}</div>
            <div class="stat-label">Critical (90+ days)</div>
          </div>
        </div>

        <div class="stat-card high">
          <div class="stat-icon">
            <app-feather-icon name="alert-circle" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ overdueStats.high }}</div>
            <div class="stat-label">High (60-89 days)</div>
          </div>
        </div>

        <div class="stat-card medium">
          <div class="stat-icon">
            <app-feather-icon name="clock" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ overdueStats.medium }}</div>
            <div class="stat-label">Medium (30-59 days)</div>
          </div>
        </div>

        <div class="stat-card total">
          <div class="stat-icon">
            <app-feather-icon name="dollar-sign" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(overdueStats.totalAmount) }}</div>
            <div class="stat-label">Total Overdue</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="riskFilter">Risk Level</label>
            <select id="riskFilter" [(ngModel)]="selectedRiskLevel" (change)="filterOverdue()">
              <option value="">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="statusFilter">Status</label>
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterOverdue()">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="in_collection">In Collection</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="daysFilter">Days Past Due</label>
            <select id="daysFilter" [(ngModel)]="selectedDaysRange" (change)="filterOverdue()">
              <option value="">All Ranges</option>
              <option value="0-30">0-30 days</option>
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
              (input)="filterOverdue()"
              placeholder="Search by loan number, borrower..."
            />
          </div>
        </div>
      </div>

      <!-- Overdue Payments Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>Overdue Payments</h3>
            <span class="overdue-count">{{ filteredOverduePayments.length }} overdue</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredOverduePayments"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="filteredOverduePayments.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-payment>
              <div class="dropdown" [class.show]="openDropdownId === payment.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(payment.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === payment.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewDetails(payment)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View Details
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="sendReminder(payment)">
                      <app-feather-icon name="bell" size="14px" class="me-2"></app-feather-icon>
                      Send Reminder
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="initiateCollection(payment)">
                      <app-feather-icon name="phone" size="14px" class="me-2"></app-feather-icon>
                      Initiate Collection
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="recordPayment(payment)">
                      <app-feather-icon name="dollar-sign" size="14px" class="me-2"></app-feather-icon>
                      Record Payment
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewLoan(payment)">
                      <app-feather-icon name="file-text" size="14px" class="me-2"></app-feather-icon>
                      View Loan
                    </a>
                  </li>
                </ul>
              </div>
            </ng-template>
          </app-data-table>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <app-feather-icon name="loader" size="32px"></app-feather-icon>
        <p>Loading overdue payments...</p>
      </div>
    </div>
  `,
  styleUrls: ['./overdue-payments.component.scss']
})
export class OverduePaymentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  overduePayments: OverduePayment[] = [];
  filteredOverduePayments: OverduePayment[] = [];
  
  // Filters
  selectedRiskLevel = '';
  selectedStatus = '';
  selectedDaysRange = '';
  searchTerm = '';
  
  // Stats
  overdueStats: {
    critical: number;
    high: number;
    medium: number;
    totalAmount: number;
  } | null = null;
  
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
    this.loadOverduePayments();
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
      { key: 'dueDate', title: 'Due Date', type: 'date', sortable: true },
      { key: 'daysPastDue', title: 'Days Overdue', type: 'number', sortable: true },
      { key: 'amountDue', title: 'Amount Due', type: 'currency', sortable: true },
      { key: 'overdueAmount', title: 'Overdue', type: 'currency', sortable: true },
      { key: 'riskLevel', title: 'Risk Level', type: 'status', sortable: true },
      { key: 'status', title: 'Status', type: 'status', sortable: true }
    ];
  }

  private loadOverduePayments() {
    this.loading = true;

    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loans => {
        this.overduePayments = this.extractOverduePayments(loans);
        this.calculateStats();
        this.filterOverdue();
        this.loading = false;
      });
  }

  private extractOverduePayments(loans: ActiveLoan[]): OverduePayment[] {
    const overdue: OverduePayment[] = [];
    
    loans.forEach(loan => {
      if (loan.daysPastDue > 0) {
        const riskLevel = this.calculateRiskLevel(loan.daysPastDue);
        const overdueAmount = loan.monthlyPayment * Math.min(loan.daysPastDue / 30, 3);
        
        overdue.push({
          id: `OVERDUE-${loan.id}`,
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          borrowerName: loan.borrowerName,
          borrowerPhone: loan.borrowerPhone,
          borrowerEmail: `${loan.borrowerName.toLowerCase().replace(' ', '.')}@email.com`,
          dueDate: new Date(loan.nextPaymentDate.getTime() - loan.daysPastDue * 24 * 60 * 60 * 1000),
          amountDue: loan.monthlyPayment,
          daysPastDue: loan.daysPastDue,
          overdueAmount: overdueAmount,
          lastReminderSent: loan.daysPastDue > 15 ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : undefined,
          reminderCount: Math.floor(loan.daysPastDue / 15),
          status: loan.daysPastDue > 60 ? 'in_collection' : 'active',
          riskLevel: riskLevel
        });
      }
    });
    
    return overdue.sort((a, b) => b.daysPastDue - a.daysPastDue);
  }

  private calculateRiskLevel(daysPastDue: number): 'low' | 'medium' | 'high' | 'critical' {
    if (daysPastDue >= 90) return 'critical';
    if (daysPastDue >= 60) return 'high';
    if (daysPastDue >= 30) return 'medium';
    return 'low';
  }

  private calculateStats() {
    this.overdueStats = {
      critical: this.overduePayments.filter(p => p.riskLevel === 'critical').length,
      high: this.overduePayments.filter(p => p.riskLevel === 'high').length,
      medium: this.overduePayments.filter(p => p.riskLevel === 'medium').length,
      totalAmount: this.overduePayments.reduce((sum, p) => sum + p.overdueAmount, 0)
    };
  }

  filterOverdue() {
    let filtered = [...this.overduePayments];

    if (this.selectedRiskLevel) {
      filtered = filtered.filter(p => p.riskLevel === this.selectedRiskLevel);
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(p => p.status === this.selectedStatus);
    }

    if (this.selectedDaysRange) {
      if (this.selectedDaysRange === '90+') {
        filtered = filtered.filter(p => p.daysPastDue >= 90);
      } else {
        const [min, max] = this.selectedDaysRange.split('-').map(Number);
        filtered = filtered.filter(p => p.daysPastDue >= min && p.daysPastDue <= max);
      }
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.loanNumber.toLowerCase().includes(term) ||
        p.borrowerName.toLowerCase().includes(term)
      );
    }

    this.filteredOverduePayments = filtered;
    this.totalPages = Math.ceil(this.filteredOverduePayments.length / this.pageSize);
  }

  exportReport() {
    console.log('Export overdue payments report');
    alert('Export functionality will be implemented');
  }

  sendBulkReminders() {
    if (this.filteredOverduePayments.length === 0) {
      alert('No overdue payments to send reminders for');
      return;
    }
    
    if (confirm(`Send reminders to ${this.filteredOverduePayments.length} borrowers?`)) {
      this.filteredOverduePayments.forEach(payment => {
        payment.lastReminderSent = new Date();
        payment.reminderCount++;
      });
      alert('Bulk reminders sent successfully!');
    }
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    const { column, direction } = event;
    
    this.filteredOverduePayments.sort((a, b) => {
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
  toggleDropdown(paymentId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === paymentId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = paymentId;
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
  viewDetails(payment: OverduePayment) {
    this.closeDropdown();
    console.log('View details:', payment.id);
    alert(`Overdue Payment Details:\nLoan: ${payment.loanNumber}\nDays Overdue: ${payment.daysPastDue}\nAmount: ${this.formatCurrency(payment.overdueAmount)}`);
  }

  sendReminder(payment: OverduePayment) {
    this.closeDropdown();
    payment.lastReminderSent = new Date();
    payment.reminderCount++;
    alert(`Reminder sent to ${payment.borrowerName}`);
  }

  initiateCollection(payment: OverduePayment) {
    this.closeDropdown();
    if (confirm(`Initiate collection process for ${payment.borrowerName}?`)) {
      payment.status = 'in_collection';
      this.filterOverdue();
      alert('Collection process initiated');
    }
  }

  recordPayment(payment: OverduePayment) {
    this.closeDropdown();
    const amount = prompt(`Enter payment amount (Overdue: ${this.formatCurrency(payment.overdueAmount)}):`);
    if (amount && parseFloat(amount) > 0) {
      alert(`Payment of ${this.formatCurrency(parseFloat(amount))} recorded for ${payment.borrowerName}`);
    }
  }

  viewLoan(payment: OverduePayment) {
    this.closeDropdown();
    console.log('View loan:', payment.loanId);
    alert(`Viewing loan ${payment.loanNumber}`);
  }

  formatCurrency(amount: number): string {
    return this.lenderService.formatCurrency(amount);
  }
}

