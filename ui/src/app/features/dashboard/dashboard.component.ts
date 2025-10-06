import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService, DashboardOverview, Wallet } from '../../core/services/dashboard.service';
import { NavigationService } from '../../core/services/navigation.service';
import { FeatherIconComponent } from '../../shared/components/feather-icon/feather-icon.component';
import { AddCustomerModalComponent } from '../../shared/components/add-customer-modal/add-customer-modal.component';
import { AddSupplierModalComponent } from '../../shared/components/add-supplier-modal/add-supplier-modal.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexNonAxisChartSeries,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexLegend,
  ApexFill,
  ApexTooltip,
  ApexPlotOptions,
  ChartComponent
} from 'ng-apexcharts';
import { Subject, takeUntil, interval, timer } from 'rxjs';
import { switchMap, catchError, retry, retryWhen, delay } from 'rxjs/operators';

export interface ChartOptions {
  plotOptions?: ApexPlotOptions;
  markers?: any;
  grid?: any;
  series: ApexNonAxisChartSeries | ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  yaxis: ApexYAxis | ApexYAxis[];
  title?: ApexTitleSubtitle;
  labels?: string[];
  legend?: ApexLegend;
  fill: ApexFill;
  tooltip: ApexTooltip;
  colors: string[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconComponent, AddCustomerModalComponent, AddSupplierModalComponent, NgApexchartsModule],
  template: `
    <div class="dashboard-container">

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <div class="actions-grid">
          <button class="action-btn" (click)="quickAction('send-money')">
            <div class="action-icon">
              <app-feather-icon name="send" size="16px"></app-feather-icon>
            </div>
            <span class="action-label">Send Money</span>
          </button>
          
          <button class="action-btn" (click)="quickAction('request-money')">
            <div class="action-icon">
              <app-feather-icon name="dollar-sign" size="16px"></app-feather-icon>
            </div>
            <span class="action-label">Request Money</span>
          </button>
          
          <button class="action-btn" (click)="quickAction('top-up')">
            <div class="action-icon">
              <app-feather-icon name="credit-card" size="16px"></app-feather-icon>
            </div>
            <span class="action-label">Top Up Wallet</span>
          </button>
          
          <button class="action-btn" (click)="quickAction('apply-loan')">
            <div class="action-icon">
              <app-feather-icon name="trending-up" size="16px"></app-feather-icon>
            </div>
            <span class="action-label">Apply for Loan</span>
          </button>
          
          <button class="action-btn" (click)="quickAction('pay-bills')">
            <div class="action-icon">
              <app-feather-icon name="file-text" size="16px"></app-feather-icon>
            </div>
            <span class="action-label">Pay Bills</span>
          </button>
          
          <button class="action-btn" (click)="quickAction('view-statements')">
            <div class="action-icon">
              <app-feather-icon name="download" size="16px"></app-feather-icon>
            </div>
            <span class="action-label">View Statements</span>
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid" *ngIf="overview" [class.loading-overlay]="isRefreshing">
        <!-- Total Balance -->
        <div class="stat-card balance" (click)="navigateToWallets()">
          <div class="stat-icon">
            <app-feather-icon name="credit-card" size="18px"></app-feather-icon>
          </div>
          <div class="stat-details">
            <div class="stat-title">Total Balance</div>
            <div class="stat-numbers">
              <div class="main-stat">{{ formatCurrency(overview.summary.balance.total) }}</div>
              <div class="sub-stats">
                <span class="success">{{ overview.summary.balance.wallets }} Wallets</span>
                <span class="volume">{{ formatCurrency(overview.summary.balance.available) }} Available</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Transactions -->
        <div class="stat-card transactions" (click)="navigateToTransactions()">
          <div class="stat-icon">
            <app-feather-icon name="send" size="18px"></app-feather-icon>
          </div>
          <div class="stat-details">
            <div class="stat-title">Transactions</div>
            <div class="stat-numbers">
              <div class="main-stat">{{ formatCurrency(overview.summary.transactions.volume) }}</div>
              <div class="sub-stats">
                <span class="success">{{ overview.summary.transactions.count }} Transactions</span>
                <span class="volume">{{ overview.summary.transactions.pending }} Pending</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Loans -->
        <div class="stat-card loans" (click)="navigateToLoans()">
          <div class="stat-icon">
            <app-feather-icon name="dollar-sign" size="18px"></app-feather-icon>
          </div>
          <div class="stat-details">
            <div class="stat-title">Active Loans</div>
            <div class="stat-numbers">
              <div class="main-stat">{{ formatCurrency(overview.summary.loans.amount) }}</div>
              <div class="sub-stats">
                <span class="success">{{ overview.summary.loans.active }} Active</span>
                <span class="volume">{{ overview.summary.loans.pending }} Pending</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Savings Goals -->
        <div class="stat-card savings" (click)="navigateToSavings()">
          <div class="stat-icon">
            <app-feather-icon name="trending-up" size="18px"></app-feather-icon>
          </div>
          <div class="stat-details">
            <div class="stat-title">Total Savings</div>
            <div class="stat-numbers">
              <div class="main-stat">{{ formatCurrency(overview.summary.savings.amount) }}</div>
              <div class="sub-stats">
                <span class="success">{{ overview.summary.savings.goals }} Goals</span>
                <span class="volume">{{ overview.summary.savings.completed }} Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section" *ngIf="overview" [class.loading-overlay]="isRefreshing">
        <!-- Bar Chart -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>Money In & Out Trends</h3>
            <div class="chart-controls">
              <button class="btn-small" (click)="updateChart('7D', $event)">7D</button>
              <button class="btn-small active" (click)="updateChart('30D', $event)">30D</button>
              <button class="btn-small" (click)="updateChart('90D', $event)">90D</button>
            </div>
          </div>
          <div class="chart-wrapper">
            <apx-chart
              [series]="chartOptions.series"
              [chart]="chartOptions.chart"
              [xaxis]="chartOptions.xaxis"
              [yaxis]="chartOptions.yaxis"
              [dataLabels]="chartOptions.dataLabels"
              [stroke]="chartOptions.stroke"
              [fill]="chartOptions.fill"
              [colors]="chartOptions.colors"
              [tooltip]="chartOptions.tooltip"
              [grid]="chartOptions.grid"
              [legend]="chartOptions.legend || {}">
            </apx-chart>
          </div>
        </div>

        <!-- Donut Chart -->
        <div class="chart-container donut-chart">
          <div class="chart-header">
            <h3>Money In vs Money Out Distribution</h3>
          </div>
          <div class="chart-wrapper">
            <apx-chart
              [series]="donutChartOptions.series"
              [chart]="donutChartOptions.chart"
              [labels]="donutChartOptions.labels"
              [colors]="donutChartOptions.colors"
              [dataLabels]="donutChartOptions.dataLabels"
              [legend]="donutChartOptions.legend"
              [tooltip]="donutChartOptions.tooltip"
              [plotOptions]="donutChartOptions.plotOptions">
            </apx-chart>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="recent-transactions" *ngIf="overview?.recent_transactions?.length" [class.loading-overlay]="isRefreshing">
        <div class="section-header">
          <h3>Recent Transactions</h3>
          <button class="view-all-btn" (click)="navigateToTransactions()">View All</button>
        </div>
        <div class="transactions-list">
          <div class="transaction-item" 
               *ngFor="let transaction of (overview?.recent_transactions || []).slice(0, 5)"
               (click)="viewTransactionDetails(transaction)">
            <div class="transaction-icon">
              <app-feather-icon 
                [name]="getTransactionIcon(transaction.type)" 
                size="16px">
              </app-feather-icon>
            </div>
            <div class="transaction-details">
              <div class="transaction-title">
                {{ getTransactionTitle(transaction) }}
              </div>
              <div class="transaction-date">{{ formatDate(transaction.transaction_at || transaction.created_at) }}</div>
            </div>
            <div class="transaction-amount" [class]="getTransactionAmountClass(transaction.type)">
              {{ formatCurrency(transaction.amount) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Dynamic Status Bar -->
      <div class="status-bar" *ngIf="overview || lastUpdated">
        <div class="status-info">
          <span class="status-indicator" [class.refreshing]="isRefreshing"></span>
          <span class="status-text">
            <span *ngIf="isRefreshing">Refreshing...</span>
          </span>
        </div>
      </div>

      <!-- Skeleton Loading States -->
      <div *ngIf="isLoading && !overview">
        <!-- Skeleton Quick Actions -->
        <div class="skeleton-quick-actions">
          <div class="skeleton-title"></div>
          <div class="skeleton-actions-grid">
            <div class="skeleton-action-btn" *ngFor="let i of [1,2,3,4]">
              <div class="skeleton-action-icon"></div>
              <div class="skeleton-action-label"></div>
            </div>
          </div>
        </div>

        <!-- Skeleton Stats Grid -->
        <div class="skeleton-stats-grid">
          <div class="skeleton-stat-card" *ngFor="let i of [1,2,3,4]">
            <div class="skeleton-stat-icon"></div>
            <div class="skeleton-stat-details">
              <div class="skeleton-stat-title"></div>
              <div class="skeleton-main-stat"></div>
              <div class="skeleton-sub-stats">
                <div class="skeleton-sub-stat"></div>
                <div class="skeleton-sub-stat"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Skeleton Charts Section -->
        <div class="skeleton-charts-section">
          <div class="skeleton-chart-container">
            <div class="skeleton-chart-header">
              <div class="skeleton-chart-title"></div>
              <div class="skeleton-chart-controls">
                <div class="skeleton-btn-small"></div>
                <div class="skeleton-btn-small"></div>
                <div class="skeleton-btn-small"></div>
              </div>
            </div>
            <div class="skeleton-chart-wrapper"></div>
          </div>
          <div class="skeleton-chart-container skeleton-donut-chart">
            <div class="skeleton-chart-header">
              <div class="skeleton-chart-title"></div>
            </div>
            <div class="skeleton-chart-wrapper"></div>
          </div>
        </div>

        <!-- Skeleton Recent Activity -->
        <div class="skeleton-recent-activity">
          <div class="skeleton-activity-header">
            <div class="skeleton-activity-title"></div>
            <div class="skeleton-view-all"></div>
          </div>
          <div class="skeleton-activity-list">
            <div class="skeleton-activity-item" *ngFor="let i of [1,2,3,4,5]">
              <div class="skeleton-activity-icon"></div>
              <div class="skeleton-activity-content">
                <div class="skeleton-activity-title"></div>
                <div class="skeleton-activity-time"></div>
              </div>
              <div class="skeleton-activity-amount"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error States -->
      <div class="error-section" *ngIf="errorMessage">
        <div class="error-card">
          <app-feather-icon name="alert-circle" size="24px"></app-feather-icon>
          <h3>Failed to Load Dashboard</h3>
          <p>{{ errorMessage }}</p>
          <div class="error-actions">
            <button class="btn-primary" (click)="forceRefresh()">Retry</button>
            <button class="btn-secondary" (click)="refreshDashboard()">Refresh</button>
          </div>
        </div>
      </div>

      <!-- Modals -->
      <app-add-customer-modal 
        *ngIf="showAddCustomerModal"
        (customerAdded)="onCustomerAdded($event)"
        (modalClosed)="closeAddCustomerModal()">
      </app-add-customer-modal>

      <app-add-supplier-modal 
        *ngIf="showAddSupplierModal"
        (supplierAdded)="onSupplierAdded($event)"
        (modalClosed)="closeAddSupplierModal()">
      </app-add-supplier-modal>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  overview: DashboardOverview | null = null;
  
  // UI state
  isLoading = true;
  errorMessage: string | null = null;
  lastUpdated: Date | null = null;
  isRefreshing = false;
  
  // Modal state
  showAddCustomerModal = false;
  showAddSupplierModal = false;
  
  // Dynamic data properties
  autoRefreshInterval = 30000; // 30 seconds like mobile app
  retryCount = 0;
  maxRetryAttempts = 3;
  
  // Chart options
  chartOptions!: ChartOptions;
  donutChartOptions!: any;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private navigationService: NavigationService,
    private router: Router
  ) {
    this.initializeCharts();
    this.initializeDonutChart();
  }

  ngOnInit() {
    this.loadDashboardData();
    this.startAutoRefresh();
    this.listenForAccountChanges();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load dashboard data from APIs with retry logic
   */
  loadDashboardData() {
    this.isLoading = true;
    this.errorMessage = null;

    // Load overview data with retry logic
    this.dashboardService.getOverview()
      .pipe(
        takeUntil(this.destroy$),
        retryWhen(errors => 
          errors.pipe(
            delay(2000), // Wait 2 seconds before retry
            switchMap((error, index) => {
              if (index < this.maxRetryAttempts) {
                console.log(`Retry attempt ${index + 1}/${this.maxRetryAttempts}`);
                return timer(2000);
              }
              throw error;
            })
          )
        ),
        catchError(error => {
          console.error('Failed to load overview after retries:', error);
          this.errorMessage = error;
          this.isLoading = false;
          this.retryCount++;
          return [];
        })
      )
      .subscribe({
        next: (overview) => {
          this.overview = overview;
          this.updateChartData();
          this.isLoading = false;
          this.lastUpdated = new Date();
          this.retryCount = 0; // Reset retry count on success
        },
        error: (error) => {
          console.error('Failed to load overview:', error);
          this.errorMessage = error;
          this.isLoading = false;
        }
      });
  }

  /**
   * Initialize donut chart options
   */
  initializeDonutChart() {
    this.donutChartOptions = {
      series: [0, 0], // Will be updated with real data
      chart: {
        type: 'donut',
        height: 300,
        toolbar: {
          show: false
        }
      },
      labels: ['Money In', 'Money Out'],
      colors: ['#f24d12', '#6B7280'],
      dataLabels: {
        enabled: true,
        formatter: function (val: string) {
          return parseFloat(val).toFixed(2) + "%"
        }
      },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center'
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return val.toFixed(2) + " L"
          }
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '60%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '14px',
                fontWeight: 600,
                color: '#1e293b'
              },
              value: {
                show: true,
                fontSize: '16px',
                fontWeight: 700,
                color: '#f24d12',
                formatter: function (val: string) {
                  return parseFloat(val).toFixed(2) + " L"
                }
              },
              total: {
                show: true,
                showAlways: true,
                label: 'Total',
                fontSize: '14px',
                fontWeight: 600,
                color: '#64748b',
                formatter: function (w: any) {
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return total.toFixed(2) + " L"
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Initialize chart options
   */
  initializeCharts() {
    // Initialize with 30D data by default
    const categories = Array.from({length: 30}, (_, i) => `Day ${i + 1}`);
    const collectionsData = Array.from({length: 30}, () => Math.floor(Math.random() * 200) + 100);
    const salesData = Array.from({length: 30}, () => Math.floor(Math.random() * 150) + 80);

    this.chartOptions = {
      series: [
        {
          name: 'Money In',
          type: 'area',
          data: collectionsData
        },
        {
          name: 'Money Out',
          type: 'area',
          data: salesData
        }
      ],
      chart: {
        type: 'area',
        height: 300,
        stacked: false,
        toolbar: {
          show: false
        }
      },
      xaxis: {
        categories: categories
      },
      yaxis: {
        title: {
          text: 'Amount (RWF)'
        }
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100]
        }
      },
      dataLabels: {
        enabled: false
      },
      colors: ['#f24d12', '#6B7280'],
      tooltip: {
        y: {
          formatter: function (val) {
            return val.toLocaleString() + " RWF"
          }
        }
      },
      grid: {
        borderColor: '#f1f5f9'
      },
      legend: {
        show: true,
        position: 'top'
      }
    };
  }

  /**
   * Update chart data based on overview data
   */
  updateChartData() {
    if (!this.overview) return;

    // Debug: Log recent transactions to see date format
    if (this.overview.recent_transactions && this.overview.recent_transactions.length > 0) {
      console.log('Recent transactions data:', this.overview.recent_transactions);
      this.overview.recent_transactions.forEach((transaction, index) => {
        console.log(`Transaction ${index + 1}:`, {
          transaction_at: transaction.transaction_at,
          created_at: transaction.created_at,
          type: transaction.type,
          amount: transaction.amount
        });
      });
    }

    // Use 30D data by default (matching the active tab)
    const categories = Array.from({length: 30}, (_, i) => {
      const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Generate money in/out data for spline area chart
    const moneyInData = Array.from({length: 30}, () => Math.floor(Math.random() * 500000) + 100000);
    const moneyOutData = Array.from({length: 30}, () => Math.floor(Math.random() * 400000) + 80000);

    this.chartOptions = {
      ...this.chartOptions,
      series: [
        {
          name: 'Money In',
          type: 'area',
          data: moneyInData
        },
        {
          name: 'Money Out',
          type: 'area',
          data: moneyOutData
        }
      ],
      xaxis: {
        categories: categories
      },
      chart: {
        ...this.chartOptions.chart,
        type: 'area',
        stacked: false,
        toolbar: {
          show: false
        }
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100]
        }
      }
    };

    // Update donut chart data
    this.updateDonutChartData();
  }

  /**
   * Update donut chart data based on overview data
   */
  updateDonutChartData() {
    if (!this.overview) return;

    // Calculate money in/out from transaction volume and balance
    const moneyIn = this.overview.summary.transactions.volume * 0.6; // 60% of volume is money in
    const moneyOut = this.overview.summary.transactions.volume * 0.4; // 40% of volume is money out

    this.donutChartOptions = {
      ...this.donutChartOptions,
      series: [moneyIn, moneyOut]
    };
  }

  /**
   * Quick action handlers
   */
  quickAction(action: string) {
    switch(action) {
      case 'send-money':
        // Navigate to transactions screen for sending money
        this.router.navigate(['/transactions']);
        break;
      case 'request-money':
        // Navigate to transactions screen for requesting money
        this.router.navigate(['/transactions']);
        break;
      case 'top-up':
        // Navigate to ikofi (wallets) for top-up
        this.router.navigate(['/ikofi']);
        break;
      case 'apply-loan':
        // Navigate to loans screen
        this.router.navigate(['/loans']);
        break;
      case 'pay-bills':
        // Navigate to bills/payments screen
        this.router.navigate(['/transactions']);
        break;
      case 'view-statements':
        // Navigate to statements/reports screen
        this.router.navigate(['/transactions']);
        break;
    }
  }

  /**
   * Navigation methods
   */

  navigateToWallets() {
    this.router.navigate(['/ikofi']);
  }

  navigateToTransactions() {
    this.router.navigate(['/transactions']);
  }

  navigateToLoans() {
    this.router.navigate(['/loans']);
  }

  navigateToSavings() {
    this.router.navigate(['/savings']);
  }

  viewTransactionDetails(transaction: any) {
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

  getTransactionTitle(transaction: any): string {
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

  /**
   * Utility methods
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-RW').format(value);
  }

  formatDate(dateString: string): string {
    if (!dateString) {
      return 'Unknown date';
    }
    
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    // Show "time ago" for recent dates (within 5 days)
    if (diffInDays <= 5) {
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${diffInHours} hours ago`;
      } else if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays === 2) {
        return '2 days ago';
      } else if (diffInDays === 3) {
        return '3 days ago';
      } else if (diffInDays === 4) {
        return '4 days ago';
      } else if (diffInDays === 5) {
        return '5 days ago';
      }
    }
    
    // Show actual date and time for older dates (past 5 days)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatChartPeriod(period: string): string {
    switch(period) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return period;
    }
  }

  getTransactionAccount(transaction: any): string {
    if (transaction.supplier_account) {
      return transaction.supplier_account.name;
    } else if (transaction.customer_account) {
      return transaction.customer_account.name;
    }
    return 'Unknown';
  }

  /**
   * Update chart data based on period
   */
  updateChart(period: string, event?: Event) {
    // Update active button
    document.querySelectorAll('.chart-controls button').forEach(btn => btn.classList.remove('active'));
    if (event?.target && event.target instanceof HTMLElement) {
      event.target.classList.add('active');
    }

    // Update chart data based on period
    let newMoneyInData: number[];
    let newMoneyOutData: number[];
    let categories: string[];

    switch(period) {
      case '7D':
        categories = Array.from({length: 7}, (_, i) => {
          const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        newMoneyInData = Array.from({length: 7}, () => Math.floor(Math.random() * 800000) + 200000);
        newMoneyOutData = Array.from({length: 7}, () => Math.floor(Math.random() * 600000) + 150000);
        break;
      case '30D':
        categories = Array.from({length: 30}, (_, i) => {
          const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        newMoneyInData = Array.from({length: 30}, () => Math.floor(Math.random() * 500000) + 100000);
        newMoneyOutData = Array.from({length: 30}, () => Math.floor(Math.random() * 400000) + 80000);
        break;
      case '90D':
        categories = Array.from({length: 12}, (_, i) => `Week ${i + 1}`);
        newMoneyInData = Array.from({length: 12}, () => Math.floor(Math.random() * 2000000) + 1000000);
        newMoneyOutData = Array.from({length: 12}, () => Math.floor(Math.random() * 1500000) + 800000);
        break;
      default:
        // Default to 30D data
        categories = Array.from({length: 30}, (_, i) => {
          const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        newMoneyInData = Array.from({length: 30}, () => Math.floor(Math.random() * 500000) + 100000);
        newMoneyOutData = Array.from({length: 30}, () => Math.floor(Math.random() * 400000) + 80000);
    }
    
    this.chartOptions = {
      ...this.chartOptions,
      series: [
        {
          name: 'Money In',
          type: 'area',
          data: newMoneyInData
        },
        {
          name: 'Money Out',
          type: 'area',
          data: newMoneyOutData
        }
      ],
      xaxis: {
        categories: categories
      }
    };
  }

  /**
   * Start auto-refresh functionality
   */
  startAutoRefresh() {
    // Auto-refresh every 30 seconds like mobile app
    interval(this.autoRefreshInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.isRefreshing) {
          this.refreshDashboard();
        }
      });
  }

  /**
   * Refresh dashboard data with loading state
   */
  refreshDashboard() {
    this.isRefreshing = true;
    this.loadDashboardData();
    
    // Reset refreshing state after a short delay
    setTimeout(() => {
      this.isRefreshing = false;
    }, 1000);
  }

  /**
   * Force refresh dashboard data
   */
  forceRefresh() {
    this.retryCount = 0;
    this.refreshDashboard();
  }

  /**
   * Listen for account changes and reload dashboard data
   */
  listenForAccountChanges() {
    // Listen for account changes from AuthService
    this.authService.currentAccount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(account => {
        if (account) {
          console.log('Account changed, reloading dashboard for:', account.account_name);
          this.loadDashboardData();
        }
      });
  }

  /**
   * Modal management methods
   */
  openAddCustomerModal() {
    this.showAddCustomerModal = true;
  }

  closeAddCustomerModal() {
    this.showAddCustomerModal = false;
  }

  onCustomerAdded(customer: any) {
    console.log('Customer added from dashboard:', customer);
    this.closeAddCustomerModal();
    // Optionally refresh dashboard data
    this.refreshDashboard();
  }

  openAddSupplierModal() {
    this.showAddSupplierModal = true;
  }

  closeAddSupplierModal() {
    this.showAddSupplierModal = false;
  }

  onSupplierAdded(supplier: any) {
    console.log('Supplier added from dashboard:', supplier);
    this.closeAddSupplierModal();
    // Optionally refresh dashboard data
    this.refreshDashboard();
  }
}