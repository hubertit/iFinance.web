import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { NgApexchartsModule } from 'ng-apexcharts';

export interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
}

@Component({
  selector: 'app-performance-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, NgApexchartsModule],
  template: `
    <div class="performance-reports">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Performance Reports</h1>
          <p class="page-description">Performance analytics and reporting tools</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="exportReport()">
            <app-feather-icon name="download" size="16px"></app-feather-icon>
            Export
          </button>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="metrics-section">
        <div class="section-header">
          <h3>Key Performance Indicators</h3>
        </div>
        <div class="metrics-grid">
          <div class="metric-card" *ngFor="let metric of performanceMetrics">
            <div class="metric-header">
              <div class="metric-name">{{ metric.name }}</div>
              <div class="metric-trend" [class]="metric.trend">
                <app-feather-icon 
                  [name]="metric.trend === 'up' ? 'trending-up' : metric.trend === 'down' ? 'trending-down' : 'minus'" 
                  size="14px">
                </app-feather-icon>
              </div>
            </div>
            <div class="metric-value">{{ metric.value }}%</div>
            <div class="metric-target">Target: {{ metric.target }}%</div>
            <div class="metric-bar">
              <div class="metric-fill" [style.width.%]="(metric.value / metric.target) * 100" [class]="getMetricStatus(metric)"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Report Templates -->
      <div class="reports-section">
        <div class="section-header">
          <h3>Performance Report Templates</h3>
          <p class="section-description">Select a performance report to generate</p>
        </div>

        <div class="reports-list">
          <div class="report-item" *ngFor="let report of reportTemplates" (click)="generateReport(report)">
            <div class="report-info">
              <div class="report-icon">
                <app-feather-icon name="file-text" size="20px"></app-feather-icon>
              </div>
              <div class="report-details">
                <h4>{{ report.name }}</h4>
                <p>{{ report.description }}</p>
              </div>
            </div>
            <div class="report-action">
              <app-feather-icon name="chevron-right" size="20px"></app-feather-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./performance-reports.component.scss']
})
export class PerformanceReportsComponent implements OnInit {
  performanceMetrics: PerformanceMetric[] = [
    { name: 'Collection Rate', value: 92.5, target: 95, trend: 'up' },
    { name: 'On-Time Payment', value: 87.3, target: 90, trend: 'up' },
    { name: 'Portfolio Quality', value: 85.2, target: 88, trend: 'stable' },
    { name: 'Customer Satisfaction', value: 89.1, target: 92, trend: 'down' },
    { name: 'Processing Efficiency', value: 94.6, target: 95, trend: 'up' },
    { name: 'Risk Management', value: 91.8, target: 93, trend: 'stable' }
  ];

  reportTemplates = [
    {
      id: 'PERF-001',
      name: 'Monthly Performance Summary',
      description: 'Comprehensive monthly performance metrics and analysis'
    },
    {
      id: 'PERF-002',
      name: 'Collection Performance Report',
      description: 'Detailed collection rates and payment trends'
    },
    {
      id: 'PERF-003',
      name: 'Portfolio Quality Analysis',
      description: 'Assessment of loan portfolio quality and risk factors'
    },
    {
      id: 'PERF-004',
      name: 'Operational Efficiency Report',
      description: 'Analysis of operational processes and efficiency metrics'
    }
  ];

  ngOnInit() {}

  generateReport(report: any) {
    console.log('Generate performance report:', report.id);
    alert(`Generating ${report.name}...`);
  }

  exportReport() {
    console.log('Export performance report');
    alert('Export functionality will be implemented');
  }

  getMetricStatus(metric: PerformanceMetric): string {
    const percentage = (metric.value / metric.target) * 100;
    if (percentage >= 100) return 'excellent';
    if (percentage >= 90) return 'good';
    if (percentage >= 75) return 'fair';
    return 'poor';
  }
}

