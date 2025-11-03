import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
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
} from 'ng-apexcharts';
import { Subject, takeUntil, timer } from 'rxjs';
import { delay, switchMap, catchError, retryWhen } from 'rxjs/operators';

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

export interface LenderDashboardData {
  summary: {
    portfolio: {
      total: number;
      active: number;
      overdue: number;
    };
    applications: {
      pending: number;
      underReview: number;
      approved: number;
      rejected: number;
    };
    disbursements: {
      total: number;
      thisMonth: number;
      growth: number;
    };
    repayments: {
      collected: number;
      overdue: number;
      collectionRate: number;
    };
  };
  recentActivities: Array<{
    id: string;
    type: string;
    borrower: string;
    amount: number;
    status: string;
    date: string;
  }>;
}

@Component({
  selector: 'app-lender-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconComponent, NgApexchartsModule],
  template: `
    <div class="dashboard-container">
      <!-- Stats Cards -->
      <div class="stats-grid" *ngIf="dashboardData" [class.loading-overlay]="isRefreshing">
        <!-- Loan Portfolio -->
        <div class="stat-card portfolio" (click)="navigateToPortfolio()">
          <div class="stat-icon">
            <app-feather-icon name="briefcase" size="18px"></app-feather-icon>
          </div>
          <div class="stat-details">
            <div class="stat-title">Loan Portfolio</div>
            <div class="stat-numbers">
              <div class="main-stat">{{ formatCurrency(dashboardData.summary.portfolio.total) }}</div>
              <div class="sub-stats">
                <span class="success">{{ dashboardData.summary.portfolio.active }} Active</span>
                <span class="warning">{{ dashboardData.summary.portfolio.overdue }} Overdue</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending Applications -->
        <div class="stat-card applications" (click)="navigateToApplications()">
          <div class="stat-icon">
            <app-feather-icon name="file-text" size="18px"></app-feather-icon>
          </div>
          <div class="stat-details">
            <div class="stat-title">Applications</div>
            <div class="stat-numbers">
              <div class="main-stat">{{ dashboardData.summary.applications.pending + dashboardData.summary.applications.underReview }}</div>
              <div class="sub-stats">
                <span class="success">{{ dashboardData.summary.applications.underReview }} Under Review</span>
                <span class="volume">{{ dashboardData.summary.applications.pending }} Pending</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Total Disbursements -->
        <div class="stat-card disbursements" (click)="navigateToDisbursements()">
          <div class="stat-icon">
            <app-feather-icon name="send" size="18px"></app-feather-icon>
          </div>
          <div class="stat-details">
            <div class="stat-title">Total Disbursed</div>
            <div class="stat-numbers">
              <div class="main-stat">{{ formatCurrency(dashboardData.summary.disbursements.total) }}</div>
              <div class="sub-stats">
                <span class="success">+{{ dashboardData.summary.disbursements.growth }}% Growth</span>
                <span class="volume">{{ formatCurrency(dashboardData.summary.disbursements.thisMonth) }} This Month</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Repayments -->
        <div class="stat-card repayments" (click)="navigateToRepayments()">
          <div class="stat-icon">
            <app-feather-icon name="trending-up" size="18px"></app-feather-icon>
          </div>
          <div class="stat-details">
            <div class="stat-title">Repayments Collected</div>
            <div class="stat-numbers">
              <div class="main-stat">{{ formatCurrency(dashboardData.summary.repayments.collected) }}</div>
              <div class="sub-stats">
                <span class="success">{{ dashboardData.summary.repayments.collectionRate }}% Collection Rate</span>
                <span class="warning">{{ formatCurrency(dashboardData.summary.repayments.overdue) }} Overdue</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section" *ngIf="dashboardData" [class.loading-overlay]="isRefreshing">
        <!-- Disbursements vs Repayments Trend -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>Disbursements vs Repayments</h3>
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

        <!-- Loan Status Distribution -->
        <div class="chart-container donut-chart">
          <div class="chart-header">
            <h3>Loan Status Distribution</h3>
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

      <!-- Recent Activity -->
      <div class="recent-transactions" *ngIf="dashboardData?.recentActivities?.length" [class.loading-overlay]="isRefreshing">
        <div class="section-header">
          <h3>Recent Activity</h3>
          <button class="view-all-btn" (click)="navigateToApplications()">View All</button>
        </div>
        <div class="transactions-list">
          <div class="transaction-item" 
               *ngFor="let activity of (dashboardData?.recentActivities || []).slice(0, 5)"
               (click)="viewActivityDetails(activity)">
            <div class="transaction-icon">
              <app-feather-icon 
                [name]="getActivityIcon(activity.type)" 
                size="16px">
              </app-feather-icon>
            </div>
            <div class="transaction-details">
              <div class="transaction-title">
                {{ getActivityTitle(activity) }}
              </div>
              <div class="transaction-date">{{ formatDate(activity.date) }}</div>
            </div>
            <div class="transaction-amount" [class]="getActivityAmountClass(activity.type)">
              {{ formatCurrency(activity.amount) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Skeleton Loading States -->
      <div *ngIf="isLoading && !dashboardData">
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
    </div>
  `,
  styleUrls: ['./lender-dashboard.component.scss']
})
export class LenderDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  dashboardData: LenderDashboardData | null = null;
  
  // UI state
  isLoading = true;
  errorMessage: string | null = null;
  lastUpdated: Date | null = null;
  isRefreshing = false;
  
  // Chart options
  chartOptions!: ChartOptions;
  donutChartOptions!: any;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeCharts();
    this.initializeDonutChart();
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load dashboard data with mock data for now
   */
  loadDashboardData() {
    this.isLoading = true;
    this.errorMessage = null;

    // Simulate API call with mock data
    setTimeout(() => {
      this.dashboardData = this.getMockLenderData();
      this.updateChartData();
      this.isLoading = false;
      this.lastUpdated = new Date();
    }, 1000);
  }

  /**
   * Get mock lender dashboard data
   */
  private getMockLenderData(): LenderDashboardData {
    return {
      summary: {
        portfolio: {
          total: 125000000,
          active: 284,
          overdue: 12
        },
        applications: {
          pending: 23,
          underReview: 15,
          approved: 342,
          rejected: 45
        },
        disbursements: {
          total: 245000000,
          thisMonth: 18500000,
          growth: 18.5
        },
        repayments: {
          collected: 89200000,
          overdue: 3400000,
          collectionRate: 92.5
        }
      },
      recentActivities: [
        {
          id: '1',
          type: 'application',
          borrower: 'Jean Baptiste',
          amount: 500000,
          status: 'under_review',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'disbursement',
          borrower: 'Marie Claire',
          amount: 750000,
          status: 'completed',
          date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'repayment',
          borrower: 'François',
          amount: 125000,
          status: 'completed',
          date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          type: 'application',
          borrower: 'Immaculée',
          amount: 300000,
          status: 'approved',
          date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          type: 'repayment',
          borrower: 'Théophile',
          amount: 200000,
          status: 'completed',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };
  }

  /**
   * Initialize chart options
   */
  initializeCharts() {
    const categories = Array.from({length: 30}, (_, i) => {
      const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    this.chartOptions = {
      series: [
        {
          name: 'Disbursements',
          type: 'area',
          data: Array.from({length: 30}, () => Math.floor(Math.random() * 2000000) + 500000)
        },
        {
          name: 'Repayments',
          type: 'area',
          data: Array.from({length: 30}, () => Math.floor(Math.random() * 1500000) + 400000)
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
      colors: ['#f24d12', '#1abc9c'],
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
   * Initialize donut chart
   */
  initializeDonutChart() {
    this.donutChartOptions = {
      series: [180, 45, 342, 12],
      chart: {
        type: 'donut',
        height: 300,
        toolbar: {
          show: false
        }
      },
      labels: ['Active', 'Overdue', 'Completed', 'Defaulted'],
      colors: ['#1abc9c', '#f39c12', '#3498db', '#e74c3c'],
      dataLabels: {
        enabled: true,
        formatter: function (val: string) {
          return parseFloat(val).toFixed(1) + "%"
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
            return val.toLocaleString() + " loans"
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
                  return val + " loans"
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
                  return total + " loans"
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Update chart data
   */
  updateChartData() {
    if (!this.dashboardData) return;
    
    // Chart data will be updated based on period selection
    this.updateDonutChartData();
  }

  /**
   * Update donut chart data
   */
  updateDonutChartData() {
    if (!this.dashboardData) return;

    const active = this.dashboardData.summary.portfolio.active;
    const overdue = this.dashboardData.summary.portfolio.overdue;
    const completed = this.dashboardData.summary.applications.approved;
    const defaulted = Math.floor(overdue * 0.5);

    this.donutChartOptions = {
      ...this.donutChartOptions,
      series: [active, overdue, completed, defaulted]
    };
  }

  /**
   * Update chart based on period
   */
  updateChart(period: string, event?: Event) {
    document.querySelectorAll('.chart-controls button').forEach(btn => btn.classList.remove('active'));
    if (event?.target && event.target instanceof HTMLElement) {
      event.target.classList.add('active');
    }

    let categories: string[];
    let disbursementsData: number[];
    let repaymentsData: number[];

    switch(period) {
      case '7D':
        categories = Array.from({length: 7}, (_, i) => {
          const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        disbursementsData = Array.from({length: 7}, () => Math.floor(Math.random() * 3000000) + 1000000);
        repaymentsData = Array.from({length: 7}, () => Math.floor(Math.random() * 2500000) + 800000);
        break;
      case '30D':
        categories = Array.from({length: 30}, (_, i) => {
          const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        disbursementsData = Array.from({length: 30}, () => Math.floor(Math.random() * 2000000) + 500000);
        repaymentsData = Array.from({length: 30}, () => Math.floor(Math.random() * 1500000) + 400000);
        break;
      case '90D':
        categories = Array.from({length: 12}, (_, i) => `Week ${i + 1}`);
        disbursementsData = Array.from({length: 12}, () => Math.floor(Math.random() * 15000000) + 8000000);
        repaymentsData = Array.from({length: 12}, () => Math.floor(Math.random() * 12000000) + 6000000);
        break;
      default:
        categories = Array.from({length: 30}, (_, i) => {
          const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        disbursementsData = Array.from({length: 30}, () => Math.floor(Math.random() * 2000000) + 500000);
        repaymentsData = Array.from({length: 30}, () => Math.floor(Math.random() * 1500000) + 400000);
    }
    
    this.chartOptions = {
      ...this.chartOptions,
      series: [
        {
          name: 'Disbursements',
          type: 'area',
          data: disbursementsData
        },
        {
          name: 'Repayments',
          type: 'area',
          data: repaymentsData
        }
      ],
      xaxis: {
        categories: categories
      }
    };
  }

  /**
   * Navigation methods
   */
  navigateToPortfolio() {
    this.router.navigate(['/lender/portfolio/overview']);
  }

  navigateToApplications() {
    this.router.navigate(['/lender/loan-applications']);
  }

  navigateToDisbursements() {
    this.router.navigate(['/lender/disbursements']);
  }

  navigateToRepayments() {
    this.router.navigate(['/lender/repayments/schedule']);
  }

  viewActivityDetails(activity: any) {
    console.log('View activity details:', activity);
  }

  getActivityIcon(type: string): string {
    switch(type.toLowerCase()) {
      case 'application':
        return 'file-text';
      case 'disbursement':
        return 'send';
      case 'repayment':
        return 'trending-up';
      default:
        return 'file-text';
    }
  }

  getActivityTitle(activity: any): string {
    switch(activity.type.toLowerCase()) {
      case 'application':
        return `Application from ${activity.borrower}`;
      case 'disbursement':
        return `Disbursed to ${activity.borrower}`;
      case 'repayment':
        return `Repayment from ${activity.borrower}`;
      default:
        return `${activity.type} - ${activity.borrower}`;
    }
  }

  getActivityAmountClass(type: string): string {
    switch(type.toLowerCase()) {
      case 'disbursement':
        return 'negative';
      case 'repayment':
      case 'application':
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

  formatDate(dateString: string): string {
    if (!dateString) {
      return 'Unknown date';
    }
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays <= 5) {
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${diffInHours} hours ago`;
      } else if (diffInDays === 1) {
        return 'Yesterday';
      } else {
        return `${diffInDays} days ago`;
      }
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Refresh dashboard
   */
  refreshDashboard() {
    this.isRefreshing = true;
    this.loadDashboardData();
    
    setTimeout(() => {
      this.isRefreshing = false;
    }, 1000);
  }

  forceRefresh() {
    this.refreshDashboard();
  }
}
