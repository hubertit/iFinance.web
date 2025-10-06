import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../shared/components/feather-icon/feather-icon.component';
import { WalletService } from '../../core/services/wallet.service';
import { Subject, takeUntil } from 'rxjs';

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  transaction_at: string;
  created_at: string;
  description: string;
  from_account?: {
    name: string;
    type: string;
  };
  to_account?: {
    name: string;
    type: string;
  };
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent],
  template: `
    <div class="transactions-container">
      <!-- Header -->
      <div class="transactions-header">
        <div class="header-content">
          <h1>Transactions</h1>
          <p class="page-description">View and manage all your financial transactions</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="createTransaction()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            New Transaction
          </button>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="filters-section">
        <div class="search-box">
          <app-feather-icon name="search" size="16px"></app-feather-icon>
          <input 
            type="text" 
            placeholder="Search transactions..." 
            [(ngModel)]="searchTerm"
            (input)="onSearchChange()">
        </div>
        
        <div class="filter-controls">
          <select [(ngModel)]="selectedType" (change)="onFilterChange()">
            <option value="">All Types</option>
            <option value="send">Send</option>
            <option value="receive">Receive</option>
            <option value="loan">Loan</option>
            <option value="savings">Savings</option>
            <option value="payment">Payment</option>
          </select>
          
          <select [(ngModel)]="selectedStatus" (change)="onFilterChange()">
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          
          <select [(ngModel)]="selectedPeriod" (change)="onFilterChange()">
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
            <option value="90D">Last 90 Days</option>
            <option value="1Y">Last Year</option>
          </select>
        </div>
      </div>

      <!-- Transactions List -->
      <div class="transactions-list" *ngIf="!isLoading">
        <div class="transaction-item" 
             *ngFor="let transaction of filteredTransactions"
             (click)="viewTransactionDetails(transaction)">
          <div class="transaction-icon" [class]="transaction.type.toLowerCase()">
            <app-feather-icon [name]="getTransactionIcon(transaction.type)" size="16px"></app-feather-icon>
          </div>
          
          <div class="transaction-details">
            <div class="transaction-title">{{ getTransactionTitle(transaction) }}</div>
            <div class="transaction-meta">
              <span class="transaction-date">{{ formatDate(transaction.transaction_at || transaction.created_at) }}</span>
              <span class="transaction-status" [class]="transaction.status.toLowerCase()">
                {{ transaction.status }}
              </span>
            </div>
          </div>
          
          <div class="transaction-amount" [class]="getTransactionAmountClass(transaction.type)">
            {{ formatCurrency(transaction.amount) }}
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="loading-spinner">
          <app-feather-icon name="loader" size="24px"></app-feather-icon>
        </div>
        <p>Loading transactions...</p>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!isLoading && filteredTransactions.length === 0">
        <app-feather-icon name="send" size="48px"></app-feather-icon>
        <h3>No transactions found</h3>
        <p>No transactions match your current filters</p>
        <button class="btn-primary" (click)="clearFilters()">Clear Filters</button>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="filteredTransactions.length > 0">
        <button class="btn-secondary" [disabled]="currentPage === 1" (click)="previousPage()">
          <app-feather-icon name="chevron-left" size="16px"></app-feather-icon>
          Previous
        </button>
        
        <div class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </div>
        
        <button class="btn-secondary" [disabled]="currentPage === totalPages" (click)="nextPage()">
          Next
          <app-feather-icon name="chevron-right" size="16px"></app-feather-icon>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  isLoading = false;
  
  // Filter properties
  searchTerm = '';
  selectedType = '';
  selectedStatus = '';
  selectedPeriod = '30D';
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  constructor(
    private walletService: WalletService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadTransactions();
    this.listenForWalletChanges();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTransactions() {
    this.isLoading = true;
    
    // Simulate API call with mock data
    setTimeout(() => {
      this.transactions = this.generateMockTransactions();
      this.applyFilters();
      this.isLoading = false;
    }, 1000);
  }

  listenForWalletChanges() {
    this.walletService.currentWallet$
      .pipe(takeUntil(this.destroy$))
      .subscribe(wallet => {
        if (wallet) {
          console.log('Wallet changed, reloading transactions for:', wallet.name);
          this.loadTransactions();
        }
      });
  }

  generateMockTransactions(): Transaction[] {
    const transactionTypes = ['send', 'receive', 'loan', 'savings', 'payment'];
    const statuses = ['completed', 'pending', 'failed'];
    const accounts = ['John Doe', 'Jane Smith', 'Business Account', 'Savings Goal', 'Loan Payment'];
    
    return Array.from({ length: 25 }, (_, i) => ({
      id: `txn_${i + 1}`,
      amount: Math.floor(Math.random() * 500000) + 10000,
      type: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      transaction_at: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
      description: `Transaction ${i + 1} description`,
      from_account: {
        name: accounts[Math.floor(Math.random() * accounts.length)],
        type: 'individual'
      },
      to_account: {
        name: accounts[Math.floor(Math.random() * accounts.length)],
        type: 'individual'
      }
    }));
  }

  applyFilters() {
    let filtered = [...this.transactions];

    // Search filter
    if (this.searchTerm) {
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        transaction.type.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (this.selectedType) {
      filtered = filtered.filter(transaction => 
        transaction.type.toLowerCase() === this.selectedType.toLowerCase()
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(transaction => 
        transaction.status.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    }

    // Period filter
    const days = this.getPeriodDays(this.selectedPeriod);
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    filtered = filtered.filter(transaction => 
      new Date(transaction.transaction_at || transaction.created_at) >= cutoffDate
    );

    this.filteredTransactions = filtered;
    this.updatePagination();
  }

  getPeriodDays(period: string): number {
    switch(period) {
      case '7D': return 7;
      case '30D': return 30;
      case '90D': return 90;
      case '1Y': return 365;
      default: return 30;
    }
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredTransactions = this.filteredTransactions.slice(startIndex, endIndex);
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.selectedPeriod = '30D';
    this.currentPage = 1;
    this.applyFilters();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilters();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFilters();
    }
  }

  createTransaction() {
    console.log('Create new transaction');
    // TODO: Navigate to transaction creation form
  }

  viewTransactionDetails(transaction: Transaction) {
    console.log('View transaction details:', transaction);
    // TODO: Show transaction details modal
  }

  getTransactionIcon(type: string): string {
    switch(type.toLowerCase()) {
      case 'send':
        return 'send';
      case 'receive':
        return 'download';
      case 'loan':
        return 'dollar-sign';
      case 'savings':
        return 'trending-up';
      case 'payment':
        return 'credit-card';
      default:
        return 'send';
    }
  }

  getTransactionTitle(transaction: Transaction): string {
    const type = transaction.type.toLowerCase();
    const account = this.getTransactionAccount(transaction);
    
    switch(type) {
      case 'send':
        return `Sent to ${account}`;
      case 'receive':
        return `Received from ${account}`;
      case 'loan':
        return `Loan payment to ${account}`;
      case 'savings':
        return `Savings deposit`;
      case 'payment':
        return `Payment to ${account}`;
      default:
        return `${transaction.type} ${account}`;
    }
  }

  getTransactionAccount(transaction: Transaction): string {
    if (transaction.to_account) {
      return transaction.to_account.name;
    }
    if (transaction.from_account) {
      return transaction.from_account.name;
    }
    return 'Unknown Account';
  }

  getTransactionAmountClass(type: string): string {
    switch(type.toLowerCase()) {
      case 'send':
      case 'loan':
      case 'payment':
        return 'negative';
      case 'receive':
      case 'savings':
        return 'positive';
      default:
        return 'positive';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-RW', { 
      style: 'currency', 
      currency: 'RWF' 
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }
}
