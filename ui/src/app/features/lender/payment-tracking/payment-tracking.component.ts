import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { LenderService, ActiveLoan } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

export interface PaymentRecord {
  id: string;
  loanId: string;
  loanNumber: string;
  borrowerName: string;
  borrowerPhone: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'cheque' | 'other';
  receiptNumber: string;
  status: 'completed' | 'pending' | 'failed' | 'reversed';
  receivedBy?: string;
  notes?: string;
  referenceNumber?: string;
}

@Component({
  selector: 'app-payment-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="payment-tracking">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Payment Tracking</h1>
          <p class="page-description">Monitor and track loan payments</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="exportReport()">
            <app-feather-icon name="download" size="16px"></app-feather-icon>
            Export
          </button>
          <button class="btn-primary" (click)="recordPayment()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            Record Payment
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid" *ngIf="paymentStats">
        <div class="stat-card">
          <div class="stat-icon today">
            <app-feather-icon name="dollar-sign" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(paymentStats.today) }}</div>
            <div class="stat-label">Today's Payments</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon week">
            <app-feather-icon name="calendar" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(paymentStats.thisWeek) }}</div>
            <div class="stat-label">This Week</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon month">
            <app-feather-icon name="trending-up" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(paymentStats.thisMonth) }}</div>
            <div class="stat-label">This Month</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon total">
            <app-feather-icon name="check-circle" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ paymentStats.totalPayments }}</div>
            <div class="stat-label">Total Payments</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="statusFilter">Payment Status</label>
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterPayments()">
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="methodFilter">Payment Method</label>
            <select id="methodFilter" [(ngModel)]="selectedMethod" (change)="filterPayments()">
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="dateFrom">From Date</label>
            <input 
              type="date" 
              id="dateFrom" 
              [(ngModel)]="dateFrom" 
              (change)="filterPayments()"
            />
          </div>

          <div class="filter-group">
            <label for="dateTo">To Date</label>
            <input 
              type="date" 
              id="dateTo" 
              [(ngModel)]="dateTo" 
              (change)="filterPayments()"
            />
          </div>

          <div class="filter-group">
            <label for="searchInput">Search</label>
            <input 
              type="text" 
              id="searchInput" 
              [(ngModel)]="searchTerm" 
              (input)="filterPayments()"
              placeholder="Search by loan number, borrower..."
            />
          </div>
        </div>
      </div>

      <!-- Payments Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>Payment Records</h3>
            <span class="payment-count">{{ filteredPayments.length }} payments</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredPayments"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="filteredPayments.length"
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
                  <li *ngIf="payment.status === 'completed'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="downloadReceipt(payment)">
                      <app-feather-icon name="download" size="14px" class="me-2"></app-feather-icon>
                      Download Receipt
                    </a>
                  </li>
                  <li *ngIf="payment.status === 'pending'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="confirmPayment(payment)">
                      <app-feather-icon name="check" size="14px" class="me-2"></app-feather-icon>
                      Confirm Payment
                    </a>
                  </li>
                  <li *ngIf="payment.status === 'completed'">
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="reversePayment(payment)">
                      <app-feather-icon name="rotate-ccw" size="14px" class="me-2"></app-feather-icon>
                      Reverse Payment
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="sendReceipt(payment)">
                      <app-feather-icon name="send" size="14px" class="me-2"></app-feather-icon>
                      Send Receipt
                    </a>
                  </li>
                </ul>
              </div>
            </ng-template>
          </app-data-table>
        </div>
      </div>

      <!-- Payment Modal -->
      <div class="modal-overlay" *ngIf="showPaymentModal" (click)="closeModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Record Payment</h3>
            <button class="close-btn" (click)="closeModal()">
              <app-feather-icon name="x" size="20px"></app-feather-icon>
            </button>
          </div>
          
          <div class="modal-content">
            <div class="form-section">
              <div class="form-group">
                <label for="loanSelect">Loan <span class="required">*</span></label>
                <select id="loanSelect" [(ngModel)]="paymentForm.loanId">
                  <option value="">Select loan</option>
                  <option *ngFor="let loan of availableLoans" [value]="loan.id">
                    {{ loan.loanNumber }} - {{ loan.borrowerName }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="paymentAmount">Amount <span class="required">*</span></label>
                <input 
                  type="number" 
                  id="paymentAmount" 
                  [(ngModel)]="paymentForm.amount" 
                  placeholder="Enter payment amount"
                  min="0"
                />
              </div>

              <div class="form-group">
                <label for="paymentDate">Payment Date <span class="required">*</span></label>
                <input 
                  type="date" 
                  id="paymentDate" 
                  [(ngModel)]="paymentForm.paymentDate"
                />
              </div>

              <div class="form-group">
                <label for="paymentMethod">Payment Method <span class="required">*</span></label>
                <select id="paymentMethod" [(ngModel)]="paymentForm.paymentMethod">
                  <option value="">Select method</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div class="form-group">
                <label for="referenceNumber">Reference Number</label>
                <input 
                  type="text" 
                  id="referenceNumber" 
                  [(ngModel)]="paymentForm.referenceNumber" 
                  placeholder="Enter reference number"
                />
              </div>

              <div class="form-group">
                <label for="notes">Notes</label>
                <textarea 
                  id="notes" 
                  [(ngModel)]="paymentForm.notes" 
                  rows="3"
                  placeholder="Additional notes..."
                ></textarea>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button class="btn-primary" (click)="savePayment()">
                <app-feather-icon name="save" size="16px"></app-feather-icon>
                Save Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./payment-tracking.component.scss']
})
export class PaymentTrackingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  payments: PaymentRecord[] = [];
  filteredPayments: PaymentRecord[] = [];
  availableLoans: ActiveLoan[] = [];
  showPaymentModal = false;
  
  // Filters
  selectedStatus = '';
  selectedMethod = '';
  dateFrom = '';
  dateTo = '';
  searchTerm = '';
  
  // Stats
  paymentStats: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    totalPayments: number;
  } | null = null;
  
  // Form
  paymentForm: {
    loanId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber: string;
    notes: string;
  } = {
    loanId: '',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
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
    this.loadPayments();
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
      { key: 'paymentDate', title: 'Payment Date', type: 'date', sortable: true },
      { key: 'amount', title: 'Amount', type: 'currency', sortable: true },
      { key: 'paymentMethod', title: 'Method', type: 'text', sortable: true },
      { key: 'receiptNumber', title: 'Receipt #', type: 'text', sortable: true },
      { key: 'status', title: 'Status', type: 'status', sortable: true }
    ];
  }

  private loadLoans() {
    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loans => {
        this.availableLoans = loans;
      });
  }

  private loadPayments() {
    this.loading = true;

    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loans => {
        this.payments = this.generatePaymentRecords(loans);
        this.calculateStats();
        this.filterPayments();
        this.loading = false;
      });
  }

  private generatePaymentRecords(loans: ActiveLoan[]): PaymentRecord[] {
    const records: PaymentRecord[] = [];
    const methods: Array<'cash' | 'bank_transfer' | 'mobile_money' | 'cheque'> = ['cash', 'bank_transfer', 'mobile_money', 'cheque'];
    
    loans.forEach(loan => {
      for (let i = 0; i < loan.paymentsCompleted && i < 5; i++) {
        const paymentDate = new Date(loan.disbursedAt);
        paymentDate.setMonth(paymentDate.getMonth() + i + 1);
        
        records.push({
          id: `PAY-${loan.id}-${i}`,
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          borrowerName: loan.borrowerName,
          borrowerPhone: loan.borrowerPhone,
          paymentDate: paymentDate,
          amount: loan.monthlyPayment,
          paymentMethod: methods[Math.floor(Math.random() * methods.length)],
          receiptNumber: `RCP-${Date.now()}-${i}`,
          status: 'completed',
          receivedBy: 'Staff Member',
          referenceNumber: `REF-${Date.now()}${i}`
        });
      }
    });
    
    return records;
  }

  private calculateStats() {
    const today = new Date().toDateString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    this.paymentStats = {
      today: this.payments
        .filter(p => new Date(p.paymentDate).toDateString() === today && p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
      thisWeek: this.payments
        .filter(p => new Date(p.paymentDate) >= weekAgo && p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
      thisMonth: this.payments
        .filter(p => new Date(p.paymentDate) >= monthAgo && p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
      totalPayments: this.payments.filter(p => p.status === 'completed').length
    };
  }

  filterPayments() {
    let filtered = [...this.payments];

    if (this.selectedStatus) {
      filtered = filtered.filter(p => p.status === this.selectedStatus);
    }

    if (this.selectedMethod) {
      filtered = filtered.filter(p => p.paymentMethod === this.selectedMethod);
    }

    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      filtered = filtered.filter(p => new Date(p.paymentDate) >= fromDate);
    }

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      filtered = filtered.filter(p => new Date(p.paymentDate) <= toDate);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.loanNumber.toLowerCase().includes(term) ||
        p.borrowerName.toLowerCase().includes(term) ||
        p.receiptNumber.toLowerCase().includes(term)
      );
    }

    this.filteredPayments = filtered;
    this.totalPages = Math.ceil(this.filteredPayments.length / this.pageSize);
  }

  recordPayment() {
    this.paymentForm = {
      loanId: '',
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      referenceNumber: '',
      notes: ''
    };
    this.showPaymentModal = true;
  }

  savePayment() {
    if (!this.paymentForm.loanId || !this.paymentForm.amount || !this.paymentForm.paymentMethod) {
      alert('Please fill in all required fields');
      return;
    }

    const loan = this.availableLoans.find(l => l.id === this.paymentForm.loanId);
    if (!loan) return;

    const newPayment: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      loanId: this.paymentForm.loanId,
      loanNumber: loan.loanNumber,
      borrowerName: loan.borrowerName,
      borrowerPhone: loan.borrowerPhone,
      paymentDate: new Date(this.paymentForm.paymentDate),
      amount: this.paymentForm.amount,
      paymentMethod: this.paymentForm.paymentMethod as any,
      receiptNumber: `RCP-${Date.now()}`,
      status: 'completed',
      receivedBy: 'Current User',
      referenceNumber: this.paymentForm.referenceNumber,
      notes: this.paymentForm.notes
    };

    this.payments.unshift(newPayment);
    this.calculateStats();
    this.filterPayments();
    this.closeModal();
    alert('Payment recorded successfully!');
  }

  exportReport() {
    console.log('Export payment report');
    alert('Export functionality will be implemented');
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    const { column, direction } = event;
    
    this.filteredPayments.sort((a, b) => {
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
  viewDetails(payment: PaymentRecord) {
    this.closeDropdown();
    console.log('View details:', payment.id);
    alert(`Payment Details:\nAmount: ${this.formatCurrency(payment.amount)}\nDate: ${new Date(payment.paymentDate).toLocaleDateString()}\nStatus: ${payment.status}`);
  }

  downloadReceipt(payment: PaymentRecord) {
    this.closeDropdown();
    console.log('Download receipt:', payment.id);
    alert(`Downloading receipt ${payment.receiptNumber}...`);
  }

  confirmPayment(payment: PaymentRecord) {
    this.closeDropdown();
    if (confirm(`Confirm payment of ${this.formatCurrency(payment.amount)}?`)) {
      const index = this.payments.findIndex(p => p.id === payment.id);
      if (index !== -1) {
        this.payments[index].status = 'completed';
        this.calculateStats();
        this.filterPayments();
      }
    }
  }

  reversePayment(payment: PaymentRecord) {
    this.closeDropdown();
    const reason = prompt('Please provide reversal reason:');
    if (reason && confirm(`Reverse payment ${payment.receiptNumber}?`)) {
      const index = this.payments.findIndex(p => p.id === payment.id);
      if (index !== -1) {
        this.payments[index].status = 'reversed';
        this.calculateStats();
        this.filterPayments();
      }
    }
  }

  sendReceipt(payment: PaymentRecord) {
    this.closeDropdown();
    console.log('Send receipt:', payment.id);
    alert('Receipt sent to borrower');
  }

  closeModal() {
    this.showPaymentModal = false;
    this.paymentForm = {
      loanId: '',
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      referenceNumber: '',
      notes: ''
    };
  }

  formatCurrency(amount: number): string {
    return this.lenderService.formatCurrency(amount);
  }
}

