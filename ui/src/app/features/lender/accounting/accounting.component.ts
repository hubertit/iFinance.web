import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { LenderService, ActiveLoan } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

export interface AccountingEntry {
  id: string;
  entryDate: Date;
  transactionType: 'disbursement' | 'repayment' | 'fee' | 'interest' | 'penalty' | 'adjustment';
  description: string;
  debit: number;
  credit: number;
  balance: number;
  loanId?: string;
  loanNumber?: string;
  referenceNumber: string;
  createdBy?: string;
}

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="accounting">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Accounting</h1>
          <p class="page-description">Financial ledger and accounting entries</p>
        </div>
        <div class="header-actions">
          <div class="period-selector">
            <select [(ngModel)]="selectedPeriod" (change)="updatePeriod()">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month" selected>This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <button class="btn-secondary" (click)="exportLedger()">
            <app-feather-icon name="download" size="16px"></app-feather-icon>
            Export Ledger
          </button>
          <button class="btn-primary" (click)="showAddEntryModal()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            Add Entry
          </button>
        </div>
      </div>

      <!-- Financial Summary -->
      <div class="summary-section" *ngIf="financialSummary">
        <div class="summary-card">
          <div class="summary-label">Total Debits</div>
          <div class="summary-value debit">{{ formatCurrency(financialSummary.totalDebits) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Credits</div>
          <div class="summary-value credit">{{ formatCurrency(financialSummary.totalCredits) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Net Balance</div>
          <div class="summary-value" [class]="financialSummary.netBalance >= 0 ? 'positive' : 'negative'">
            {{ formatCurrency(financialSummary.netBalance) }}
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Entries</div>
          <div class="summary-value">{{ financialSummary.totalEntries }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="typeFilter">Transaction Type</label>
            <select id="typeFilter" [(ngModel)]="selectedType" (change)="filterEntries()">
              <option value="">All Types</option>
              <option value="disbursement">Disbursement</option>
              <option value="repayment">Repayment</option>
              <option value="fee">Fee</option>
              <option value="interest">Interest</option>
              <option value="penalty">Penalty</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="dateFrom">From Date</label>
            <input 
              type="date" 
              id="dateFrom" 
              [(ngModel)]="dateFrom" 
              (change)="filterEntries()"
            />
          </div>

          <div class="filter-group">
            <label for="dateTo">To Date</label>
            <input 
              type="date" 
              id="dateTo" 
              [(ngModel)]="dateTo" 
              (change)="filterEntries()"
            />
          </div>

          <div class="filter-group">
            <label for="searchInput">Search</label>
            <input 
              type="text" 
              id="searchInput" 
              [(ngModel)]="searchTerm" 
              (input)="filterEntries()"
              placeholder="Search by description, reference..."
            />
          </div>
        </div>
      </div>

      <!-- Ledger Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>General Ledger</h3>
            <span class="entry-count">{{ filteredEntries.length }} entries</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredEntries"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="filteredEntries.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-entry>
              <div class="dropdown" [class.show]="openDropdownId === entry.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(entry.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === entry.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewEntry(entry)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View Details
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="editEntry(entry)">
                      <app-feather-icon name="edit" size="14px" class="me-2"></app-feather-icon>
                      Edit
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="deleteEntry(entry)">
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

      <!-- Add Entry Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add Accounting Entry</h3>
            <button class="close-btn" (click)="closeModal()">
              <app-feather-icon name="x" size="20px"></app-feather-icon>
            </button>
          </div>
          
          <div class="modal-content">
            <div class="form-group">
              <label for="entryDate">Entry Date <span class="required">*</span></label>
              <input 
                type="date" 
                id="entryDate" 
                [(ngModel)]="entryForm.entryDate"
              />
            </div>

            <div class="form-group">
              <label for="transactionType">Transaction Type <span class="required">*</span></label>
              <select id="transactionType" [(ngModel)]="entryForm.transactionType">
                <option value="">Select type</option>
                <option value="disbursement">Disbursement</option>
                <option value="repayment">Repayment</option>
                <option value="fee">Fee</option>
                <option value="interest">Interest</option>
                <option value="penalty">Penalty</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>

            <div class="form-group">
              <label for="description">Description <span class="required">*</span></label>
              <input 
                type="text" 
                id="description" 
                [(ngModel)]="entryForm.description"
                placeholder="Enter description"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="debit">Debit (RWF)</label>
                <input 
                  type="number" 
                  id="debit" 
                  [(ngModel)]="entryForm.debit"
                  placeholder="0.00"
                  min="0"
                />
              </div>

              <div class="form-group">
                <label for="credit">Credit (RWF)</label>
                <input 
                  type="number" 
                  id="credit" 
                  [(ngModel)]="entryForm.credit"
                  placeholder="0.00"
                  min="0"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="referenceNumber">Reference Number</label>
              <input 
                type="text" 
                id="referenceNumber" 
                [(ngModel)]="entryForm.referenceNumber"
                placeholder="Enter reference number"
              />
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" (click)="saveEntry()">
              <app-feather-icon name="save" size="16px"></app-feather-icon>
              Save Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./accounting.component.scss']
})
export class AccountingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  entries: AccountingEntry[] = [];
  filteredEntries: AccountingEntry[] = [];
  showModal = false;
  
  // Filters
  selectedPeriod = 'month';
  selectedType = '';
  dateFrom = '';
  dateTo = '';
  searchTerm = '';
  
  // Summary
  financialSummary: {
    totalDebits: number;
    totalCredits: number;
    netBalance: number;
    totalEntries: number;
  } | null = null;
  
  // Form
  entryForm: {
    entryDate: string;
    transactionType: string;
    description: string;
    debit: number;
    credit: number;
    referenceNumber: string;
  } = {
    entryDate: new Date().toISOString().split('T')[0],
    transactionType: '',
    description: '',
    debit: 0,
    credit: 0,
    referenceNumber: ''
  };
  
  // Table
  columns: any[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;
  openDropdownId: string | null = null;

  constructor(private lenderService: LenderService) {}

  ngOnInit() {
    this.initializeColumns();
    this.loadEntries();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeColumns() {
    this.columns = [
      { key: 'entryDate', title: 'Date', type: 'date', sortable: true },
      { key: 'transactionType', title: 'Type', type: 'text', sortable: true },
      { key: 'description', title: 'Description', type: 'text', sortable: true },
      { key: 'referenceNumber', title: 'Reference', type: 'text', sortable: true },
      { key: 'debit', title: 'Debit', type: 'currency', sortable: true },
      { key: 'credit', title: 'Credit', type: 'currency', sortable: true },
      { key: 'balance', title: 'Balance', type: 'currency', sortable: true }
    ];
  }

  private loadEntries() {
    this.loading = true;

    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loans => {
        this.entries = this.generateAccountingEntries(loans);
        this.calculateSummary();
        this.filterEntries();
        this.loading = false;
      });
  }

  private generateAccountingEntries(loans: ActiveLoan[]): AccountingEntry[] {
    const entries: AccountingEntry[] = [];
    let runningBalance = 0;
    
    loans.forEach(loan => {
      // Disbursement entry
      runningBalance += loan.disbursedAmount;
      entries.push({
        id: `ACC-${loan.id}-DISB`,
        entryDate: loan.disbursedAt,
        transactionType: 'disbursement',
        description: `Loan disbursement - ${loan.loanNumber}`,
        debit: loan.disbursedAmount,
        credit: 0,
        balance: runningBalance,
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        referenceNumber: `DISB-${loan.loanNumber}`,
        createdBy: 'System'
      });

      // Repayment entries
      for (let i = 0; i < Math.min(loan.paymentsCompleted, 5); i++) {
        const paymentDate = new Date(loan.disbursedAt);
        paymentDate.setMonth(paymentDate.getMonth() + i + 1);
        
        const principal = loan.monthlyPayment * 0.7;
        const interest = loan.monthlyPayment * 0.3;
        
        runningBalance -= loan.monthlyPayment;
        entries.push({
          id: `ACC-${loan.id}-PAY-${i}`,
          entryDate: paymentDate,
          transactionType: 'repayment',
          description: `Loan repayment - ${loan.loanNumber} - Payment ${i + 1}`,
          debit: 0,
          credit: loan.monthlyPayment,
          balance: runningBalance,
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          referenceNumber: `PAY-${loan.loanNumber}-${i + 1}`,
          createdBy: 'System'
        });

        // Interest entry
        entries.push({
          id: `ACC-${loan.id}-INT-${i}`,
          entryDate: paymentDate,
          transactionType: 'interest',
          description: `Interest income - ${loan.loanNumber}`,
          debit: interest,
          credit: 0,
          balance: runningBalance + interest,
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          referenceNumber: `INT-${loan.loanNumber}-${i + 1}`,
          createdBy: 'System'
        });
      }
    });
    
    return entries.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }

  private calculateSummary() {
    this.financialSummary = {
      totalDebits: this.entries.reduce((sum, e) => sum + e.debit, 0),
      totalCredits: this.entries.reduce((sum, e) => sum + e.credit, 0),
      netBalance: this.entries.reduce((sum, e) => sum + e.debit - e.credit, 0),
      totalEntries: this.entries.length
    };
  }

  filterEntries() {
    let filtered = [...this.entries];

    if (this.selectedType) {
      filtered = filtered.filter(e => e.transactionType === this.selectedType);
    }

    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      filtered = filtered.filter(e => new Date(e.entryDate) >= fromDate);
    }

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      filtered = filtered.filter(e => new Date(e.entryDate) <= toDate);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.description.toLowerCase().includes(term) ||
        e.referenceNumber.toLowerCase().includes(term) ||
        (e.loanNumber && e.loanNumber.toLowerCase().includes(term))
      );
    }

    this.filteredEntries = filtered;
    this.totalPages = Math.ceil(this.filteredEntries.length / this.pageSize);
    this.calculateSummary();
  }

  updatePeriod() {
    const today = new Date();
    let fromDate: Date;
    
    switch (this.selectedPeriod) {
      case 'today':
        fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        break;
      case 'week':
        fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        fromDate = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        fromDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    this.dateFrom = fromDate.toISOString().split('T')[0];
    this.dateTo = today.toISOString().split('T')[0];
    this.filterEntries();
  }

  showAddEntryModal() {
    this.entryForm = {
      entryDate: new Date().toISOString().split('T')[0],
      transactionType: '',
      description: '',
      debit: 0,
      credit: 0,
      referenceNumber: ''
    };
    this.showModal = true;
  }

  saveEntry() {
    if (!this.entryForm.description || !this.entryForm.transactionType) {
      alert('Please fill in all required fields');
      return;
    }

    const lastEntry = this.entries[this.entries.length - 1];
    const newBalance = (lastEntry?.balance || 0) + this.entryForm.debit - this.entryForm.credit;

    const newEntry: AccountingEntry = {
      id: `ACC-${Date.now()}`,
      entryDate: new Date(this.entryForm.entryDate),
      transactionType: this.entryForm.transactionType as any,
      description: this.entryForm.description,
      debit: this.entryForm.debit || 0,
      credit: this.entryForm.credit || 0,
      balance: newBalance,
      referenceNumber: this.entryForm.referenceNumber || `REF-${Date.now()}`,
      createdBy: 'Current User'
    };

    this.entries.unshift(newEntry);
    this.calculateSummary();
    this.filterEntries();
    this.closeModal();
    alert('Accounting entry saved successfully!');
  }

  exportLedger() {
    console.log('Export ledger');
    alert('Export functionality will be implemented');
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    const { column, direction } = event;
    
    this.filteredEntries.sort((a, b) => {
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
  toggleDropdown(entryId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === entryId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = entryId;
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
  viewEntry(entry: AccountingEntry) {
    this.closeDropdown();
    console.log('View entry:', entry.id);
    alert(`Entry Details:\nType: ${entry.transactionType}\nAmount: ${this.formatCurrency(entry.debit || entry.credit)}\nBalance: ${this.formatCurrency(entry.balance)}`);
  }

  editEntry(entry: AccountingEntry) {
    this.closeDropdown();
    this.entryForm = {
      entryDate: new Date(entry.entryDate).toISOString().split('T')[0],
      transactionType: entry.transactionType,
      description: entry.description,
      debit: entry.debit,
      credit: entry.credit,
      referenceNumber: entry.referenceNumber
    };
    this.showModal = true;
  }

  deleteEntry(entry: AccountingEntry) {
    this.closeDropdown();
    if (confirm(`Delete accounting entry ${entry.referenceNumber}?`)) {
      this.entries = this.entries.filter(e => e.id !== entry.id);
      this.calculateSummary();
      this.filterEntries();
    }
  }

  closeModal() {
    this.showModal = false;
    this.entryForm = {
      entryDate: new Date().toISOString().split('T')[0],
      transactionType: '',
      description: '',
      debit: 0,
      credit: 0,
      referenceNumber: ''
    };
  }

  formatCurrency(amount: number): string {
    return this.lenderService.formatCurrency(amount);
  }
}

