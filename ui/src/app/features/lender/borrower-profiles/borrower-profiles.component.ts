import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
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

@Component({
  selector: 'app-borrower-profiles',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconComponent, NgApexchartsModule],
  template: `
    <div class="borrower-profiles">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Borrower Profile</h1>
          <p class="page-description">Detailed borrower information and loan history</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="goBack()">
            <app-feather-icon name="arrow-left" size="16px"></app-feather-icon>
            Back
          </button>
          <button class="btn-primary" (click)="editBorrower()">
            <app-feather-icon name="edit" size="16px"></app-feather-icon>
            Edit
          </button>
        </div>
      </div>

      <div *ngIf="borrowerData" class="profile-content">
        <!-- Borrower Info Card -->
        <div class="info-card">
          <div class="card-header">
            <h3>Borrower Information</h3>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <label>Full Name</label>
                <span>{{ borrowerData.name }}</span>
              </div>
              <div class="info-item">
                <label>Phone</label>
                <span>{{ borrowerData.phone }}</span>
              </div>
              <div class="info-item">
                <label>Email</label>
                <span>{{ borrowerData.email || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <label>Address</label>
                <span>{{ borrowerData.address || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <label>Credit Score</label>
                <span class="credit-score">{{ borrowerData.creditScore || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <label>Risk Level</label>
                <span class="risk-badge" [class]="borrowerData.riskLevel">
                  {{ formatRiskLevel(borrowerData.riskLevel) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Loan Statistics -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-icon">
              <app-feather-icon name="dollar-sign" size="20px"></app-feather-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">Total Borrowed</div>
              <div class="stat-value">{{ formatCurrency(borrowerData.totalBorrowed) }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <app-feather-icon name="trending-up" size="20px"></app-feather-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">Total Paid</div>
              <div class="stat-value">{{ formatCurrency(borrowerData.totalPaid) }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <app-feather-icon name="briefcase" size="20px"></app-feather-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">Outstanding</div>
              <div class="stat-value">{{ formatCurrency(borrowerData.outstandingBalance) }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <app-feather-icon name="file-text" size="20px"></app-feather-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">Total Loans</div>
              <div class="stat-value">{{ borrowerData.totalLoans }}</div>
            </div>
          </div>
        </div>

        <!-- Loan History Chart -->
        <div class="chart-card" *ngIf="loanHistoryChartOptions">
          <div class="card-header">
            <h3>Loan History Trend</h3>
          </div>
          <div class="card-body">
            <div class="chart-wrapper">
              <apx-chart
                [series]="loanHistoryChartOptions.series"
                [chart]="loanHistoryChartOptions.chart"
                [xaxis]="loanHistoryChartOptions.xaxis"
                [yaxis]="loanHistoryChartOptions.yaxis"
                [dataLabels]="loanHistoryChartOptions.dataLabels"
                [stroke]="loanHistoryChartOptions.stroke"
                [colors]="loanHistoryChartOptions.colors"
                [tooltip]="loanHistoryChartOptions.tooltip"
                [grid]="loanHistoryChartOptions.grid">
              </apx-chart>
            </div>
          </div>
        </div>

        <!-- Active Loans -->
        <div class="loans-section">
          <div class="card-header">
            <h3>Active Loans</h3>
            <span class="loan-count">{{ borrowerLoans.length }} loans</span>
          </div>
          <div class="loans-list">
            <div class="loan-item" *ngFor="let loan of borrowerLoans">
              <div class="loan-info">
                <div class="loan-number">{{ loan.loanNumber }}</div>
                <div class="loan-details">
                  <span>{{ loan.productName }}</span>
                  <span>•</span>
                  <span>{{ formatCurrency(loan.outstandingBalance) }} outstanding</span>
                </div>
              </div>
              <div class="loan-status" [class]="loan.status">
                {{ formatStatus(loan.status) }}
              </div>
              <button class="btn-view" (click)="viewLoan(loan)">
                <app-feather-icon name="eye" size="14px"></app-feather-icon>
                View
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <app-feather-icon name="loader" size="32px"></app-feather-icon>
        <p>Loading borrower profile...</p>
      </div>
    </div>
  `,
  styleUrls: ['./borrower-profiles.component.scss']
})
export class BorrowerProfilesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  borrowerData: any = null;
  borrowerLoans: ActiveLoan[] = [];
  isLoading = false;

  loanHistoryChartOptions: any = {};

  constructor(
    private lenderService: LenderService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.loadBorrowerProfile(params['id']);
      }
    });
    this.initializeChart();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBorrowerProfile(borrowerId: string) {
    this.isLoading = true;

    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loans => {
        const borrowerLoans = loans.filter(l => l.borrowerId === borrowerId);
        
        if (borrowerLoans.length > 0) {
          const loan = borrowerLoans[0];
          this.borrowerData = {
            id: borrowerId,
            name: loan.borrowerName,
            phone: loan.borrowerPhone,
            email: `${loan.borrowerName.toLowerCase().replace(' ', '.')}@email.com`,
            address: 'Kigali, Rwanda',
            creditScore: 650 + Math.floor(Math.random() * 150),
            riskLevel: loan.daysPastDue > 60 ? 'high' : loan.daysPastDue > 30 ? 'medium' : 'low',
            totalBorrowed: borrowerLoans.reduce((sum, l) => sum + l.disbursedAmount, 0),
            totalPaid: borrowerLoans.reduce((sum, l) => sum + l.totalPaid, 0),
            outstandingBalance: borrowerLoans.reduce((sum, l) => sum + l.outstandingBalance, 0),
            totalLoans: borrowerLoans.length
          };
          
          this.borrowerLoans = borrowerLoans;
          this.updateChart(borrowerLoans);
        }
        
        this.isLoading = false;
      });
  }

  private initializeChart() {
    this.loanHistoryChartOptions = {
      series: [{ name: 'Loan Amount', data: [] }],
      chart: { type: 'area', height: 300, toolbar: { show: false } },
      xaxis: { categories: [] },
      yaxis: { labels: { formatter: (val: number) => this.formatCurrency(val) } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      colors: ['#e94118'],
      tooltip: { y: { formatter: (val: number) => this.formatCurrency(val) } },
      grid: { borderColor: '#e5e7eb', strokeDashArray: 4 }
    };
  }

  private updateChart(loans: ActiveLoan[]) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(() => loans.reduce((sum, loan) => sum + loan.disbursedAmount, 0) / loans.length);

    this.loanHistoryChartOptions = {
      ...this.loanHistoryChartOptions,
      series: [{ name: 'Loan Amount', data: data }],
      xaxis: { categories: months }
    };
  }

  goBack() {
    window.history.back();
  }

  editBorrower() {
    console.log('Edit borrower');
  }

  viewLoan(loan: ActiveLoan) {
    console.log('View loan:', loan.loanNumber);
  }

  formatCurrency(amount: number): string {
    return this.lenderService.formatCurrency(amount);
  }

  formatRiskLevel(level: string): string {
    return level.charAt(0).toUpperCase() + level.slice(1) + ' Risk';
  }

  formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

