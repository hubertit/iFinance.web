import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
  ApexLegend,
  ApexFill,
  ApexTooltip,
  ApexPlotOptions,
} from 'ng-apexcharts';
import { LenderService, ActiveLoan } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

export interface PortfolioData {
  summary: {
    totalPortfolio: number;
    activeLoans: number;
    completedLoans: number;
    defaultedLoans: number;
    totalDisbursed: number;
    totalCollected: number;
    outstandingBalance: number;
    averageLoanSize: number;
    portfolioGrowth: number;
    collectionRate: number;
    defaultRate: number;
  };
  distribution: {
    byProduct: Array<{ product: string; amount: number; count: number }>;
    byStatus: Array<{ status: string; amount: number; count: number }>;
    byRiskLevel: Array<{ risk: string; amount: number; count: number }>;
  };
  trends: {
    monthlyDisbursements: Array<{ month: string; amount: number }>;
    monthlyCollections: Array<{ month: string; amount: number }>;
  };
}

@Component({
  selector: 'app-portfolio-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconComponent, NgApexchartsModule],
  template: `
    <div class="portfolio-overview">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Portfolio Overview</h1>
          <p class="page-description">Comprehensive view of your loan portfolio performance and metrics</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="exportReport()">
            <app-feather-icon name="download" size="16px"></app-feather-icon>
            Export Report
          </button>
          <button class="btn-primary" (click)="refreshPortfolio()">
            <app-feather-icon name="refresh-cw" size="16px"></app-feather-icon>
            Refresh
          </button>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="metrics-grid" *ngIf="portfolioData">
        <div class="metric-card primary">
          <div class="metric-icon">
            <app-feather-icon name="briefcase" size="24px"></app-feather-icon>
          </div>
          <div class="metric-content">
            <div class="metric-label">Total Portfolio Value</div>
            <div class="metric-value">{{ formatCurrency(portfolioData.summary.totalPortfolio) }}</div>
            <div class="metric-change positive" *ngIf="portfolioData.summary.portfolioGrowth > 0">
              <app-feather-icon name="trending-up" size="14px"></app-feather-icon>
              +{{ portfolioData.summary.portfolioGrowth }}%
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <app-feather-icon name="dollar-sign" size="24px"></app-feather-icon>
          </div>
          <div class="metric-content">
            <div class="metric-label">Outstanding Balance</div>
            <div class="metric-value">{{ formatCurrency(portfolioData.summary.outstandingBalance) }}</div>
            <div class="metric-info">{{ portfolioData.summary.activeLoans }} active loans</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <app-feather-icon name="trending-up" size="24px"></app-feather-icon>
          </div>
          <div class="metric-content">
            <div class="metric-label">Total Collected</div>
            <div class="metric-value">{{ formatCurrency(portfolioData.summary.totalCollected) }}</div>
            <div class="metric-change positive">
              {{ portfolioData.summary.collectionRate }}% collection rate
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <app-feather-icon name="bar-chart-2" size="24px"></app-feather-icon>
          </div>
          <div class="metric-content">
            <div class="metric-label">Average Loan Size</div>
            <div class="metric-value">{{ formatCurrency(portfolioData.summary.averageLoanSize) }}</div>
            <div class="metric-info">{{ portfolioData.summary.activeLoans + portfolioData.summary.completedLoans }} total loans</div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section" *ngIf="portfolioData">
        <!-- Portfolio Growth Chart -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>Portfolio Growth Trend</h3>
            <div class="chart-controls">
              <button 
                class="btn-small" 
                [class.active]="selectedPeriod === '6M'"
                (click)="updatePeriod('6M', $event)">6M</button>
              <button 
                class="btn-small" 
                [class.active]="selectedPeriod === '12M'"
                (click)="updatePeriod('12M', $event)">12M</button>
              <button 
                class="btn-small" 
                [class.active]="selectedPeriod === 'ALL'"
                (click)="updatePeriod('ALL', $event)">All</button>
            </div>
          </div>
          <div class="chart-wrapper">
            <apx-chart
              [series]="growthChartOptions.series"
              [chart]="growthChartOptions.chart"
              [xaxis]="growthChartOptions.xaxis"
              [yaxis]="growthChartOptions.yaxis"
              [dataLabels]="growthChartOptions.dataLabels"
              [stroke]="growthChartOptions.stroke"
              [fill]="growthChartOptions.fill"
              [colors]="growthChartOptions.colors"
              [tooltip]="growthChartOptions.tooltip"
              [grid]="growthChartOptions.grid"
              [legend]="growthChartOptions.legend">
            </apx-chart>
          </div>
        </div>

        <!-- Distribution Charts -->
        <div class="charts-row">
          <!-- Portfolio by Product -->
          <div class="chart-container small">
            <div class="chart-header">
              <h3>Portfolio by Product</h3>
            </div>
            <div class="chart-wrapper">
              <apx-chart
                [series]="productChartOptions.series"
                [chart]="productChartOptions.chart"
                [labels]="productChartOptions.labels"
                [colors]="productChartOptions.colors"
                [dataLabels]="productChartOptions.dataLabels"
                [legend]="productChartOptions.legend"
                [tooltip]="productChartOptions.tooltip"
                [plotOptions]="productChartOptions.plotOptions">
              </apx-chart>
            </div>
          </div>

          <!-- Portfolio by Status -->
          <div class="chart-container small">
            <div class="chart-header">
              <h3>Portfolio by Status</h3>
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
      </div>

      <!-- Portfolio Statistics -->
      <div class="stats-section" *ngIf="portfolioData">
        <div class="stats-card">
          <h3>Loan Distribution</h3>
          <div class="distribution-list">
            <div class="distribution-item" *ngFor="let item of portfolioData.distribution.byProduct">
              <div class="distribution-info">
                <div class="distribution-name">{{ item.product }}</div>
                <div class="distribution-count">{{ item.count }} loans</div>
              </div>
              <div class="distribution-amount">{{ formatCurrency(item.amount) }}</div>
              <div class="distribution-bar">
                <div 
                  class="distribution-fill" 
                  [style.width.%]="(item.amount / portfolioData.summary.totalPortfolio) * 100">
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="stats-card">
          <h3>Status Breakdown</h3>
          <div class="status-list">
            <div class="status-item" *ngFor="let item of portfolioData.distribution.byStatus">
              <div class="status-info">
                <span class="status-badge" [style.background-color]="getStatusColor(item.status)">
                  {{ item.status }}
                </span>
                <span class="status-count">{{ item.count }} loans</span>
              </div>
              <div class="status-amount">{{ formatCurrency(item.amount) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Performance Indicators -->
      <div class="kpi-section" *ngIf="portfolioData">
        <h3>Key Performance Indicators</h3>
        <div class="kpi-grid">
          <div class="kpi-item">
            <div class="kpi-label">Collection Rate</div>
            <div class="kpi-value positive">{{ portfolioData.summary.collectionRate }}%</div>
            <div class="kpi-description">Percentage of expected repayments collected</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">Default Rate</div>
            <div class="kpi-value" [class.negative]="portfolioData.summary.defaultRate > 5">
              {{ portfolioData.summary.defaultRate }}%
            </div>
            <div class="kpi-description">Percentage of loans in default</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">Portfolio Growth</div>
            <div class="kpi-value positive">+{{ portfolioData.summary.portfolioGrowth }}%</div>
            <div class="kpi-description">Year-over-year portfolio growth</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">Average Loan Size</div>
            <div class="kpi-value">{{ formatCurrency(portfolioData.summary.averageLoanSize) }}</div>
            <div class="kpi-description">Mean loan amount in portfolio</div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <app-feather-icon name="loader" size="32px"></app-feather-icon>
        <p>Loading portfolio data...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="errorMessage">
        <app-feather-icon name="alert-circle" size="32px"></app-feather-icon>
        <h3>Failed to Load Portfolio</h3>
        <p>{{ errorMessage }}</p>
        <button class="btn-primary" (click)="refreshPortfolio()">Retry</button>
      </div>
    </div>
  `,
  styleUrls: ['./portfolio-overview.component.scss']
})
export class PortfolioOverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  portfolioData: PortfolioData | null = null;
  isLoading = false;
  errorMessage = '';
  selectedPeriod = '12M';

  // Chart options
  growthChartOptions: any = {};
  productChartOptions: any = {};
  statusChartOptions: any = {};

  constructor(
    private lenderService: LenderService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadPortfolioData();
    this.initializeCharts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPortfolioData() {
    this.isLoading = true;
    this.errorMessage = '';

    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (loans) => {
          this.portfolioData = this.calculatePortfolioData(loans);
          this.updateCharts();
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load portfolio data. Please try again.';
          this.isLoading = false;
          console.error('Portfolio load error:', error);
        }
      });
  }

  private calculatePortfolioData(loans: ActiveLoan[]): PortfolioData {
    const totalPortfolio = loans.reduce((sum, loan) => sum + loan.outstandingBalance, 0);
    const totalDisbursed = loans.reduce((sum, loan) => sum + loan.disbursedAmount, 0);
    const totalCollected = loans.reduce((sum, loan) => sum + loan.totalPaid, 0);
    const outstandingBalance = loans.reduce((sum, loan) => sum + loan.outstandingBalance, 0);
    
    const activeLoans = loans.filter(l => l.status === 'active').length;
    const completedLoans = loans.filter(l => l.status === 'completed').length;
    const defaultedLoans = loans.filter(l => l.status === 'defaulted').length;

    const averageLoanSize = loans.length > 0 
      ? loans.reduce((sum, loan) => sum + loan.principalAmount, 0) / loans.length 
      : 0;

    const collectionRate = totalDisbursed > 0 
      ? (totalCollected / (totalDisbursed * 0.5)) * 100 
      : 0;

    const defaultRate = loans.length > 0 
      ? (defaultedLoans / loans.length) * 100 
      : 0;

    // Distribution by product
    const productMap = new Map<string, { amount: number; count: number }>();
    loans.forEach(loan => {
      const existing = productMap.get(loan.productName) || { amount: 0, count: 0 };
      productMap.set(loan.productName, {
        amount: existing.amount + loan.outstandingBalance,
        count: existing.count + 1
      });
    });

    const distributionByProduct = Array.from(productMap.entries()).map(([product, data]) => ({
      product,
      amount: data.amount,
      count: data.count
    }));

    // Distribution by status
    const statusMap = new Map<string, { amount: number; count: number }>();
    loans.forEach(loan => {
      const existing = statusMap.get(loan.status) || { amount: 0, count: 0 };
      statusMap.set(loan.status, {
        amount: existing.amount + loan.outstandingBalance,
        count: existing.count + 1
      });
    });

    const distributionByStatus = Array.from(statusMap.entries()).map(([status, data]) => ({
      status: this.formatStatus(status),
      amount: data.amount,
      count: data.count
    }));

    // Distribution by risk level (mock for now)
    const distributionByRisk = [
      { risk: 'Low Risk', amount: totalPortfolio * 0.6, count: Math.floor(loans.length * 0.6) },
      { risk: 'Medium Risk', amount: totalPortfolio * 0.3, count: Math.floor(loans.length * 0.3) },
      { risk: 'High Risk', amount: totalPortfolio * 0.1, count: Math.floor(loans.length * 0.1) }
    ];

    // Mock trends data
    const monthlyDisbursements = this.generateMonthlyData('disbursements', loans.length);
    const monthlyCollections = this.generateMonthlyData('collections', loans.length);

    return {
      summary: {
        totalPortfolio: totalPortfolio,
        activeLoans,
        completedLoans,
        defaultedLoans,
        totalDisbursed: totalDisbursed,
        totalCollected: totalCollected,
        outstandingBalance,
        averageLoanSize,
        portfolioGrowth: 15.5, // Mock growth percentage
        collectionRate: Math.min(collectionRate, 100),
        defaultRate: Math.min(defaultRate, 100)
      },
      distribution: {
        byProduct: distributionByProduct,
        byStatus: distributionByStatus,
        byRiskLevel: distributionByRisk
      },
      trends: {
        monthlyDisbursements,
        monthlyCollections
      }
    };
  }

  private generateMonthlyData(type: string, baseCount: number): Array<{ month: string; amount: number }> {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      amount: baseCount * (500000 + Math.random() * 2000000)
    }));
  }

  private initializeCharts() {
    this.growthChartOptions = {
      series: [
        {
          name: 'Disbursements',
          data: []
        },
        {
          name: 'Collections',
          data: []
        }
      ],
      chart: {
        type: 'area',
        height: 350,
        toolbar: { show: false }
      },
      xaxis: {
        categories: []
      },
      yaxis: {
        labels: {
          formatter: (val: number) => this.formatCurrency(val)
        }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3
        }
      },
      colors: ['#e94118', '#059669'],
      tooltip: {
        y: {
          formatter: (val: number) => this.formatCurrency(val)
        }
      },
      grid: {
        borderColor: '#e5e7eb',
        strokeDashArray: 4
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right'
      }
    };

    this.productChartOptions = {
      series: [],
      chart: {
        type: 'donut',
        height: 300
      },
      labels: [],
      colors: ['#e94118', '#f59e0b', '#3498db', '#059669', '#8b5cf6'],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => val.toFixed(1) + '%'
      },
      legend: {
        position: 'bottom'
      },
      tooltip: {
        y: {
          formatter: (val: number) => this.formatCurrency(val)
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%'
          }
        }
      }
    };

    this.statusChartOptions = {
      series: [],
      chart: {
        type: 'pie',
        height: 300
      },
      labels: [],
      colors: ['#3498db', '#059669', '#ef4444'],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => val.toFixed(1) + '%'
      },
      legend: {
        position: 'bottom'
      },
      tooltip: {
        y: {
          formatter: (val: number) => this.formatCurrency(val)
        }
      },
      plotOptions: {
        pie: {
          size: '65%'
        }
      }
    };
  }

  private updateCharts() {
    if (!this.portfolioData) return;

    // Update growth chart
    const months = this.portfolioData.trends.monthlyDisbursements.map(d => d.month);
    this.growthChartOptions = {
      ...this.growthChartOptions,
      series: [
        {
          name: 'Disbursements',
          data: this.portfolioData.trends.monthlyDisbursements.map(d => d.amount)
        },
        {
          name: 'Collections',
          data: this.portfolioData.trends.monthlyCollections.map(d => d.amount)
        }
      ],
      xaxis: {
        categories: months
      }
    };

    // Update product chart
    const productData = this.portfolioData.distribution.byProduct;
    this.productChartOptions = {
      ...this.productChartOptions,
      series: productData.map(p => p.amount),
      labels: productData.map(p => p.product)
    };

    // Update status chart
    const statusData = this.portfolioData.distribution.byStatus;
    this.statusChartOptions = {
      ...this.statusChartOptions,
      series: statusData.map(s => s.amount),
      labels: statusData.map(s => s.status)
    };
  }

  updatePeriod(period: string, event: Event) {
    event.preventDefault();
    this.selectedPeriod = period;
    // In a real app, you would filter data based on period
    this.loadPortfolioData();
  }

  refreshPortfolio() {
    this.loadPortfolioData();
  }

  exportReport() {
    // TODO: Implement export functionality
    console.log('Export portfolio report');
    alert('Export functionality will be implemented');
  }

  formatCurrency(amount: number): string {
    return this.lenderService.formatCurrency(amount);
  }

  formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  getStatusColor(status: string): string {
    return this.lenderService.getStatusColor(status.toLowerCase());
  }
}

