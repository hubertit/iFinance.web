import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';

export interface ReportTemplate {
  id: string;
  name: string;
  category: 'portfolio' | 'performance' | 'delinquency' | 'financial' | 'custom';
  description: string;
  format: 'pdf' | 'excel' | 'csv';
}

@Component({
  selector: 'app-loan-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent],
  template: `
    <div class="loan-reports">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Loan Reports</h1>
          <p class="page-description">Generate and export loan reports</p>
        </div>
      </div>

      <!-- Report Templates -->
      <div class="reports-section">
        <div class="section-header">
          <h3>Report Templates</h3>
          <p class="section-description">Select a report template to generate</p>
        </div>

        <div class="reports-grid">
          <div class="report-card" *ngFor="let template of reportTemplates" (click)="generateReport(template)">
            <div class="report-icon">
              <app-feather-icon [name]="getReportIcon(template.category)" size="24px"></app-feather-icon>
            </div>
            <div class="report-content">
              <h4>{{ template.name }}</h4>
              <p>{{ template.description }}</p>
              <div class="report-meta">
                <span class="report-category">{{ formatCategory(template.category) }}</span>
                <span class="report-format">{{ template.format.toUpperCase() }}</span>
              </div>
            </div>
            <div class="report-action">
              <app-feather-icon name="download" size="20px"></app-feather-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Report Builder -->
      <div class="custom-report-section">
        <div class="section-header">
          <h3>Custom Report Builder</h3>
          <p class="section-description">Create a custom report with specific parameters</p>
        </div>

        <div class="custom-report-form">
          <div class="form-row">
            <div class="form-group">
              <label for="reportName">Report Name</label>
              <input 
                type="text" 
                id="reportName" 
                [(ngModel)]="customReport.name"
                placeholder="Enter report name"
              />
            </div>

            <div class="form-group">
              <label for="reportFormat">Format</label>
              <select id="reportFormat" [(ngModel)]="customReport.format">
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="dateFrom">From Date</label>
              <input 
                type="date" 
                id="dateFrom" 
                [(ngModel)]="customReport.dateFrom"
              />
            </div>

            <div class="form-group">
              <label for="dateTo">To Date</label>
              <input 
                type="date" 
                id="dateTo" 
                [(ngModel)]="customReport.dateTo"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Include Data</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="customReport.includeLoans" />
                Loan Details
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="customReport.includePayments" />
                Payment History
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="customReport.includeBorrowers" />
                Borrower Information
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="customReport.includeFinancials" />
                Financial Summary
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-secondary" (click)="resetCustomReport()">Reset</button>
            <button class="btn-primary" (click)="generateCustomReport()">
              <app-feather-icon name="file-text" size="16px"></app-feather-icon>
              Generate Report
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Reports -->
      <div class="recent-reports-section" *ngIf="recentReports.length > 0">
        <div class="section-header">
          <h3>Recent Reports</h3>
        </div>

        <div class="recent-reports-list">
          <div class="recent-report-item" *ngFor="let report of recentReports">
            <div class="report-info">
              <div class="report-name">{{ report.name }}</div>
              <div class="report-date">Generated: {{ formatDate(report.generatedAt) }}</div>
            </div>
            <div class="report-actions">
              <button class="btn-small" (click)="downloadReport(report)">
                <app-feather-icon name="download" size="14px"></app-feather-icon>
                Download
              </button>
              <button class="btn-small text-danger" (click)="deleteReport(report)">
                <app-feather-icon name="trash-2" size="14px"></app-feather-icon>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./loan-reports.component.scss']
})
export class LoanReportsComponent implements OnInit {
  reportTemplates: ReportTemplate[] = [
    {
      id: 'PORT-001',
      name: 'Portfolio Summary Report',
      category: 'portfolio',
      description: 'Overview of loan portfolio including totals, distribution, and status',
      format: 'pdf'
    },
    {
      id: 'PERF-001',
      name: 'Loan Performance Report',
      category: 'performance',
      description: 'Detailed performance metrics including repayment rates and trends',
      format: 'excel'
    },
    {
      id: 'DEL-001',
      name: 'Delinquency Report',
      category: 'delinquency',
      description: 'Analysis of overdue loans and collection activities',
      format: 'pdf'
    },
    {
      id: 'FIN-001',
      name: 'Financial Statement',
      category: 'financial',
      description: 'Complete financial statements including income and expenses',
      format: 'excel'
    },
    {
      id: 'APP-001',
      name: 'Loan Applications Report',
      category: 'portfolio',
      description: 'Summary of all loan applications with approval status',
      format: 'excel'
    },
    {
      id: 'PAY-001',
      name: 'Payment Collection Report',
      category: 'performance',
      description: 'Payment collection statistics and trends',
      format: 'csv'
    }
  ];

  recentReports: Array<{
    id: string;
    name: string;
    generatedAt: Date;
    format: string;
  }> = [];

  customReport = {
    name: '',
    format: 'pdf',
    dateFrom: '',
    dateTo: '',
    includeLoans: true,
    includePayments: true,
    includeBorrowers: false,
    includeFinancials: false
  };

  ngOnInit() {
    // Load recent reports from storage or API
    this.loadRecentReports();
  }

  generateReport(template: ReportTemplate) {
    console.log('Generate report:', template.id);
    alert(`Generating ${template.name}...\nThis will download a ${template.format.toUpperCase()} file.`);
    
    // Add to recent reports
    this.recentReports.unshift({
      id: `REPORT-${Date.now()}`,
      name: template.name,
      generatedAt: new Date(),
      format: template.format
    });
    
    // Keep only last 10
    if (this.recentReports.length > 10) {
      this.recentReports = this.recentReports.slice(0, 10);
    }
  }

  generateCustomReport() {
    if (!this.customReport.name) {
      alert('Please enter a report name');
      return;
    }

    console.log('Generate custom report:', this.customReport);
    alert(`Generating custom report: ${this.customReport.name}...`);
    
    this.recentReports.unshift({
      id: `REPORT-${Date.now()}`,
      name: this.customReport.name,
      generatedAt: new Date(),
      format: this.customReport.format
    });
    
    if (this.recentReports.length > 10) {
      this.recentReports = this.recentReports.slice(0, 10);
    }
  }

  resetCustomReport() {
    this.customReport = {
      name: '',
      format: 'pdf',
      dateFrom: '',
      dateTo: '',
      includeLoans: true,
      includePayments: true,
      includeBorrowers: false,
      includeFinancials: false
    };
  }

  downloadReport(report: any) {
    console.log('Download report:', report.id);
    alert(`Downloading ${report.name}...`);
  }

  deleteReport(report: any) {
    if (confirm(`Delete report ${report.name}?`)) {
      this.recentReports = this.recentReports.filter(r => r.id !== report.id);
    }
  }

  loadRecentReports() {
    // Mock recent reports
    this.recentReports = [
      {
        id: 'REPORT-001',
        name: 'Monthly Portfolio Summary',
        generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        format: 'pdf'
      },
      {
        id: 'REPORT-002',
        name: 'Weekly Performance Report',
        generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        format: 'excel'
      }
    ];
  }

  getReportIcon(category: string): string {
    const icons: { [key: string]: string } = {
      portfolio: 'briefcase',
      performance: 'trending-up',
      delinquency: 'alert-triangle',
      financial: 'dollar-sign',
      custom: 'file-text'
    };
    return icons[category] || 'file-text';
  }

  formatCategory(category: string): string {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }
}

