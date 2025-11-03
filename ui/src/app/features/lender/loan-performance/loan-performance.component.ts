import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexYAxis,
  ApexLegend,
  ApexFill,
  ApexTooltip,
} from 'ng-apexcharts';
import { LenderService, ActiveLoan } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

export interface PerformanceMetrics {
  repaymentRate: number;
  onTimePaymentRate: number;
  averageDaysToRepay: number;
  collectionEfficiency: number;
  portfolioQuality: string;
  nplRatio: number; // Non-Performing Loan ratio
  recoveryRate: number;
}

@Component({
  selector: 'app-loan-performance',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, NgApexchartsModule],
  template: `
    <div class="loan-performance">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Loan Performance</h1>
          <p class="page-description">Detailed analytics and trends for loan performance metrics</p>
        </div>
        <div class="header-actions">
          <select class="period-select" [(ngModel)]="selectedPeriod" (change)="updateData()">
            <option value="30D">Last 30 Days</option>
            <option value="90D">Last 90 Days</option>
            <option value="6M">Last 6 Months</option>
            <option value="12M">Last 12 Months</option>
            <option value="ALL">All Time</option>
          </select>
          <button class="btn-primary" (click)="refreshData()">
            <app-feather-icon name="refresh-cw" size="16px"></app-feather-icon>
            Refresh
          </button>
        </div>
      </div>

      <!-- Performance Metrics Cards -->
      <div class="metrics-grid" *ngIf="performanceMetrics">
        <div class="metric-card" [class.excellent]="performanceMetrics.repaymentRate >= 90" [class.good]="performanceMetrics.repaymentRate >= 75 && performanceMetrics.repaymentRate < 90">
          <div class="metric-icon">
            <app-feather-icon name="check-circle" size="24px"></app-feather-icon>
          </div>
          <div class="metric-content">
            <div class="metric-label">Repayment Rate</div>
            <div class="metric-value">{{ performanceMetrics.repaymentRate.toFixed(1) }}%</div>
            <div class="metric-trend">
              <app-feather-icon name="trending-up" size="14px"></app-feather-icon>
              <span>+2.5% vs last period</span>
            </div>
          </div>
        </div>

        <div class="metric-card" [class.excellent]="performanceMetrics.onTimePaymentRate >= 85" [class.good]="performanceMetrics.onTimePaymentRate >= 70 && performanceMetrics.onTimePaymentRate < 85">
          <div class="metric-icon">
            <app-feather-icon name="clock" size="24px"></app-feather-icon>
          </div>
          <div class="metric-content">
            <div class="metric-label">On-Time Payment Rate</div>
            <div class="metric-value">{{ performanceMetrics.onTimePaymentRate.toFixed(1) }}%</div>
            <div class="metric-trend">
              <app-feather-icon name="trending-up" size="14px"></app-feather-icon>
              <span>+1.8% vs last period</span>
            </div>
          </div>
        </div>

        <div class="metric-card" [class.warning]="performanceMetrics.averageDaysToRepay > 35">
          <div class="metric-icon">
            <app-feather-icon name="calendar" size="24px"></app-feather-icon>
          </div>
          <div class="metric-content">
            <div class="metric-label">Avg Days to Repay</div>
            <div class="metric-value">{{ performanceMetrics.averageDaysToRepay.toFixed(0) }} days</div>
            <div class="metric-trend">
              <app-feather-icon name="trending-down" size="14px"></app-feather-icon>
              <span>-3 days vs last period</span>
            </div>
          </div>
        </div>

        <div class="metric-card" [class.excellent]="performanceMetrics.collectionEfficiency >= 90">
          <div class="metric-icon">
            <app-feather-icon name="target" size="24px"></app-feather-icon>
          </div>
          <div class="metric-content">
            <div class="metric-label">Collection Efficiency</div>
            <div class="metric-value">{{ performanceMetrics.collectionEfficiency.toFixed(1) }}%</div>
            <div class="metric-trend">
              <app-feather-icon name="trending-up" size="14px"></app-feather-icon>
              <span>+4.2% vs last period</span>
            </div>
          </div>
        </div>

        <div class="metric-card" [class.danger]="performanceMetrics.nplRatio > 5">
          <div class="metric-icon">
            <app-feather-icon name="alert-triangle" size="24px"></app-feather-icon>
          </div>
          <div class="metric-content">
            <div class="metric-label">NPL Ratio</div>
            <div class="metric-value">{{ performanceMetrics.nplRatio.toFixed(2) }}%</div>
            <div class="metric-trend">
              <app-feather-icon name="trending-down" size="14px"></app-feather-icon>
              <span>-0.5% vs last period</span>
            </div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <app-feather-icon name="repeat" size="24px"></app-feather-icon>
          </div>
          <div class="metric-content">
            <div class="metric-label">Recovery Rate</div>
            <div class="metric-value">{{ performanceMetrics.recoveryRate.toFixed(1) }}%</div>
            <div class="metric-trend">
              <app-feather-icon name="trending-up" size="14px"></app-feather-icon>
              <span>+2.1% vs last period</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Charts -->
      <div class="charts-section" *ngIf="performanceMetrics">
        <!-- Repayment Trend Chart -->
        <div class="chart-container">
          <div class="chart-header">
            <h3>Repayment Performance Trend</h3>
            <div class="chart-legend">
              <div class="legend-item">
                <span class="legend-color" style="background: #e94118"></span>
                <span>Expected</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: #059669"></span>
                <span>Actual</span>
              </div>
            </div>
          </div>
          <div class="chart-wrapper">
            <apx-chart
              [series]="repaymentChartOptions.series"
              [chart]="repaymentChartOptions.chart"
              [xaxis]="repaymentChartOptions.xaxis"
              [yaxis]="repaymentChartOptions.yaxis"
              [dataLabels]="repaymentChartOptions.dataLabels"
              [stroke]="repaymentChartOptions.stroke"
              [fill]="repaymentChartOptions.fill"
              [colors]="repaymentChartOptions.colors"
              [tooltip]="repaymentChartOptions.tooltip"
              [grid]="repaymentChartOptions.grid"
              [legend]="repaymentChartOptions.legend">
            </apx-chart>
          </div>
        </div>

        <!-- Performance Comparison Charts -->
        <div class="charts-row">
          <!-- Collection Efficiency by Product -->
          <div class="chart-container small">
            <div class="chart-header">
              <h3>Collection Efficiency by Product</h3>
            </div>
            <div class="chart-wrapper">
              <apx-chart
                [series]="productEfficiencyChartOptions.series"
                [chart]="productEfficiencyChartOptions.chart"
                [xaxis]="productEfficiencyChartOptions.xaxis"
                [yaxis]="productEfficiencyChartOptions.yaxis"
                [dataLabels]="productEfficiencyChartOptions.dataLabels"
                [colors]="productEfficiencyChartOptions.colors"
                [tooltip]="productEfficiencyChartOptions.tooltip"
                [plotOptions]="productEfficiencyChartOptions.plotOptions">
              </apx-chart>
            </div>
          </div>

          <!-- Payment Status Distribution -->
          <div class="chart-container small">
            <div class="chart-header">
              <h3>Payment Status Distribution</h3>
            </div>
            <div class="chart-wrapper">
              <apx-chart
                [series]="paymentStatusChartOptions.series"
                [chart]="paymentStatusChartOptions.chart"
                [labels]="paymentStatusChartOptions.labels"
                [colors]="paymentStatusChartOptions.colors"
                [dataLabels]="paymentStatusChartOptions.dataLabels"
                [legend]="paymentStatusChartOptions.legend"
                [tooltip]="paymentStatusChartOptions.tooltip"
                [plotOptions]="paymentStatusChartOptions.plotOptions">
              </apx-chart>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Table -->
      <div class="performance-table-section">
        <div class="table-card">
          <div class="table-header">
            <h3>Product Performance Summary</h3>
          </div>
          <div class="table-content">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Active Loans</th>
                  <th>Total Disbursed</th>
                  <th>Collected</th>
                  <th>Outstanding</th>
                  <th>Repayment Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let product of productPerformance">
                  <td class="product-name">{{ product.product }}</td>
                  <td>{{ product.activeLoans }}</td>
                  <td>{{ formatCurrency(product.totalDisbursed) }}</td>
                  <td>{{ formatCurrency(product.collected) }}</td>
                  <td>{{ formatCurrency(product.outstanding) }}</td>
                  <td>
                    <div class="rate-cell">
                      <span class="rate-value">{{ product.repaymentRate.toFixed(1) }}%</span>
                      <div class="rate-bar">
                        <div class="rate-fill" [style.width.%]="product.repaymentRate" 
                             [class.excellent]="product.repaymentRate >= 90"
                             [class.good]="product.repaymentRate >= 75 && product.repaymentRate < 90"
                             [class.warning]="product.repaymentRate >= 60 && product.repaymentRate < 75"
                             [class.danger]="product.repaymentRate < 60">
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="status-badge" [class]="getPerformanceStatus(product.repaymentRate)">
                      {{ getPerformanceStatusLabel(product.repaymentRate) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <app-feather-icon name="loader" size="32px"></app-feather-icon>
        <p>Loading performance data...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="errorMessage">
        <app-feather-icon name="alert-circle" size="32px"></app-feather-icon>
        <h3>Failed to Load Performance Data</h3>
        <p>{{ errorMessage }}</p>
        <button class="btn-primary" (click)="refreshData()">Retry</button>
      </div>
    </div>
  `,
  styleUrls: ['./loan-performance.component.scss']
})
export class LoanPerformanceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  performanceMetrics: PerformanceMetrics | null = null;
  productPerformance: Array<{
    product: string;
    activeLoans: number;
    totalDisbursed: number;
    collected: number;
    outstanding: number;
    repaymentRate: number;
  }> = [];
  
  isLoading = false;
  errorMessage = '';
  selectedPeriod = '12M';

  // Chart options
  repaymentChartOptions: any = {};
  productEfficiencyChartOptions: any = {};
  paymentStatusChartOptions: any = {};

  constructor(private lenderService: LenderService) {}

  ngOnInit() {
    this.loadPerformanceData();
    this.initializeCharts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPerformanceData() {
    this.isLoading = true;
    this.errorMessage = '';

    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (loans) => {
          this.performanceMetrics = this.calculatePerformanceMetrics(loans);
          this.productPerformance = this.calculateProductPerformance(loans);
          this.updateCharts();
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load performance data. Please try again.';
          this.isLoading = false;
          console.error('Performance load error:', error);
        }
      });
  }

  private calculatePerformanceMetrics(loans: ActiveLoan[]): PerformanceMetrics {
    const totalExpected = loans.reduce((sum, loan) => sum + (loan.monthlyPayment * loan.termMonths), 0);
    const totalCollected = loans.reduce((sum, loan) => sum + loan.totalPaid, 0);
    const repaymentRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    // On-time payment rate (mock calculation)
    const onTimeLoans = loans.filter(loan => loan.daysPastDue === 0).length;
    const onTimePaymentRate = loans.length > 0 ? (onTimeLoans / loans.length) * 100 : 0;

    // Average days to repay (mock)
    const averageDaysToRepay = 28.5;

    // Collection efficiency (mock)
    const collectionEfficiency = 87.5;

    // NPL Ratio (Non-Performing Loans)
    const nplLoans = loans.filter(loan => loan.status === 'defaulted' || loan.daysPastDue > 90).length;
    const nplRatio = loans.length > 0 ? (nplLoans / loans.length) * 100 : 0;

    // Recovery rate (mock)
    const recoveryRate = 72.3;

    let portfolioQuality = 'Good';
    if (nplRatio > 5) portfolioQuality = 'Poor';
    else if (nplRatio > 3) portfolioQuality = 'Fair';
    else if (nplRatio < 1) portfolioQuality = 'Excellent';

    return {
      repaymentRate,
      onTimePaymentRate,
      averageDaysToRepay,
      collectionEfficiency,
      portfolioQuality,
      nplRatio,
      recoveryRate
    };
  }

  private calculateProductPerformance(loans: ActiveLoan[]) {
    const productMap = new Map<string, {
      activeLoans: number;
      totalDisbursed: number;
      collected: number;
      outstanding: number;
    }>();

    loans.forEach(loan => {
      const existing = productMap.get(loan.productName) || {
        activeLoans: 0,
        totalDisbursed: 0,
        collected: 0,
        outstanding: 0
      };

      productMap.set(loan.productName, {
        activeLoans: existing.activeLoans + (loan.status === 'active' ? 1 : 0),
        totalDisbursed: existing.totalDisbursed + loan.disbursedAmount,
        collected: existing.collected + loan.totalPaid,
        outstanding: existing.outstanding + loan.outstandingBalance
      });
    });

    return Array.from(productMap.entries()).map(([product, data]) => {
      const expected = data.totalDisbursed * 1.2; // Assume 20% interest
      const repaymentRate = expected > 0 ? (data.collected / expected) * 100 : 0;

      return {
        product,
        activeLoans: data.activeLoans,
        totalDisbursed: data.totalDisbursed,
        collected: data.collected,
        outstanding: data.outstanding,
        repaymentRate: Math.min(repaymentRate, 100)
      };
    });
  }

  private initializeCharts() {
    // Repayment Trend Chart
    this.repaymentChartOptions = {
      series: [
        { name: 'Expected', data: [] },
        { name: 'Actual', data: [] }
      ],
      chart: {
        type: 'line',
        height: 350,
        toolbar: { show: false }
      },
      xaxis: { categories: [] },
      yaxis: {
        labels: {
          formatter: (val: number) => this.formatCurrency(val)
        }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } },
      colors: ['#e94118', '#059669'],
      tooltip: {
        y: { formatter: (val: number) => this.formatCurrency(val) }
      },
      grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
      legend: { position: 'top', horizontalAlign: 'right' }
    };

    // Product Efficiency Chart
    this.productEfficiencyChartOptions = {
      series: [{ data: [] }],
      chart: { type: 'bar', height: 300 },
      xaxis: { categories: [] },
      yaxis: {
        max: 100,
        labels: { formatter: (val: number) => val.toFixed(0) + '%' }
      },
      colors: ['#e94118'],
      dataLabels: { enabled: true, formatter: (val: number) => val.toFixed(1) + '%' },
      tooltip: { y: { formatter: (val: number) => val.toFixed(1) + '%' } },
      plotOptions: { bar: { horizontal: true, borderRadius: 4 } }
    };

    // Payment Status Chart
    this.paymentStatusChartOptions = {
      series: [],
      chart: { type: 'donut', height: 300 },
      labels: [],
      colors: ['#059669', '#f59e0b', '#ef4444'],
      dataLabels: { enabled: true, formatter: (val: number) => val.toFixed(1) + '%' },
      legend: { position: 'bottom' },
      tooltip: { y: { formatter: (val: number) => val.toFixed(1) + '%' } },
      plotOptions: { pie: { donut: { size: '65%' } } }
    };
  }

  private updateCharts() {
    if (!this.performanceMetrics) return;

    // Mock monthly data for repayment trend
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const expectedData = months.map(() => 5000000 + Math.random() * 2000000);
    const actualData = expectedData.map((val, i) => val * (0.85 + Math.random() * 0.1));

    this.repaymentChartOptions = {
      ...this.repaymentChartOptions,
      series: [
        { name: 'Expected', data: expectedData },
        { name: 'Actual', data: actualData }
      ],
      xaxis: { categories: months }
    };

    // Update product efficiency chart
    const productData = this.productPerformance;
    this.productEfficiencyChartOptions = {
      ...this.productEfficiencyChartOptions,
      series: [{ data: productData.map(p => p.repaymentRate) }],
      xaxis: { categories: productData.map(p => p.product) }
    };

    // Update payment status chart
    this.paymentStatusChartOptions = {
      ...this.paymentStatusChartOptions,
      series: [65, 25, 10], // Mock: Current, Late, Overdue
      labels: ['Current', 'Late', 'Overdue']
    };
  }

  updateData() {
    this.loadPerformanceData();
  }

  refreshData() {
    this.loadPerformanceData();
  }

  formatCurrency(amount: number): string {
    return this.lenderService.formatCurrency(amount);
  }

  getPerformanceStatus(rate: number): string {
    if (rate >= 90) return 'excellent';
    if (rate >= 75) return 'good';
    if (rate >= 60) return 'warning';
    return 'danger';
  }

  getPerformanceStatusLabel(rate: number): string {
    if (rate >= 90) return 'Excellent';
    if (rate >= 75) return 'Good';
    if (rate >= 60) return 'Fair';
    return 'Poor';
  }
}

