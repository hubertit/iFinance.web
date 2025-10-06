import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatherIconComponent } from '../../shared/components/feather-icon/feather-icon.component';

@Component({
  selector: 'app-ikofi',
  standalone: true,
  imports: [CommonModule, FeatherIconComponent],
  template: `
    <div class="ikofi-container">
      <!-- Header -->
      <div class="ikofi-header">
        <div class="header-content">
          <h1>Ikofi</h1>
          <p class="page-description">Manage your financial services and transactions</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="createWallet()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            <span>Create Wallet</span>
          </button>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <div class="actions-grid">
          <button class="action-btn" (click)="quickAction('pay')">
            <div class="action-icon">
              <app-feather-icon name="credit-card" size="20px"></app-feather-icon>
            </div>
            <span class="action-label">Pay</span>
          </button>
          <button class="action-btn" (click)="quickAction('request')">
            <div class="action-icon">
              <app-feather-icon name="user-plus" size="20px"></app-feather-icon>
            </div>
            <span class="action-label">Request</span>
          </button>
          <button class="action-btn" (click)="quickAction('top-up')">
            <div class="action-icon">
              <app-feather-icon name="trending-up" size="20px"></app-feather-icon>
            </div>
            <span class="action-label">Top Up</span>
          </button>
          <button class="action-btn" (click)="quickAction('withdraw')">
            <div class="action-icon">
              <app-feather-icon name="trending-down" size="20px"></app-feather-icon>
            </div>
            <span class="action-label">Withdraw</span>
          </button>
        </div>
      </div>

      <!-- Financial Services Grid -->
      <div class="services-grid">
        <div class="service-card" (click)="navigateToService('savings')">
          <div class="service-icon">
            <app-feather-icon name="save" size="24px"></app-feather-icon>
          </div>
          <div class="service-content">
            <h3>Savings</h3>
            <p>Manage your savings accounts and track your progress</p>
            <div class="service-stats">
              <span class="stat-value">{{ formatCurrency(savingsBalance) }}</span>
              <span class="stat-label">Total Balance</span>
            </div>
          </div>
        </div>

        <div class="service-card" (click)="navigateToService('loans')">
          <div class="service-icon">
            <app-feather-icon name="dollar-sign" size="24px"></app-feather-icon>
          </div>
          <div class="service-content">
            <h3>Loans</h3>
            <p>Apply for loans and manage your existing loans</p>
            <div class="service-stats">
              <span class="stat-value">{{ formatCurrency(loanBalance) }}</span>
              <span class="stat-label">Outstanding</span>
            </div>
          </div>
        </div>

        <div class="service-card" (click)="navigateToService('insurance')">
          <div class="service-icon">
            <app-feather-icon name="shield" size="24px"></app-feather-icon>
          </div>
          <div class="service-content">
            <h3>Insurance</h3>
            <p>Protect your assets with comprehensive insurance</p>
            <div class="service-stats">
              <span class="stat-value">{{ activePolicies }}</span>
              <span class="stat-label">Active Policies</span>
            </div>
          </div>
        </div>

        <div class="service-card" (click)="navigateToService('payments')">
          <div class="service-icon">
            <app-feather-icon name="smartphone" size="24px"></app-feather-icon>
          </div>
          <div class="service-content">
            <h3>Payments</h3>
            <p>Make payments and manage your transactions</p>
            <div class="service-stats">
              <span class="stat-value">{{ formatCurrency(monthlyPayments) }}</span>
              <span class="stat-label">This Month</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="recent-transactions">
        <div class="section-header">
          <h3>Recent Transactions</h3>
          <button class="view-all-btn">View All</button>
        </div>
        <div class="transactions-list">
          <div class="transaction-item" *ngFor="let transaction of recentTransactions">
            <div class="transaction-icon">
              <app-feather-icon [name]="transaction.icon" size="16px"></app-feather-icon>
            </div>
            <div class="transaction-details">
              <div class="transaction-title">{{ transaction.title }}</div>
              <div class="transaction-date">{{ transaction.date }}</div>
            </div>
            <div class="transaction-amount" [class.positive]="transaction.amount > 0" [class.negative]="transaction.amount < 0">
              {{ formatCurrency(transaction.amount) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./ikofi.component.scss']
})
export class IkofiComponent implements OnInit {
  savingsBalance = 2500000;
  loanBalance = 1500000;
  activePolicies = 3;
  monthlyPayments = 450000;

  recentTransactions = [
    {
      title: 'Mobile Money Transfer',
      date: '2 hours ago',
      amount: -50000,
      icon: 'smartphone'
    },
    {
      title: 'Savings Deposit',
      date: '1 day ago',
      amount: 100000,
      icon: 'save'
    },
    {
      title: 'Loan Payment',
      date: '2 days ago',
      amount: -75000,
      icon: 'dollar-sign'
    },
    {
      title: 'Insurance Premium',
      date: '3 days ago',
      amount: -25000,
      icon: 'shield'
    }
  ];

  ngOnInit(): void {
    // Load financial data
    this.loadFinancialData();
  }

  createWallet() {
    console.log('Create wallet clicked');
    // TODO: Implement wallet creation logic
    // This could open a modal or navigate to a wallet creation form
    alert('Wallet creation feature coming soon!');
  }

  quickAction(action: string) {
    console.log('Quick action triggered:', action);
    // TODO: Implement quick action logic
    switch(action) {
      case 'pay':
        // Navigate to payment form
        break;
      case 'request':
        // Navigate to request money form
        break;
      case 'top-up':
        // Navigate to top up form
        break;
      case 'withdraw':
        // Navigate to withdrawal form
        break;
    }
  }

  navigateToService(service: string) {
    console.log('Navigate to service:', service);
    // TODO: Implement navigation to specific service
  }

  loadFinancialData() {
    // TODO: Load real financial data from API
    console.log('Loading financial data...');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-RW', { 
      style: 'currency', 
      currency: 'RWF' 
    }).format(amount);
  }
}
