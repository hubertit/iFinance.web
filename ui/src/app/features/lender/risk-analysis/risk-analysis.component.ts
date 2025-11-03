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
import { LenderService, ActiveLoan, LoanApplication } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

export interface RiskMetric {
  category: string;
  value: number;
  threshold: number;
  status: 'low' | 'medium' | 'high' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

@Component({
  selector: 'app-risk-analysis',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, NgApexchartsModule],
  template: `
    <div class="risk-analysis">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Risk Analysis</h1>
          <p class="page-description">Comprehensive risk assessment and analysis for your loan portfolio</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="exportReport()">
            <app-feather-icon name="download" size="16px"></app-feather-icon>
            Export Report
          </button>
          <button class="btn-primary" (click)="refreshAnalysis()">
            <app-feather-icon name="refresh-cw" size="16px"></app-feather-icon>
            Refresh
          </button>
        </div>
      </div>

      <!-- Risk Overview -->
      <div class="risk-overview" *ngIf="riskMetrics.length > 0">
        <div class="risk-card" *ngFor="let metric of riskMetrics" [class]="metric.status">
          <div class="risk-icon">
            <app-feather-icon [name]="getRiskIcon(metric.status)" size="24px"></app-feather-icon>
          </div>
          <div class="risk-content">
            <div class="risk-label">{{ metric.category }}</div>
            <div class="risk-value">{{ metric.value.toFixed(2) }}%</div>
            <div class="risk-threshold">Threshold: {{ metric.threshold }}%</div>
            <div class="risk-trend" [class]="metric.trend">
              <app-feather-icon [name]="metric.trend === 'up' ? 'trending-up' : metric.trend === 'down' ? 'trending-down' : 'minus'" size="14px"></app-feather-icon>
              <span>{{ getTrendLabel(metric.trend) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Risk Charts -->
      <div class="charts-section" *ngIf="riskMetrics.length > 0">
        <div class="chart-container">
          <div class="chart-header">
            <h3>Risk Distribution by Category</h3>
          </div>
          <div class="chart-wrapper">
            <apx-chart
              [series]="riskDistributionChartOptions.series"
              [chart]="riskDistributionChartOptions.chart"
              [labels]="riskDistributionChartOptions.labels"
              [colors]="riskDistributionChartOptions.colors"
              [dataLabels]="riskDistributionChartOptions.dataLabels"
              [legend]="riskDistributionChartOptions.legend"
              [tooltip]="riskDistributionChartOptions.tooltip"
              [plotOptions]="riskDistributionChartOptions.plotOptions">
            </apx-chart>
          </div>
        </div>

        <div class="chart-container">
          <div class="chart-header">
            <h3>Risk Trend Analysis</h3>
          </div>
          <div class="chart-wrapper">
            <apx-chart
              [series]="riskTrendChartOptions.series"
              [chart]="riskTrendChartOptions.chart"
              [xaxis]="riskTrendChartOptions.xaxis"
              [yaxis]="riskTrendChartOptions.yaxis"
              [dataLabels]="riskTrendChartOptions.dataLabels"
              [stroke]="riskTrendChartOptions.stroke"
              [colors]="riskTrendChartOptions.colors"
              [tooltip]="riskTrendChartOptions.tooltip"
              [grid]="riskTrendChartOptions.grid"
              [legend]="riskTrendChartOptions.legend">
            </apx-chart>
          </div>
        </div>
      </div>

      <!-- Risk Assessment Table -->
      <div class="risk-assessment-section">
        <div class="assessment-card">
          <div class="assessment-header">
            <h3>Portfolio Risk Assessment</h3>
          </div>
          <div class="assessment-content">
            <div class="assessment-summary">
              <div class="summary-item">
                <div class="summary-label">Overall Risk Score</div>
                <div class="summary-value" [class]="getOverallRiskClass()">{{ overallRiskScore.toFixed(1) }}%</div>
                <div class="summary-status" [class]="getOverallRiskClass()">{{ getOverallRiskLabel() }}</div>
              </div>
            </div>

            <div class="risk-breakdown">
              <h4>Risk Breakdown</h4>
              <div class="breakdown-list">
                <div class="breakdown-item" *ngFor="let metric of riskMetrics">
                  <div class="breakdown-info">
                    <span class="breakdown-name">{{ metric.category }}</span>
                    <span class="breakdown-value">{{ metric.value.toFixed(2) }}%</span>
                  </div>
                  <div class="breakdown-bar">
                    <div class="breakdown-fill" 
                         [style.width.%]="(metric.value / 100) * 100"
                         [class]="metric.status">
                    </div>
                  </div>
                  <div class="breakdown-status">
                    <span class="status-badge" [class]="metric.status">
                      {{ formatStatus(metric.status) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Risk Recommendations -->
      <div class="recommendations-section" *ngIf="recommendations.length > 0">
        <h3>Risk Mitigation Recommendations</h3>
        <div class="recommendations-list">
          <div class="recommendation-item" *ngFor="let rec of recommendations">
            <div class="recommendation-icon" [class]="rec.priority">
              <app-feather-icon [name]="rec.priority === 'high' ? 'alert-triangle' : 'info'" size="20px"></app-feather-icon>
            </div>
            <div class="recommendation-content">
              <div class="recommendation-title">{{ rec.title }}</div>
              <div class="recommendation-description">{{ rec.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <app-feather-icon name="loader" size="32px"></app-feather-icon>
        <p>Analyzing risk data...</p>
      </div>
    </div>
  `,
  styleUrls: ['./risk-analysis.component.scss']
})
export class RiskAnalysisComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  riskMetrics: RiskMetric[] = [];
  recommendations: Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }> = [];
  overallRiskScore = 0;
  isLoading = false;

  // Chart options
  riskDistributionChartOptions: any = {};
  riskTrendChartOptions: any = {};

  constructor(private lenderService: LenderService) {}

  ngOnInit() {
    this.loadRiskAnalysis();
    this.initializeCharts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRiskAnalysis() {
    this.isLoading = true;

    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loans => {
        this.riskMetrics = this.calculateRiskMetrics(loans);
        this.overallRiskScore = this.calculateOverallRisk();
        this.recommendations = this.generateRecommendations();
        this.updateCharts();
        this.isLoading = false;
      });
  }

  private calculateRiskMetrics(loans: ActiveLoan[]): RiskMetric[] {
    const totalLoans = loans.length;
    if (totalLoans === 0) return [];

    const defaultRate = (loans.filter(l => l.status === 'defaulted').length / totalLoans) * 100;
    const delinquencyRate = (loans.filter(l => l.daysPastDue > 0).length / totalLoans) * 100;
    const highRiskLoans = (loans.filter(l => l.daysPastDue > 60).length / totalLoans) * 100;
    const concentrationRisk = this.calculateConcentrationRisk(loans);

    return [
      {
        category: 'Default Rate',
        value: defaultRate,
        threshold: 5,
        status: defaultRate < 3 ? 'low' : defaultRate < 5 ? 'medium' : defaultRate < 8 ? 'high' : 'critical',
        trend: defaultRate > 4 ? 'up' : 'down'
      },
      {
        category: 'Delinquency Rate',
        value: delinquencyRate,
        threshold: 10,
        status: delinquencyRate < 5 ? 'low' : delinquencyRate < 10 ? 'medium' : delinquencyRate < 15 ? 'high' : 'critical',
        trend: delinquencyRate > 8 ? 'up' : 'stable'
      },
      {
        category: 'High Risk Exposure',
        value: highRiskLoans,
        threshold: 5,
        status: highRiskLoans < 2 ? 'low' : highRiskLoans < 5 ? 'medium' : highRiskLoans < 10 ? 'high' : 'critical',
        trend: highRiskLoans > 4 ? 'up' : 'stable'
      },
      {
        category: 'Concentration Risk',
        value: concentrationRisk,
        threshold: 30,
        status: concentrationRisk < 20 ? 'low' : concentrationRisk < 30 ? 'medium' : concentrationRisk < 40 ? 'high' : 'critical',
        trend: 'stable'
      }
    ];
  }

  private calculateConcentrationRisk(loans: ActiveLoan[]): number {
    // Calculate how much of the portfolio is concentrated in top products
    const totalPortfolio = loans.reduce((sum, loan) => sum + loan.outstandingBalance, 0);
    const productGroups = new Map<string, number>();
    
    loans.forEach(loan => {
      const existing = productGroups.get(loan.productName) || 0;
      productGroups.set(loan.productName, existing + loan.outstandingBalance);
    });

    const topProduct = Array.from(productGroups.values()).sort((a, b) => b - a)[0] || 0;
    return totalPortfolio > 0 ? (topProduct / totalPortfolio) * 100 : 0;
  }

  private calculateOverallRisk(): number {
    if (this.riskMetrics.length === 0) return 0;
    return this.riskMetrics.reduce((sum, metric) => sum + metric.value, 0) / this.riskMetrics.length;
  }

  private generateRecommendations(): Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }> {
    const recommendations: Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }> = [];

    this.riskMetrics.forEach(metric => {
      if (metric.status === 'critical' || metric.status === 'high') {
        recommendations.push({
          title: `Address High ${metric.category}`,
          description: `${metric.category} is at ${metric.value.toFixed(2)}%, exceeding the ${metric.threshold}% threshold. Immediate action recommended.`,
          priority: metric.status === 'critical' ? 'high' : 'medium'
        });
      }
    });

    if (this.overallRiskScore > 15) {
      recommendations.push({
        title: 'Portfolio Risk Review',
        description: 'Overall portfolio risk is elevated. Consider tightening credit standards and increasing collection efforts.',
        priority: 'high'
      });
    }

    return recommendations;
  }

  private initializeCharts() {
    this.riskDistributionChartOptions = {
      series: [],
      chart: {
        type: 'donut',
        height: 350
      },
      labels: [],
      colors: ['#059669', '#3b82f6', '#f59e0b', '#ef4444'],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => val.toFixed(1) + '%'
      },
      legend: {
        position: 'bottom'
      },
      tooltip: {
        y: {
          formatter: (val: number) => val.toFixed(1) + '%'
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

    this.riskTrendChartOptions = {
      series: [],
      chart: {
        type: 'line',
        height: 350,
        toolbar: { show: false }
      },
      xaxis: {
        categories: []
      },
      yaxis: {
        labels: {
          formatter: (val: number) => val.toFixed(1) + '%'
        }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      colors: ['#ef4444', '#f59e0b', '#3b82f6', '#059669'],
      tooltip: {
        y: {
          formatter: (val: number) => val.toFixed(1) + '%'
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
  }

  private updateCharts() {
    // Update distribution chart
    const statusCounts = {
      low: this.riskMetrics.filter(m => m.status === 'low').length,
      medium: this.riskMetrics.filter(m => m.status === 'medium').length,
      high: this.riskMetrics.filter(m => m.status === 'high').length,
      critical: this.riskMetrics.filter(m => m.status === 'critical').length
    };

    this.riskDistributionChartOptions = {
      ...this.riskDistributionChartOptions,
      series: [statusCounts.low, statusCounts.medium, statusCounts.high, statusCounts.critical],
      labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk']
    };

    // Update trend chart with mock monthly data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendData = this.riskMetrics.map(metric => ({
      name: metric.category,
      data: months.map(() => metric.value + (Math.random() * 5 - 2.5))
    }));

    this.riskTrendChartOptions = {
      ...this.riskTrendChartOptions,
      series: trendData,
      xaxis: { categories: months }
    };
  }

  refreshAnalysis() {
    this.loadRiskAnalysis();
  }

  exportReport() {
    console.log('Export risk analysis report');
    alert('Export functionality will be implemented');
  }

  getRiskIcon(status: string): string {
    switch (status) {
      case 'critical': return 'alert-triangle';
      case 'high': return 'alert-circle';
      case 'medium': return 'clock';
      default: return 'check-circle';
    }
  }

  getTrendLabel(trend: string): string {
    switch (trend) {
      case 'up': return 'Increasing';
      case 'down': return 'Decreasing';
      default: return 'Stable';
    }
  }

  getOverallRiskClass(): string {
    if (this.overallRiskScore < 5) return 'low';
    if (this.overallRiskScore < 10) return 'medium';
    if (this.overallRiskScore < 15) return 'high';
    return 'critical';
  }

  getOverallRiskLabel(): string {
    const riskClass = this.getOverallRiskClass();
    return riskClass.charAt(0).toUpperCase() + riskClass.slice(1) + ' Risk';
  }

  formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

