import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { NgApexchartsModule } from 'ng-apexcharts';

export interface FinancialStatement {
  id: string;
  name: string;
  period: string;
  type: 'income' | 'balance' | 'cash_flow';
  generatedAt: Date;
}

@Component({
  selector: 'app-financial-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, NgApexchartsModule],
  template: `
    <div class="financial-reports">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Financial Reports</h1>
          <p class="page-description">Financial statements and financial analytics</p>
        </div>
        <div class="header-actions">
          <div class="period-selector">
            <select [(ngModel)]="selectedPeriod" (change)="updatePeriod()">
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

      <!-- Financial Summary -->
      <div class="summary-section">
        <div class="summary-card revenue">
          <div class="summary-icon">
            <app-feather-icon name="trending-up" size="20px"></app-feather-icon>
          </div>
          <div class="summary-content">
            <div class="summary-label">Total Revenue</div>
            <div class="summary-value">{{ formatCurrency(totalRevenue) }}</div>
          </div>
        </div>

        <div class="summary-card expenses">
          <div class="summary-icon">
            <app-feather-icon name="trending-down" size="20px"></app-feather-icon>
          </div>
          <div class="summary-content">
            <div class="summary-label">Total Expenses</div>
            <div class="summary-value">{{ formatCurrency(totalExpenses) }}</div>
          </div>
        </div>

        <div class="summary-card profit">
          <div class="summary-icon">
            <app-feather-icon name="dollar-sign" size="20px"></app-feather-icon>
          </div>
          <div class="summary-content">
            <div class="summary-label">Net Profit</div>
            <div class="summary-value" [class]="netProfit >= 0 ? 'positive' : 'negative'">
              {{ formatCurrency(netProfit) }}
            </div>
          </div>
        </div>

        <div class="summary-card assets">
          <div class="summary-icon">
            <app-feather-icon name="briefcase" size="20px"></app-feather-icon>
          </div>
          <div class="summary-content">
            <div class="summary-label">Total Assets</div>
            <div class="summary-value">{{ formatCurrency(totalAssets) }}</div>
          </div>
        </div>
      </div>

      <!-- Financial Statements -->
      <div class="statements-section">
        <div class="section-header">
          <h3>Financial Statements</h3>
          <p class="section-description">Generate standard financial statements</p>
        </div>

        <div class="statements-grid">
          <div class="statement-card" *ngFor="let statement of statements" (click)="viewStatement(statement)">
            <div class="statement-icon">
              <app-feather-icon [name]="getStatementIcon(statement.type)" size="24px"></app-feather-icon>
            </div>
            <div class="statement-content">
              <h4>{{ statement.name }}</h4>
              <p>{{ statement.period }}</p>
              <div class="statement-date">Generated: {{ formatDate(statement.generatedAt) }}</div>
            </div>
            <div class="statement-action">
              <app-feather-icon name="chevron-right" size="20px"></app-feather-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Reports -->
      <div class="quick-reports-section">
        <div class="section-header">
          <h3>Quick Reports</h3>
        </div>

        <div class="quick-reports-grid">
          <button class="quick-report-btn" *ngFor="let report of quickReports" (click)="generateQuickReport(report)">
            <app-feather-icon [name]="report.icon" size="20px"></app-feather-icon>
            <span>{{ report.name }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./financial-reports.component.scss']
})
export class FinancialReportsComponent implements OnInit {
  selectedPeriod = 'month';
  totalRevenue = 125000000;
  totalExpenses = 18750000;
  netProfit = 106250000;
  totalAssets = 500000000;

  statements: FinancialStatement[] = [
    {
      id: 'STMT-001',
      name: 'Income Statement',
      period: 'January 2024',
      type: 'income',
      generatedAt: new Date('2024-01-31')
    },
    {
      id: 'STMT-002',
      name: 'Balance Sheet',
      period: 'January 2024',
      type: 'balance',
      generatedAt: new Date('2024-01-31')
    },
    {
      id: 'STMT-003',
      name: 'Cash Flow Statement',
      period: 'January 2024',
      type: 'cash_flow',
      generatedAt: new Date('2024-01-31')
    }
  ];

  quickReports = [
    { id: 'QR-001', name: 'Profit & Loss', icon: 'dollar-sign' },
    { id: 'QR-002', name: 'Balance Sheet', icon: 'briefcase' },
    { id: 'QR-003', name: 'Cash Flow', icon: 'trending-up' },
    { id: 'QR-004', name: 'Trial Balance', icon: 'file-text' }
  ];

  constructor() {}

  ngOnInit() {}

  updatePeriod() {
    console.log('Update period:', this.selectedPeriod);
    // Update financial data based on period
  }

  viewStatement(statement: FinancialStatement) {
    console.log('View statement:', statement.id);
    alert(`Opening ${statement.name} for ${statement.period}...`);
  }

  generateQuickReport(report: any) {
    console.log('Generate quick report:', report.id);
    alert(`Generating ${report.name}...`);
  }

  exportReport() {
    console.log('Export financial report');
    alert('Export functionality will be implemented');
  }

  getStatementIcon(type: string): string {
    const icons: { [key: string]: string } = {
      income: 'trending-up',
      balance: 'briefcase',
      cash_flow: 'arrow-up-down'
    };
    return icons[type] || 'file-text';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }
}

