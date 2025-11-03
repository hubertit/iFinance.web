import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';

export interface RegulatoryReport {
  id: string;
  name: string;
  regulatoryBody: string;
  frequency: 'monthly' | 'quarterly' | 'annual';
  dueDate: Date;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  description: string;
}

@Component({
  selector: 'app-regulatory-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent],
  template: `
    <div class="regulatory-reports">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Regulatory Reports</h1>
          <p class="page-description">Compliance reports and regulatory submissions</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="exportAll()">
            <app-feather-icon name="download" size="16px"></app-feather-icon>
            Export All
          </button>
        </div>
      </div>

      <!-- Compliance Summary -->
      <div class="summary-section" *ngIf="complianceSummary">
        <div class="summary-card">
          <div class="summary-label">Pending Reports</div>
          <div class="summary-value">{{ complianceSummary.pending }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Submitted This Month</div>
          <div class="summary-value">{{ complianceSummary.submitted }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Compliance Rate</div>
          <div class="summary-value">{{ complianceSummary.complianceRate }}%</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Due This Week</div>
          <div class="summary-value">{{ complianceSummary.dueThisWeek }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="statusFilter">Status</label>
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterReports()">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="frequencyFilter">Frequency</label>
            <select id="frequencyFilter" [(ngModel)]="selectedFrequency" (change)="filterReports()">
              <option value="">All Frequencies</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="searchInput">Search</label>
            <input 
              type="text" 
              id="searchInput" 
              [(ngModel)]="searchTerm" 
              (input)="filterReports()"
              placeholder="Search by report name..."
            />
          </div>
        </div>
      </div>

      <!-- Reports List -->
      <div class="reports-section">
        <div class="section-header">
          <h3>Regulatory Reports</h3>
          <span class="report-count">{{ filteredReports.length }} reports</span>
        </div>

        <div class="reports-list">
          <div class="report-card" *ngFor="let report of filteredReports" [class]="report.status">
            <div class="report-header">
              <div class="report-info">
                <h4>{{ report.name }}</h4>
                <div class="report-meta">
                  <span class="regulatory-body">{{ report.regulatoryBody }}</span>
                  <span class="frequency">{{ formatFrequency(report.frequency) }}</span>
                </div>
              </div>
              <div class="report-status" [class]="report.status">
                {{ formatStatus(report.status) }}
              </div>
            </div>
            
            <div class="report-description">
              <p>{{ report.description }}</p>
            </div>

            <div class="report-footer">
              <div class="report-due">
                <app-feather-icon name="calendar" size="14px"></app-feather-icon>
                <span>Due: {{ formatDate(report.dueDate) }}</span>
                <span class="due-badge" *ngIf="isDueSoon(report.dueDate)">Due Soon</span>
              </div>
              <div class="report-actions">
                <button class="btn-small" (click)="viewReport(report)">
                  <app-feather-icon name="eye" size="14px"></app-feather-icon>
                  View
                </button>
                <button class="btn-small" *ngIf="report.status === 'pending'" (click)="generateReport(report)">
                  <app-feather-icon name="file-text" size="14px"></app-feather-icon>
                  Generate
                </button>
                <button class="btn-small" *ngIf="report.status === 'pending'" (click)="submitReport(report)">
                  <app-feather-icon name="send" size="14px"></app-feather-icon>
                  Submit
                </button>
                <button class="btn-small" (click)="downloadReport(report)">
                  <app-feather-icon name="download" size="14px"></app-feather-icon>
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./regulatory-reports.component.scss']
})
export class RegulatoryReportsComponent implements OnInit {
  reports: RegulatoryReport[] = [];
  filteredReports: RegulatoryReport[] = [];
  
  // Filters
  selectedStatus = '';
  selectedFrequency = '';
  searchTerm = '';
  
  // Summary
  complianceSummary: {
    pending: number;
    submitted: number;
    complianceRate: number;
    dueThisWeek: number;
  } | null = null;

  ngOnInit() {
    this.loadReports();
    this.calculateSummary();
    this.filterReports();
  }

  private loadReports() {
    // Mock regulatory reports
    this.reports = [
      {
        id: 'REG-001',
        name: 'Monthly Lending Activity Report',
        regulatoryBody: 'National Bank of Rwanda',
        frequency: 'monthly',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'pending',
        description: 'Monthly report of all lending activities including disbursements, repayments, and defaults'
      },
      {
        id: 'REG-002',
        name: 'Quarterly Portfolio Report',
        regulatoryBody: 'National Bank of Rwanda',
        frequency: 'quarterly',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'pending',
        description: 'Quarterly comprehensive portfolio analysis and risk assessment'
      },
      {
        id: 'REG-003',
        name: 'Annual Financial Statement',
        regulatoryBody: 'Rwanda Revenue Authority',
        frequency: 'annual',
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: 'pending',
        description: 'Annual financial statements for tax and regulatory compliance'
      },
      {
        id: 'REG-004',
        name: 'Monthly Compliance Report',
        regulatoryBody: 'Financial Intelligence Unit',
        frequency: 'monthly',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'submitted',
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        description: 'Monthly anti-money laundering and compliance report'
      }
    ];
  }

  private calculateSummary() {
    const thisMonth = new Date().getMonth();
    const thisWeekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    this.complianceSummary = {
      pending: this.reports.filter(r => r.status === 'pending').length,
      submitted: this.reports.filter(r => 
        r.status === 'submitted' && r.submittedAt && new Date(r.submittedAt).getMonth() === thisMonth
      ).length,
      complianceRate: this.reports.filter(r => r.status !== 'pending').length / this.reports.length * 100,
      dueThisWeek: this.reports.filter(r => 
        r.status === 'pending' && new Date(r.dueDate) <= thisWeekEnd
      ).length
    };
  }

  filterReports() {
    let filtered = [...this.reports];

    if (this.selectedStatus) {
      filtered = filtered.filter(r => r.status === this.selectedStatus);
    }

    if (this.selectedFrequency) {
      filtered = filtered.filter(r => r.frequency === this.selectedFrequency);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(term) ||
        r.regulatoryBody.toLowerCase().includes(term)
      );
    }

    this.filteredReports = filtered;
  }

  viewReport(report: RegulatoryReport) {
    console.log('View report:', report.id);
    alert(`Viewing ${report.name} details...`);
  }

  generateReport(report: RegulatoryReport) {
    console.log('Generate report:', report.id);
    alert(`Generating ${report.name}...`);
  }

  submitReport(report: RegulatoryReport) {
    if (confirm(`Submit ${report.name} to ${report.regulatoryBody}?`)) {
      const index = this.reports.findIndex(r => r.id === report.id);
      if (index !== -1) {
        this.reports[index].status = 'submitted';
        this.reports[index].submittedAt = new Date();
        this.calculateSummary();
        this.filterReports();
        alert('Report submitted successfully!');
      }
    }
  }

  downloadReport(report: RegulatoryReport) {
    console.log('Download report:', report.id);
    alert(`Downloading ${report.name}...`);
  }

  exportAll() {
    console.log('Export all reports');
    alert('Export functionality will be implemented');
  }

  isDueSoon(dueDate: Date): boolean {
    const daysUntilDue = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7 && daysUntilDue >= 0;
  }

  formatStatus(status: string): string {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatFrequency(frequency: string): string {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }
}

