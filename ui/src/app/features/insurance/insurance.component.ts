import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../shared/components/feather-icon/feather-icon.component';
import { WalletService } from '../../core/services/wallet.service';
import { Subject, takeUntil } from 'rxjs';

export interface InsurancePolicy {
  id: string;
  policyNumber: string;
  type: string;
  provider: string;
  status: string;
  premium: number;
  coverage: number;
  startDate: string;
  endDate: string;
  nextPaymentDate: string;
  paymentFrequency: string;
  description: string;
  beneficiary?: {
    name: string;
    relationship: string;
  };
  claims?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

@Component({
  selector: 'app-insurance',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent],
  template: `
    <div class="insurance-container">
      <!-- Header -->
      <div class="insurance-header">
        <div class="header-content">
          <h1>Insurance</h1>
          <p class="page-description">Manage your insurance policies and claims</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="buyInsurance()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            Buy Insurance
          </button>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="filters-section">
        <div class="search-box">
          <app-feather-icon name="search" size="16px"></app-feather-icon>
          <input 
            type="text" 
            placeholder="Search insurance policies..." 
            [(ngModel)]="searchTerm"
            (input)="onSearchChange()">
        </div>
        
        <div class="filter-controls">
          <select [(ngModel)]="selectedStatus" (change)="onFilterChange()">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
          
          <select [(ngModel)]="selectedType" (change)="onFilterChange()">
            <option value="">All Types</option>
            <option value="life">Life Insurance</option>
            <option value="health">Health Insurance</option>
            <option value="auto">Auto Insurance</option>
            <option value="home">Home Insurance</option>
            <option value="travel">Travel Insurance</option>
            <option value="business">Business Insurance</option>
          </select>
          
          <select [(ngModel)]="selectedProvider" (change)="onFilterChange()">
            <option value="">All Providers</option>
            <option value="Rwanda Insurance">Rwanda Insurance</option>
            <option value="SORAS">SORAS</option>
            <option value="UAP">UAP</option>
            <option value="Sanlam">Sanlam</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <!-- Insurance Policies List -->
      <div class="insurance-list" *ngIf="!isLoading">
        <div class="policy-item" 
             *ngFor="let policy of filteredPolicies"
             (click)="viewPolicyDetails(policy)">
          <div class="policy-icon" [class]="policy.status.toLowerCase()">
            <app-feather-icon [name]="getPolicyIcon(policy.type)" size="16px"></app-feather-icon>
          </div>
          
          <div class="policy-details">
            <div class="policy-title">{{ getPolicyTitle(policy) }}</div>
            <div class="policy-meta">
              <span class="policy-number">Policy #{{ policy.policyNumber }}</span>
              <span class="policy-status" [class]="policy.status.toLowerCase()">
                {{ policy.status }}
              </span>
            </div>
            <div class="policy-info">
              <span class="policy-provider">{{ policy.provider }}</span>
              <span class="policy-coverage">{{ formatCurrency(policy.coverage) }} coverage</span>
            </div>
          </div>
          
          <div class="policy-premium">
            <div class="premium-amount">{{ formatCurrency(policy.premium) }}</div>
            <div class="premium-frequency">{{ policy.paymentFrequency }}</div>
            <div class="next-payment" *ngIf="policy.status === 'active'">
              Next: {{ formatDate(policy.nextPaymentDate) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="loading-spinner">
          <app-feather-icon name="loader" size="24px"></app-feather-icon>
        </div>
        <p>Loading insurance policies...</p>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!isLoading && filteredPolicies.length === 0">
        <app-feather-icon name="shield" size="48px"></app-feather-icon>
        <h3>No insurance policies found</h3>
        <p>No insurance policies match your current filters</p>
        <button class="btn-primary" (click)="clearFilters()">Clear Filters</button>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="filteredPolicies.length > 0">
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
  styleUrls: ['./insurance.component.scss']
})
export class InsuranceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  policies: InsurancePolicy[] = [];
  filteredPolicies: InsurancePolicy[] = [];
  isLoading = false;
  
  // Filter properties
  searchTerm = '';
  selectedStatus = '';
  selectedType = '';
  selectedProvider = '';
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  constructor(
    private walletService: WalletService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadInsurancePolicies();
    this.listenForWalletChanges();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInsurancePolicies() {
    this.isLoading = true;
    
    // Simulate API call with mock data
    setTimeout(() => {
      this.policies = this.generateMockInsurancePolicies();
      this.applyFilters();
      this.isLoading = false;
    }, 1000);
  }

  listenForWalletChanges() {
    this.walletService.currentWallet$
      .pipe(takeUntil(this.destroy$))
      .subscribe(wallet => {
        if (wallet) {
          console.log('Wallet changed, reloading insurance policies for:', wallet.name);
          this.loadInsurancePolicies();
        }
      });
  }

  generateMockInsurancePolicies(): InsurancePolicy[] {
    const policyTypes = ['life', 'health', 'auto', 'home', 'travel', 'business'];
    const statuses = ['active', 'expired', 'cancelled', 'pending'];
    const providers = ['Rwanda Insurance', 'SORAS', 'UAP', 'Sanlam', 'Other'];
    const frequencies = ['Monthly', 'Quarterly', 'Annually'];
    
    return Array.from({ length: 12 }, (_, i) => {
      const type = policyTypes[Math.floor(Math.random() * policyTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const coverage = Math.floor(Math.random() * 50000000) + 1000000;
      const premium = Math.floor(coverage * 0.01 * (Math.random() * 0.5 + 0.5));
      
      return {
        id: `policy_${i + 1}`,
        policyNumber: `POL-${String(i + 1).padStart(6, '0')}`,
        type,
        provider: providers[Math.floor(Math.random() * providers.length)],
        status,
        premium,
        coverage,
        startDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + (i + 1) * 365 * 24 * 60 * 60 * 1000).toISOString(),
        nextPaymentDate: status === 'active' ? new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString() : '',
        paymentFrequency: frequencies[Math.floor(Math.random() * frequencies.length)],
        description: `${type} insurance policy for comprehensive coverage`,
        beneficiary: Math.random() > 0.5 ? {
          name: 'Family Member',
          relationship: 'Spouse'
        } : undefined,
        claims: Math.random() > 0.3 ? {
          total: Math.floor(Math.random() * 5),
          pending: Math.floor(Math.random() * 2),
          approved: Math.floor(Math.random() * 3),
          rejected: Math.floor(Math.random() * 2)
        } : undefined
      };
    });
  }

  applyFilters() {
    let filtered = [...this.policies];

    // Search filter
    if (this.searchTerm) {
      filtered = filtered.filter(policy => 
        policy.policyNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        policy.type.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        policy.provider.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        policy.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(policy => 
        policy.status.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    }

    // Type filter
    if (this.selectedType) {
      filtered = filtered.filter(policy => 
        policy.type.toLowerCase() === this.selectedType.toLowerCase()
      );
    }

    // Provider filter
    if (this.selectedProvider) {
      filtered = filtered.filter(policy => 
        policy.provider === this.selectedProvider
      );
    }

    this.filteredPolicies = filtered;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredPolicies.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredPolicies = this.filteredPolicies.slice(startIndex, endIndex);
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
    this.selectedProvider = '';
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

  buyInsurance() {
    console.log('Buy insurance');
    // TODO: Navigate to insurance purchase form
  }

  viewPolicyDetails(policy: InsurancePolicy) {
    console.log('View policy details:', policy);
    // TODO: Show policy details modal
  }

  getPolicyIcon(type: string): string {
    switch(type.toLowerCase()) {
      case 'life':
        return 'heart';
      case 'health':
        return 'activity';
      case 'auto':
        return 'truck';
      case 'home':
        return 'home';
      case 'travel':
        return 'map-pin';
      case 'business':
        return 'briefcase';
      default:
        return 'shield';
    }
  }

  getPolicyTitle(policy: InsurancePolicy): string {
    return `${policy.type.charAt(0).toUpperCase() + policy.type.slice(1)} Insurance - ${policy.provider}`;
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
