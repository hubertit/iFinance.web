import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../shared/components/feather-icon/feather-icon.component';
import { WalletService } from '../../core/services/wallet.service';
import { Subject, takeUntil } from 'rxjs';

export interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  term: number;
  status: string;
  type: string;
  applicationDate: string;
  approvalDate?: string;
  dueDate?: string;
  remainingBalance: number;
  monthlyPayment: number;
  description: string;
  lender?: {
    name: string;
    type: string;
  };
}

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent],
  template: `
    <div class="loans-container">
      <!-- Header -->
      <div class="loans-header">
        <div class="header-content">
          <h1>Loans</h1>
          <p class="page-description">Manage your loans and loan applications</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="applyForLoan()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            Apply for Loan
          </button>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="filters-section">
        <div class="search-box">
          <app-feather-icon name="search" size="16px"></app-feather-icon>
          <input 
            type="text" 
            placeholder="Search loans..." 
            [(ngModel)]="searchTerm"
            (input)="onSearchChange()">
        </div>
        
        <div class="filter-controls">
          <select [(ngModel)]="selectedStatus" (change)="onFilterChange()">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
          
          <select [(ngModel)]="selectedType" (change)="onFilterChange()">
            <option value="">All Types</option>
            <option value="personal">Personal</option>
            <option value="business">Business</option>
            <option value="education">Education</option>
            <option value="home">Home</option>
            <option value="vehicle">Vehicle</option>
          </select>
          
          <select [(ngModel)]="selectedPeriod" (change)="onFilterChange()">
            <option value="all">All Time</option>
            <option value="1Y">Last Year</option>
            <option value="2Y">Last 2 Years</option>
            <option value="5Y">Last 5 Years</option>
          </select>
        </div>
      </div>

      <!-- Loans List -->
      <div class="loans-list" *ngIf="!isLoading">
        <div class="loan-item" 
             *ngFor="let loan of filteredLoans"
             (click)="viewLoanDetails(loan)">
          <div class="loan-icon" [class]="loan.status.toLowerCase()">
            <app-feather-icon [name]="getLoanIcon(loan.type)" size="16px"></app-feather-icon>
          </div>
          
          <div class="loan-details">
            <div class="loan-title">{{ getLoanTitle(loan) }}</div>
            <div class="loan-meta">
              <span class="loan-date">{{ formatDate(loan.applicationDate) }}</span>
              <span class="loan-status" [class]="loan.status.toLowerCase()">
                {{ loan.status }}
              </span>
            </div>
            <div class="loan-info">
              <span class="loan-amount">{{ formatCurrency(loan.amount) }}</span>
              <span class="loan-rate">{{ loan.interestRate }}% APR</span>
            </div>
          </div>
          
          <div class="loan-balance" [class]="getLoanBalanceClass(loan.status)">
            <div class="balance-amount">{{ formatCurrency(loan.remainingBalance) }}</div>
            <div class="balance-label">Remaining</div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="loading-spinner">
          <app-feather-icon name="loader" size="24px"></app-feather-icon>
        </div>
        <p>Loading loans...</p>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!isLoading && filteredLoans.length === 0">
        <app-feather-icon name="dollar-sign" size="48px"></app-feather-icon>
        <h3>No loans found</h3>
        <p>No loans match your current filters</p>
        <button class="btn-primary" (click)="clearFilters()">Clear Filters</button>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="filteredLoans.length > 0">
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
  styleUrls: ['./loans.component.scss']
})
export class LoansComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  loans: Loan[] = [];
  filteredLoans: Loan[] = [];
  isLoading = false;
  
  // Filter properties
  searchTerm = '';
  selectedStatus = '';
  selectedType = '';
  selectedPeriod = 'all';
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  constructor(
    private walletService: WalletService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadLoans();
    this.listenForWalletChanges();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLoans() {
    this.isLoading = true;
    
    // Simulate API call with mock data
    setTimeout(() => {
      this.loans = this.generateMockLoans();
      this.applyFilters();
      this.isLoading = false;
    }, 1000);
  }

  listenForWalletChanges() {
    this.walletService.currentWallet$
      .pipe(takeUntil(this.destroy$))
      .subscribe(wallet => {
        if (wallet) {
          console.log('Wallet changed, reloading loans for:', wallet.name);
          this.loadLoans();
        }
      });
  }

  generateMockLoans(): Loan[] {
    const loanTypes = ['personal', 'business', 'education', 'home', 'vehicle'];
    const statuses = ['active', 'pending', 'approved', 'rejected', 'completed'];
    const lenders = ['Bank of Rwanda', 'Commercial Bank', 'Microfinance Institution', 'Credit Union', 'Online Lender'];
    
    return Array.from({ length: 20 }, (_, i) => ({
      id: `loan_${i + 1}`,
      amount: Math.floor(Math.random() * 5000000) + 500000,
      interestRate: Math.floor(Math.random() * 15) + 5,
      term: Math.floor(Math.random() * 60) + 12,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      type: loanTypes[Math.floor(Math.random() * loanTypes.length)],
      applicationDate: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
      approvalDate: Math.random() > 0.3 ? new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000 + 2 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      dueDate: Math.random() > 0.3 ? new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      remainingBalance: Math.floor(Math.random() * 3000000) + 100000,
      monthlyPayment: Math.floor(Math.random() * 100000) + 20000,
      description: `${loanTypes[Math.floor(Math.random() * loanTypes.length)]} loan application`,
      lender: {
        name: lenders[Math.floor(Math.random() * lenders.length)],
        type: 'bank'
      }
    }));
  }

  applyFilters() {
    let filtered = [...this.loans];

    // Search filter
    if (this.searchTerm) {
      filtered = filtered.filter(loan => 
        loan.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        loan.type.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        loan.lender?.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(loan => 
        loan.status.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    }

    // Type filter
    if (this.selectedType) {
      filtered = filtered.filter(loan => 
        loan.type.toLowerCase() === this.selectedType.toLowerCase()
      );
    }

    // Period filter
    if (this.selectedPeriod !== 'all') {
      const years = parseInt(this.selectedPeriod.replace('Y', ''));
      const cutoffDate = new Date(Date.now() - years * 365 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(loan => 
        new Date(loan.applicationDate) >= cutoffDate
      );
    }

    this.filteredLoans = filtered;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredLoans.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredLoans = this.filteredLoans.slice(startIndex, endIndex);
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
    this.selectedStatus = '';
    this.selectedType = '';
    this.selectedPeriod = 'all';
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

  applyForLoan() {
    console.log('Apply for loan');
    // TODO: Navigate to loan application form
  }

  viewLoanDetails(loan: Loan) {
    console.log('View loan details:', loan);
    // TODO: Show loan details modal
  }

  getLoanIcon(type: string): string {
    switch(type.toLowerCase()) {
      case 'personal':
        return 'user';
      case 'business':
        return 'briefcase';
      case 'education':
        return 'book-open';
      case 'home':
        return 'home';
      case 'vehicle':
        return 'truck';
      default:
        return 'dollar-sign';
    }
  }

  getLoanTitle(loan: Loan): string {
    return `${loan.type.charAt(0).toUpperCase() + loan.type.slice(1)} Loan - ${loan.lender?.name || 'Unknown Lender'}`;
  }

  getLoanBalanceClass(status: string): string {
    switch(status.toLowerCase()) {
      case 'active':
        return 'active';
      case 'pending':
        return 'pending';
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      case 'completed':
        return 'completed';
      default:
        return 'neutral';
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
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) {
      return 'Today';
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else if (diffInDays < 30) {
      return `${Math.floor(diffInDays / 7)}w ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }
}
