import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LenderService, Lender, LoanApplication } from '../../../core/services/lender.service';
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
  ChartComponent
} from 'ng-apexcharts';
import { Subject, takeUntil } from 'rxjs';

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
  selector: 'app-lender-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconComponent, NgApexchartsModule],
  template: `
    <div class="lender-dashboard">

      <!-- Stats Cards -->
      <div class="stats-grid" *ngIf="lenderStats">
        <div class="stat-card applications">
          <div class="stat-icon">
            <app-feather-icon name="file-text" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ lenderStats.totalApplications }}</div>
            <div class="stat-label">Total Applications</div>
            <div class="stat-change positive">+12% this month</div>
          </div>
        </div>

        <div class="stat-card pending">
          <div class="stat-icon">
            <app-feather-icon name="clock" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ lenderStats.pendingApplications }}</div>
            <div class="stat-label">Pending Review</div>
            <div class="stat-change neutral">{{ lenderStats.underReviewApplications }} under review</div>
          </div>
        </div>

        <div class="stat-card approved">
          <div class="stat-icon">
            <app-feather-icon name="check-circle" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ lenderStats.approvedApplications }}</div>
            <div class="stat-label">Approved Loans</div>
            <div class="stat-change positive">{{ lenderStats.approvalRate | number:'1.1-1' }}% approval rate</div>
          </div>
        </div>

        <div class="stat-card disbursed">
          <div class="stat-icon">
            <app-feather-icon name="dollar-sign" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(lenderStats.totalLoanAmount) }}</div>
            <div class="stat-label">Total Disbursed</div>
            <div class="stat-change positive">+8% this month</div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <!-- Applications Trend Chart -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>Loan Applications Trend</h3>
            <div class="chart-controls">
              <button class="btn-small" (click)="updateChart('7D', $event)">7D</button>
              <button class="btn-small active" (click)="updateChart('30D', $event)">30D</button>
              <button class="btn-small" (click)="updateChart('90D', $event)">90D</button>
            </div>
          </div>
          <div class="chart-wrapper">
            <apx-chart
              [series]="applicationsChartOptions.series"
              [chart]="applicationsChartOptions.chart"
              [xaxis]="applicationsChartOptions.xaxis"
              [yaxis]="applicationsChartOptions.yaxis"
              [dataLabels]="applicationsChartOptions.dataLabels"
              [stroke]="applicationsChartOptions.stroke"
              [fill]="applicationsChartOptions.fill"
              [colors]="applicationsChartOptions.colors"
              [tooltip]="applicationsChartOptions.tooltip"
              [grid]="applicationsChartOptions.grid"
              [legend]="applicationsChartOptions.legend || {}">
            </apx-chart>
          </div>
        </div>

        <!-- Loan Status Distribution -->
        <div class="chart-container donut-chart">
          <div class="chart-header">
            <h3>Applications by Status</h3>
          </div>
          <div class="chart-wrapper">
            <apx-chart
              [series]="statusChartOptions.series"
              [chart]="statusChartOptions.chart"
              [labels]="statusChartOptions.labels"
              [colors]="statusChartOptions.colors"
              [dataLabels]="statusChartOptions.dataLabels"
              [legend]="statusChartOptions.legend"
              [tooltip]="statusChartOptions.tooltip"
              [plotOptions]="statusChartOptions.plotOptions">
            </apx-chart>
          </div>
        </div>
      </div>

      <!-- Recent Applications -->
      <div class="recent-applications">
        <div class="section-header">
          <h3>Recent Loan Applications</h3>
          <button class="view-all-btn" (click)="navigateToApplications()">View All</button>
        </div>
        <div class="applications-list">
          <div class="application-item" 
               *ngFor="let application of recentApplications"
               (click)="viewApplication(application)">
            <div class="application-icon" [style.background-color]="getStatusColor(application.status)">
              <app-feather-icon [name]="getApplicationIcon(application.status)" size="16px"></app-feather-icon>
            </div>
            <div class="application-details">
              <div class="application-title">{{ application.applicantName }}</div>
              <div class="application-product">{{ application.productName }}</div>
              <div class="application-date">{{ formatDate(application.submittedAt) }}</div>
            </div>
            <div class="application-amount">{{ formatCurrency(application.amount) }}</div>
            <div class="application-status" [style.color]="getStatusColor(application.status)">
              {{ formatStatus(application.status) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <div class="actions-grid">
          <button class="action-btn" (click)="navigateToApplications()">
            <div class="action-icon">
              <app-feather-icon name="file-text" size="20px"></app-feather-icon>
            </div>
            <span class="action-label">Review Applications</span>
          </button>
          
          <button class="action-btn" (click)="navigateToProducts()">
            <div class="action-icon">
              <app-feather-icon name="package" size="20px"></app-feather-icon>
            </div>
            <span class="action-label">Manage Products</span>
          </button>
          
          <button class="action-btn" (click)="navigateToAnalytics()">
            <div class="action-icon">
              <app-feather-icon name="bar-chart-2" size="20px"></app-feather-icon>
            </div>
            <span class="action-label">View Analytics</span>
          </button>
          
          <button class="action-btn" (click)="navigateToReports()">
            <div class="action-icon">
              <app-feather-icon name="download" size="20px"></app-feather-icon>
            </div>
            <span class="action-label">Generate Reports</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./lender-dashboard.component.scss']
})
export class LenderDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentLender: Lender | null = null;
  lenderStats: any = null;
  recentApplications: LoanApplication[] = [];
  
  applicationsChartOptions!: ChartOptions;
  statusChartOptions!: any;

  constructor(private lenderService: LenderService) {
    this.initializeCharts();
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData() {
    // Load current lender
    this.lenderService.currentLender$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lender => {
        this.currentLender = lender;
      });

    // Load stats
    this.lenderStats = this.lenderService.getLenderStats();

    // Load recent applications
    this.lenderService.loanApplications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(applications => {
        this.recentApplications = applications
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .slice(0, 5);
      });

    this.updateCharts();
  }

  private initializeCharts() {
    // Applications trend chart
    this.applicationsChartOptions = {
      series: [
        {
          name: 'Applications',
          type: 'area',
          data: [12, 19, 15, 25, 22, 18, 24, 20, 28, 25, 30, 27]
        },
        {
          name: 'Approved',
          type: 'area',
          data: [8, 12, 10, 18, 15, 12, 16, 14, 20, 18, 22, 19]
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
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      },
      yaxis: {
        title: {
          text: 'Number of Applications'
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
          formatter: function (val: number) {
            return val + " applications"
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

    // Status distribution chart
    this.statusChartOptions = {
      series: [0, 0, 0, 0, 0], // Will be updated with real data
      chart: {
        type: 'donut',
        height: 300,
        toolbar: {
          show: false
        }
      },
      labels: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Disbursed'],
      colors: ['#f39c12', '#3498db', '#1abc9c', '#e74c3c', '#27ae60'],
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
            return val + " applications"
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
                  return val + " apps"
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
                  return total + " apps"
                }
              }
            }
          }
        }
      }
    };
  }

  private updateCharts() {
    if (!this.lenderStats) return;

    // Update status chart with real data
    const statusData = [
      this.lenderStats.pendingApplications,
      this.lenderStats.underReviewApplications,
      this.lenderStats.approvedApplications,
      this.lenderStats.rejectedApplications,
      this.lenderStats.disbursedLoans
    ];

    this.statusChartOptions = {
      ...this.statusChartOptions,
      series: statusData
    };
  }

  updateChart(period: string, event?: Event) {
    // Update active button
    document.querySelectorAll('.chart-controls button').forEach(btn => btn.classList.remove('active'));
    if (event?.target && event.target instanceof HTMLElement) {
      event.target.classList.add('active');
    }

    // Update chart data based on period
    let newData: number[];
    let categories: string[];

    switch(period) {
      case '7D':
        categories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        newData = [5, 8, 6, 12, 9, 4, 7];
        break;
      case '30D':
        categories = Array.from({length: 30}, (_, i) => `Day ${i + 1}`);
        newData = Array.from({length: 30}, () => Math.floor(Math.random() * 20) + 5);
        break;
      case '90D':
        categories = Array.from({length: 12}, (_, i) => `Week ${i + 1}`);
        newData = Array.from({length: 12}, () => Math.floor(Math.random() * 50) + 20);
        break;
      default:
        categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        newData = [12, 19, 15, 25, 22, 18];
    }

    this.applicationsChartOptions = {
      ...this.applicationsChartOptions,
      series: [
        {
          name: 'Applications',
          type: 'area',
          data: newData
        },
        {
          name: 'Approved',
          type: 'area',
          data: newData.map(val => Math.floor(val * 0.7))
        }
      ],
      xaxis: {
        categories: categories
      }
    };
  }

  // Navigation methods
  navigateToApplications() {
    // TODO: Navigate to applications page
    console.log('Navigate to applications');
  }

  navigateToProducts() {
    // TODO: Navigate to products page
    console.log('Navigate to products');
  }

  navigateToAnalytics() {
    // TODO: Navigate to analytics page
    console.log('Navigate to analytics');
  }

  navigateToReports() {
    // TODO: Navigate to reports page
    console.log('Navigate to reports');
  }

  viewApplication(application: LoanApplication) {
    // TODO: Show application details modal
    console.log('View application:', application);
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return this.lenderService.formatCurrency(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  formatStatus(status: string): string {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getStatusColor(status: string): string {
    return this.lenderService.getStatusColor(status);
  }

  getApplicationIcon(status: string): string {
    switch(status) {
      case 'pending': return 'clock';
      case 'under_review': return 'eye';
      case 'approved': return 'check-circle';
      case 'rejected': return 'x-circle';
      case 'disbursed': return 'dollar-sign';
      case 'completed': return 'check';
      case 'defaulted': return 'alert-triangle';
      default: return 'file-text';
    }
  }
}
