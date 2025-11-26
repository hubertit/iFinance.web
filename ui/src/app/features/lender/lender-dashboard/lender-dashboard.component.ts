import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { LenderService, ActiveLoan } from '../../../core/services/lender.service';
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

        <!-- Applications -->
        <div class="stat-card applications" (click)="navigateToApplications()">
          <div class="stat-icon">
            <app-feather-icon name="file-text" size="18px"></app-feather-icon>
          </div>
          <div class="stat-details">
            <div class="stat-title">Applications</div>
            <div class="stat-numbers">
              <div class="main-stat">{{ dashboardData.summary.applications.approved }}</div>
              <div class="sub-stats">
                <span class="success">{{ dashboardData.summary.applications.approved }} Approved & Disbursed</span>
                <span class="volume">{{ dashboardData.summary.applications.pending + dashboardData.summary.applications.underReview }} Pending/Review</span>
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
    private router: Router,
    private lenderService: LenderService,
    private http: HttpClient
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
   * Load dashboard data from actual API borrowers
   */
  loadDashboardData() {
    this.isLoading = true;
    this.errorMessage = null;

    // Check if loans exist, if not, fetch borrowers and generate loans
    const currentLoans = this.lenderService.getActiveLoans();
    if (currentLoans.length === 0) {
      // No loans yet, fetch borrowers from API and generate loans
      this.fetchBorrowersAndGenerateLoans();
    } else {
      // Loans exist, use them
      this.dashboardData = this.calculateDashboardDataFromLoans(currentLoans);
      this.updateChartData();
      this.isLoading = false;
      this.lastUpdated = new Date();
    }

    // Subscribe to loan updates
    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loans => {
        if (loans.length > 0) {
          this.dashboardData = this.calculateDashboardDataFromLoans(loans);
          this.updateChartData();
          this.isLoading = false;
          this.lastUpdated = new Date();
        }
      });
  }

  /**
   * Fetch borrowers from DJYH API and generate loans
   */
  private fetchBorrowersAndGenerateLoans() {
    const token = this.authService.getToken();
    if (!token) {
      console.error('🔧 LenderDashboard: No authentication token found.');
      this.isLoading = false;
      this.errorMessage = 'Please login to view dashboard data.';
      return;
    }

    const apiUrl = '/djyh-api/api/v1/users/dcc?limit=500';
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<any>(apiUrl, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let apiUsers: any[] = [];
          if (response?.success && response?.data && Array.isArray(response.data)) {
            apiUsers = response.data;
          } else if (response && Array.isArray(response)) {
            apiUsers = response;
          }

          if (apiUsers.length > 0) {
            // Generate loans from borrowers
            const borrowersForLoans = apiUsers.map((user: any) => ({
              id: user.id || '',
              name: user.name || 'Unknown',
              phone: user.phone || '',
              email: user.email || ''
            }));
            this.lenderService.generateLoansFromBorrowers(borrowersForLoans);
            console.log(`✅ LenderDashboard: Generated ${borrowersForLoans.length * 2} loans from ${borrowersForLoans.length} borrowers`);
          }
        },
        error: (error) => {
          console.error('❌ LenderDashboard: Error fetching borrowers:', error);
          this.isLoading = false;
          this.errorMessage = 'Failed to load dashboard data. Please try again.';
        }
      });
  }

  /**
   * Calculate dashboard data from actual loans (generated from DJYH API borrowers)
   */
  private calculateDashboardDataFromLoans(loans: ActiveLoan[]): LenderDashboardData {
    // Group loans by borrower to get unique borrowers
    const borrowerMap = new Map<string, { name: string, loans: ActiveLoan[] }>();
    loans.forEach(loan => {
      if (!borrowerMap.has(loan.borrowerId)) {
        borrowerMap.set(loan.borrowerId, { name: loan.borrowerName, loans: [] });
      }
      borrowerMap.get(loan.borrowerId)!.loans.push(loan);
    });

    const totalBorrowers = borrowerMap.size;
    const totalActiveLoans = loans.filter(l => l.status === 'active').length;
    const overdueLoans = loans.filter(l => l.daysPastDue > 0).length;
    const totalPortfolio = loans.reduce((sum, loan) => sum + loan.outstandingBalance, 0);
    const totalDisbursed = loans.reduce((sum, loan) => sum + loan.disbursedAmount, 0);
    const totalCollected = loans.reduce((sum, loan) => sum + loan.totalPaid, 0);
    const totalOverdue = loans
      .filter(l => l.daysPastDue > 0)
      .reduce((sum, loan) => sum + loan.outstandingBalance, 0);

    // Calculate this month's disbursements
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthDisbursed = loans
      .filter(loan => loan.disbursedAt && new Date(loan.disbursedAt) >= startOfMonth)
      .reduce((sum, loan) => sum + loan.disbursedAmount, 0);

    // Get applications data from real applications (synchronous)
    // All applications are approved and disbursed
    const applications = this.lenderService.getLoanApplications();
    const applicationsData = {
      pending: applications.filter(app => app.status === 'pending').length,
      underReview: applications.filter(app => app.status === 'under_review').length,
      approved: applications.filter(app => app.status === 'approved' || app.status === 'disbursed').length, // Include disbursed as approved
      rejected: applications.filter(app => app.status === 'rejected').length
    };

    // Get recent activities from actual loans (sorted by disbursement date)
    const recentActivities = Array.from(borrowerMap.values())
      .map((borrower) => ({
        id: `activity-${borrower.loans[0]?.borrowerId}`,
        type: 'disbursement' as const,
        borrower: borrower.name,
        amount: borrower.loans.reduce((sum, loan) => sum + loan.disbursedAmount, 0), // Total for borrower
        status: 'completed' as const,
        date: borrower.loans[0]?.disbursedAt?.toISOString() || new Date().toISOString()
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      summary: {
        portfolio: {
          total: totalPortfolio,
          active: totalActiveLoans,
          overdue: overdueLoans
        },
        applications: applicationsData,
        disbursements: {
          total: totalDisbursed,
          thisMonth: thisMonthDisbursed,
          growth: 0 // No growth yet (new program)
        },
        repayments: {
          collected: totalCollected,
          overdue: totalOverdue,
          collectionRate: totalDisbursed > 0 ? (totalCollected / totalDisbursed) * 100 : 0
        }
      },
      recentActivities: recentActivities
    };
  }

  /**
   * Initialize chart options with real data from loans
   */
  initializeCharts() {
    const categories = Array.from({length: 30}, (_, i) => {
      const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    // Initialize with empty data, will be populated from real loans
    this.chartOptions = {
      series: [
        {
          name: 'Disbursements',
          type: 'area',
          data: Array.from({length: 30}, () => 0)
        },
        {
          name: 'Repayments',
          type: 'area',
          data: Array.from({length: 30}, () => 0)
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
   * Initialize donut chart with real data
   */
  initializeDonutChart() {
    // Initialize with empty data, will be populated from real loans
    this.donutChartOptions = {
      series: [0, 0, 0, 0], // Will be updated from actual loan data
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
   * Update chart data from real loans
   */
  updateChartData() {
    // Update charts with real data from loans
    this.updateChartFromLoans('30D');
    this.updateDonutChartData();
  }

  /**
   * Update chart from actual loan data
   */
  private updateChartFromLoans(period: string = '30D') {
    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loans => {
        let categories: string[];
        let days: number;
        
        switch(period) {
          case '7D':
            days = 7;
            categories = Array.from({length: days}, (_, i) => {
              const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });
            break;
          case '90D':
            days = 12; // 12 weeks
            categories = Array.from({length: days}, (_, i) => `Week ${i + 1}`);
            break;
          default: // 30D
            days = 30;
            categories = Array.from({length: days}, (_, i) => {
              const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });
        }

        // Group disbursements and repayments by date
        const disbursementsByDate = new Map<string, number>();
        const repaymentsByDate = new Map<string, number>();

        loans.forEach(loan => {
          // Disbursements
          if (loan.disbursedAt) {
            const disbursedDate = new Date(loan.disbursedAt);
            const dateKey = period === '90D' 
              ? this.getWeekKey(disbursedDate)
              : disbursedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            if (categories.includes(dateKey)) {
              const current = disbursementsByDate.get(dateKey) || 0;
              disbursementsByDate.set(dateKey, current + loan.disbursedAmount);
            }
          }

          // Repayments (if any payments were made)
          // For now, all repayments are 0, but structure is ready for when payments start
          if (loan.totalPaid > 0) {
            // Would need payment history to group by date
            // For now, repayments are 0
          }
        });

        // Create data arrays matching categories
        const disbursementsData = categories.map(date => disbursementsByDate.get(date) || 0);
        const repaymentsData = categories.map(() => 0); // No repayments yet

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
      });
  }

  /**
   * Get week key for 90D period
   */
  private getWeekKey(date: Date): string {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `Week ${weekNumber}`;
  }

  /**
   * Update donut chart data from actual loans (DJYH API borrowers)
   */
  updateDonutChartData() {
    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loans => {
        const active = loans.filter(l => l.status === 'active').length;
        const overdue = loans.filter(l => l.daysPastDue > 0).length;
        const completed = loans.filter(l => l.status === 'completed').length;
        const defaulted = loans.filter(l => l.status === 'defaulted').length;

        this.donutChartOptions = {
          ...this.donutChartOptions,
          series: [active, overdue, completed, defaulted]
        };
      });
  }

  /**
   * Update chart based on period using real loan data
   */
  updateChart(period: string, event?: Event) {
    document.querySelectorAll('.chart-controls button').forEach(btn => btn.classList.remove('active'));
    if (event?.target && event.target instanceof HTMLElement) {
      event.target.classList.add('active');
    }

    // Update chart with real data for the selected period
    this.updateChartFromLoans(period);
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
