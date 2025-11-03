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

export interface RevenueMetric {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

@Component({
  selector: 'app-revenue-income',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, NgApexchartsModule],
  template: `
    <div class="revenue-income">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Revenue & Income</h1>
          <p class="page-description">Track revenue, income, and financial metrics</p>
        </div>
        <div class="header-actions">
          <div class="period-selector">
            <select [(ngModel)]="selectedPeriod" (change)="updatePeriod()">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month" selected>This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <button class="btn-secondary" (click)="exportReport()">
            <app-feather-icon name="download" size="16px"></app-feather-icon>
            Export
          </button>
        </div>
      </div>

      <!-- Revenue Overview -->
      <div class="revenue-overview" *ngIf="revenueMetrics.length > 0">
        <div class="revenue-card total">
          <div class="revenue-icon">
            <app-feather-icon name="dollar-sign" size="24px"></app-feather-icon>
          </div>
          <div class="revenue-content">
            <div class="revenue-label">Total Revenue</div>
            <div class="revenue-value">{{ formatCurrency(totalRevenue) }}</div>
            <div class="revenue-change positive">
              <app-feather-icon name="trending-up" size="14px"></app-feather-icon>
              <span>+12.5% from last period</span>
            </div>
          </div>
        </div>

        <div class="revenue-card" *ngFor="let metric of revenueMetrics">
          <div class="revenue-content">
            <div class="revenue-label">{{ metric.category }}</div>
            <div class="revenue-value">{{ formatCurrency(metric.amount) }}</div>
            <div class="revenue-percentage">{{ metric.percentage }}% of total</div>
            <div class="revenue-trend" [class]="metric.trend">
              <app-feather-icon 
                [name]="metric.trend === 'up' ? 'trending-up' : metric.trend === 'down' ? 'trending-down' : 'minus'" 
                size="12px">
              </app-feather-icon>
              <span>{{ formatTrend(metric.trend) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section" *ngIf="revenueChartOptions">
        <div class="chart-container">
          <div class="chart-header">
            <h3>Revenue Trends</h3>
          </div>
          <div class="chart-wrapper">
            <apx-chart
              [series]="revenueChartOptions.series"
              [chart]="revenueChartOptions.chart"
              [xaxis]="revenueChartOptions.xaxis"
              [yaxis]="revenueChartOptions.yaxis"
              [dataLabels]="revenueChartOptions.dataLabels"
              [stroke]="revenueChartOptions.stroke"
              [colors]="revenueChartOptions.colors"
              [tooltip]="revenueChartOptions.tooltip"
              [grid]="revenueChartOptions.grid"
              [legend]="revenueChartOptions.legend"
              [fill]="revenueChartOptions.fill">
            </apx-chart>
          </div>
        </div>

        <div class="chart-container">
          <div class="chart-header">
            <h3>Revenue by Source</h3>
          </div>
          <div class="chart-wrapper">
            <apx-chart
              [series]="revenueSourceChartOptions.series"
              [chart]="revenueSourceChartOptions.chart"
              [labels]="revenueSourceChartOptions.labels"
              [colors]="revenueSourceChartOptions.colors"
              [dataLabels]="revenueSourceChartOptions.dataLabels"
              [legend]="revenueSourceChartOptions.legend"
              [tooltip]="revenueSourceChartOptions.tooltip"
              [plotOptions]="revenueSourceChartOptions.plotOptions">
            </apx-chart>
          </div>
        </div>
      </div>

      <!-- Income Breakdown -->
      <div class="income-section">
        <div class="section-header">
          <h3>Income Breakdown</h3>
        </div>
        <div class="income-grid">
          <div class="income-card">
            <div class="income-icon">
              <app-feather-icon name="percent" size="20px"></app-feather-icon>
            </div>
            <div class="income-content">
              <div class="income-label">Interest Income</div>
              <div class="income-value">{{ formatCurrency(interestIncome) }}</div>
              <div class="income-description">From loan interest payments</div>
            </div>
          </div>

          <div class="income-card">
            <div class="income-icon">
              <app-feather-icon name="file-text" size="20px"></app-feather-icon>
            </div>
            <div class="income-content">
              <div class="income-label">Fee Income</div>
              <div class="income-value">{{ formatCurrency(feeIncome) }}</div>
              <div class="income-description">From processing and late fees</div>
            </div>
          </div>

          <div class="income-card">
            <div class="income-icon">
              <app-feather-icon name="credit-card" size="20px"></app-feather-icon>
            </div>
            <div class="income-content">
              <div class="income-label">Penalty Income</div>
              <div class="income-value">{{ formatCurrency(penaltyIncome) }}</div>
              <div class="income-description">From late payment penalties</div>
            </div>
          </div>

          <div class="income-card">
            <div class="income-icon">
              <app-feather-icon name="trending-up" size="20px"></app-feather-icon>
            </div>
            <div class="income-content">
              <div class="income-label">Net Income</div>
              <div class="income-value">{{ formatCurrency(netIncome) }}</div>
              <div class="income-description">Total income minus expenses</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Financial Metrics -->
      <div class="metrics-section">
        <div class="section-header">
          <h3>Financial Metrics</h3>
        </div>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">ROI (Return on Investment)</div>
            <div class="metric-value">{{ roi }}%</div>
            <div class="metric-description">Return on loan portfolio investment</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Profit Margin</div>
            <div class="metric-value">{{ profitMargin }}%</div>
            <div class="metric-description">Profit as percentage of revenue</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Average Interest Rate</div>
            <div class="metric-value">{{ averageInterestRate }}%</div>
            <div class="metric-description">Weighted average interest rate</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Collection Efficiency</div>
            <div class="metric-value">{{ collectionEfficiency }}%</div>
            <div class="metric-description">Percentage of payments collected on time</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./revenue-income.component.scss']
})
export class RevenueIncomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  revenueMetrics: RevenueMetric[] = [];
  totalRevenue = 0;
  interestIncome = 0;
  feeIncome = 0;
  penaltyIncome = 0;
  netIncome = 0;
  roi = 0;
  profitMargin = 0;
  averageInterestRate = 0;
  collectionEfficiency = 0;
  
  selectedPeriod = 'month';
  
  revenueChartOptions: any = {};
  revenueSourceChartOptions: any = {};

  constructor(private lenderService: LenderService) {}

  ngOnInit() {
    this.loadRevenueData();
    this.initializeCharts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRevenueData() {
    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loans => {
        this.calculateRevenue(loans);
        this.calculateIncome(loans);
        this.calculateMetrics(loans);
        this.updateCharts();
      });
  }

  private calculateRevenue(loans: ActiveLoan[]) {
    const interestRevenue = loans.reduce((sum, loan) => {
      const monthsPaid = loan.paymentsCompleted;
      return sum + (loan.monthlyPayment * monthsPaid * (loan.interestRate / 100 / 12));
    }, 0);

    const principalRevenue = loans.reduce((sum, loan) => sum + loan.totalPaid, 0);
    const feeRevenue = loans.length * 50000; // Mock fees
    const penaltyRevenue = loans
      .filter(loan => loan.daysPastDue > 0)
      .reduce((sum, loan) => sum + (loan.daysPastDue * 1000), 0);

    this.totalRevenue = interestRevenue + principalRevenue + feeRevenue + penaltyRevenue;

    this.revenueMetrics = [
      {
        category: 'Interest Revenue',
        amount: interestRevenue,
        percentage: (interestRevenue / this.totalRevenue) * 100,
        trend: 'up'
      },
      {
        category: 'Principal Repayment',
        amount: principalRevenue,
        percentage: (principalRevenue / this.totalRevenue) * 100,
        trend: 'stable'
      },
      {
        category: 'Fee Revenue',
        amount: feeRevenue,
        percentage: (feeRevenue / this.totalRevenue) * 100,
        trend: 'up'
      },
      {
        category: 'Penalty Revenue',
        amount: penaltyRevenue,
        percentage: (penaltyRevenue / this.totalRevenue) * 100,
        trend: 'down'
      }
    ];
  }

  private calculateIncome(loans: ActiveLoan[]) {
    this.interestIncome = loans.reduce((sum, loan) => {
      const monthsPaid = loan.paymentsCompleted;
      return sum + (loan.monthlyPayment * monthsPaid * (loan.interestRate / 100 / 12));
    }, 0);

    this.feeIncome = loans.length * 50000;
    this.penaltyIncome = loans
      .filter(loan => loan.daysPastDue > 0)
      .reduce((sum, loan) => sum + (loan.daysPastDue * 1000), 0);

    const expenses = this.totalRevenue * 0.15; // 15% expenses
    this.netIncome = this.interestIncome + this.feeIncome + this.penaltyIncome - expenses;
  }

  private calculateMetrics(loans: ActiveLoan[]) {
    const totalInvested = loans.reduce((sum, loan) => sum + loan.disbursedAmount, 0);
    this.roi = totalInvested > 0 ? (this.netIncome / totalInvested) * 100 : 0;
    this.profitMargin = this.totalRevenue > 0 ? (this.netIncome / this.totalRevenue) * 100 : 0;
    
    this.averageInterestRate = loans.length > 0
      ? loans.reduce((sum, loan) => sum + loan.interestRate, 0) / loans.length
      : 0;

    const onTimePayments = loans.filter(loan => loan.daysPastDue === 0).length;
    this.collectionEfficiency = loans.length > 0 ? (onTimePayments / loans.length) * 100 : 0;
  }

  private initializeCharts() {
    this.revenueChartOptions = {
      series: [],
      chart: {
        type: 'area',
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
      colors: ['#e94118'],
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
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3
        }
      }
    };

    this.revenueSourceChartOptions = {
      series: [],
      chart: {
        type: 'donut',
        height: 350
      },
      labels: [],
      colors: ['#e94118', '#3b82f6', '#f59e0b', '#059669'],
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
  }

  private updateCharts() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueData = months.map(() => this.totalRevenue / 12 + (Math.random() * 500000 - 250000));

    this.revenueChartOptions = {
      ...this.revenueChartOptions,
      series: [{ name: 'Revenue', data: revenueData }],
      xaxis: { categories: months }
    };

    this.revenueSourceChartOptions = {
      ...this.revenueSourceChartOptions,
      series: this.revenueMetrics.map(m => m.amount),
      labels: this.revenueMetrics.map(m => m.category)
    };
  }

  updatePeriod() {
    this.loadRevenueData();
  }

  exportReport() {
    console.log('Export revenue report');
    alert('Export functionality will be implemented');
  }

  formatCurrency(amount: number): string {
    return this.lenderService.formatCurrency(amount);
  }

  formatTrend(trend: string): string {
    return trend.charAt(0).toUpperCase() + trend.slice(1);
  }
}

