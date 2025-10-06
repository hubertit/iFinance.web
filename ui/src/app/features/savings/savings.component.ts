import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../shared/components/feather-icon/feather-icon.component';
import { WalletService } from '../../core/services/wallet.service';
import { Subject, takeUntil } from 'rxjs';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  status: string;
  type: string;
  createdDate: string;
  lastContribution?: string;
  monthlyContribution: number;
  description: string;
  category?: {
    name: string;
    color: string;
  };
}

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent],
  template: `
    <div class="savings-container">
      <!-- Header -->
      <div class="savings-header">
        <div class="header-content">
          <h1>Savings</h1>
          <p class="page-description">Manage your savings goals and track your progress</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="createSavingsGoal()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            New Goal
          </button>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="filters-section">
        <div class="search-box">
          <app-feather-icon name="search" size="16px"></app-feather-icon>
          <input 
            type="text" 
            placeholder="Search savings goals..." 
            [(ngModel)]="searchTerm"
            (input)="onSearchChange()">
        </div>
        
        <div class="filter-controls">
          <select [(ngModel)]="selectedStatus" (change)="onFilterChange()">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select [(ngModel)]="selectedType" (change)="onFilterChange()">
            <option value="">All Types</option>
            <option value="emergency">Emergency Fund</option>
            <option value="vacation">Vacation</option>
            <option value="education">Education</option>
            <option value="home">Home Purchase</option>
            <option value="vehicle">Vehicle</option>
            <option value="retirement">Retirement</option>
            <option value="wedding">Wedding</option>
            <option value="other">Other</option>
          </select>
          
          <select [(ngModel)]="selectedPeriod" (change)="onFilterChange()">
            <option value="all">All Time</option>
            <option value="1Y">Last Year</option>
            <option value="2Y">Last 2 Years</option>
            <option value="5Y">Last 5 Years</option>
          </select>
        </div>
      </div>

      <!-- Savings Goals List -->
      <div class="savings-list" *ngIf="!isLoading">
        <div class="savings-item" 
             *ngFor="let goal of filteredGoals"
             (click)="viewSavingsDetails(goal)">
          <div class="savings-icon" [class]="goal.status.toLowerCase()">
            <app-feather-icon [name]="getSavingsIcon(goal.type)" size="16px"></app-feather-icon>
          </div>
          
          <div class="savings-details">
            <div class="savings-title">{{ goal.name }}</div>
            <div class="savings-meta">
              <span class="savings-date">{{ formatDate(goal.createdDate) }}</span>
              <span class="savings-status" [class]="goal.status.toLowerCase()">
                {{ goal.status }}
              </span>
            </div>
            <div class="savings-info">
              <span class="savings-type">{{ goal.type }}</span>
              <span class="savings-contribution">{{ formatCurrency(goal.monthlyContribution) }}/month</span>
            </div>
          </div>
          
          <div class="savings-progress">
            <div class="progress-bar">
              <div class="progress-fill" 
                   [style.width.%]="getProgressPercentage(goal)"
                   [class]="getProgressClass(goal.status)">
              </div>
            </div>
            <div class="progress-text">
              <span class="current-amount">{{ formatCurrency(goal.currentAmount) }}</span>
              <span class="target-amount">of {{ formatCurrency(goal.targetAmount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="loading-spinner">
          <app-feather-icon name="loader" size="24px"></app-feather-icon>
        </div>
        <p>Loading savings goals...</p>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!isLoading && filteredGoals.length === 0">
        <app-feather-icon name="trending-up" size="48px"></app-feather-icon>
        <h3>No savings goals found</h3>
        <p>No savings goals match your current filters</p>
        <button class="btn-primary" (click)="clearFilters()">Clear Filters</button>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="filteredGoals.length > 0">
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
  styleUrls: ['./savings.component.scss']
})
export class SavingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  savingsGoals: SavingsGoal[] = [];
  filteredGoals: SavingsGoal[] = [];
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
    this.loadSavingsGoals();
    this.listenForWalletChanges();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSavingsGoals() {
    this.isLoading = true;
    
    // Simulate API call with mock data
    setTimeout(() => {
      this.savingsGoals = this.generateMockSavingsGoals();
      this.applyFilters();
      this.isLoading = false;
    }, 1000);
  }

  listenForWalletChanges() {
    this.walletService.currentWallet$
      .pipe(takeUntil(this.destroy$))
      .subscribe(wallet => {
        if (wallet) {
          console.log('Wallet changed, reloading savings goals for:', wallet.name);
          this.loadSavingsGoals();
        }
      });
  }

  generateMockSavingsGoals(): SavingsGoal[] {
    const goalTypes = ['emergency', 'vacation', 'education', 'home', 'vehicle', 'retirement', 'wedding', 'other'];
    const statuses = ['active', 'completed', 'paused', 'cancelled'];
    const categories = [
      { name: 'Emergency Fund', color: '#e74c3c' },
      { name: 'Vacation', color: '#3498db' },
      { name: 'Education', color: '#9b59b6' },
      { name: 'Home Purchase', color: '#f39c12' },
      { name: 'Vehicle', color: '#1abc9c' },
      { name: 'Retirement', color: '#34495e' },
      { name: 'Wedding', color: '#e91e63' },
      { name: 'Other', color: '#607d8b' }
    ];
    
    return Array.from({ length: 15 }, (_, i) => {
      const type = goalTypes[Math.floor(Math.random() * goalTypes.length)];
      const targetAmount = Math.floor(Math.random() * 10000000) + 500000;
      const currentAmount = Math.floor(Math.random() * targetAmount);
      const monthlyContribution = Math.floor(Math.random() * 100000) + 10000;
      
      return {
        id: `goal_${i + 1}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Savings Goal ${i + 1}`,
        targetAmount,
        currentAmount,
        targetDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        type,
        createdDate: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastContribution: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString() : undefined,
        monthlyContribution,
        description: `${type} savings goal for future planning`,
        category: categories[Math.floor(Math.random() * categories.length)]
      };
    });
  }

  applyFilters() {
    let filtered = [...this.savingsGoals];

    // Search filter
    if (this.searchTerm) {
      filtered = filtered.filter(goal => 
        goal.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        goal.type.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        goal.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(goal => 
        goal.status.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    }

    // Type filter
    if (this.selectedType) {
      filtered = filtered.filter(goal => 
        goal.type.toLowerCase() === this.selectedType.toLowerCase()
      );
    }

    // Period filter
    if (this.selectedPeriod !== 'all') {
      const years = parseInt(this.selectedPeriod.replace('Y', ''));
      const cutoffDate = new Date(Date.now() - years * 365 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(goal => 
        new Date(goal.createdDate) >= cutoffDate
      );
    }

    this.filteredGoals = filtered;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredGoals.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredGoals = this.filteredGoals.slice(startIndex, endIndex);
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

  createSavingsGoal() {
    console.log('Create new savings goal');
    // TODO: Navigate to savings goal creation form
  }

  viewSavingsDetails(goal: SavingsGoal) {
    console.log('View savings goal details:', goal);
    // TODO: Show savings goal details modal
  }

  getSavingsIcon(type: string): string {
    switch(type.toLowerCase()) {
      case 'emergency':
        return 'shield';
      case 'vacation':
        return 'map-pin';
      case 'education':
        return 'book-open';
      case 'home':
        return 'home';
      case 'vehicle':
        return 'truck';
      case 'retirement':
        return 'clock';
      case 'wedding':
        return 'heart';
      case 'other':
        return 'target';
      default:
        return 'trending-up';
    }
  }

  getProgressPercentage(goal: SavingsGoal): number {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  }

  getProgressClass(status: string): string {
    switch(status.toLowerCase()) {
      case 'active':
        return 'active';
      case 'completed':
        return 'completed';
      case 'paused':
        return 'paused';
      case 'cancelled':
        return 'cancelled';
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
