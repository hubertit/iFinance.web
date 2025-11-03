import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { LenderService, LoanApplication } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

export interface CreditScore {
  id: string;
  borrowerId: string;
  borrowerName: string;
  borrowerPhone: string;
  applicationId?: string;
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  scoreComponents: {
    paymentHistory: number;
    creditUtilization: number;
    creditHistory: number;
    incomeStability: number;
    debtToIncome: number;
  };
  calculatedAt: Date;
  validUntil: Date;
}

export interface ScoringRule {
  id: string;
  name: string;
  category: string;
  weight: number;
  minScore: number;
  maxScore: number;
  isActive: boolean;
}

@Component({
  selector: 'app-credit-scoring',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="credit-scoring">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Credit Scoring</h1>
          <p class="page-description">Manage credit scores and scoring rules for loan applications</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="openScoringRulesModal()">
            <app-feather-icon name="settings" size="16px"></app-feather-icon>
            Scoring Rules
          </button>
          <button class="btn-primary" (click)="calculateNewScore()">
            <app-feather-icon name="calculator" size="16px"></app-feather-icon>
            Calculate Score
          </button>
        </div>
      </div>

      <!-- Score Distribution -->
      <div class="score-distribution" *ngIf="creditScores.length > 0">
        <div class="distribution-card excellent">
          <div class="distribution-icon">
            <app-feather-icon name="award" size="24px"></app-feather-icon>
          </div>
          <div class="distribution-content">
            <div class="distribution-label">Excellent (750+)</div>
            <div class="distribution-value">{{ getScoreCount(750, 850) }}</div>
            <div class="distribution-percentage">{{ getScorePercentage(750, 850).toFixed(1) }}%</div>
          </div>
        </div>

        <div class="distribution-card good">
          <div class="distribution-icon">
            <app-feather-icon name="check-circle" size="24px"></app-feather-icon>
          </div>
          <div class="distribution-content">
            <div class="distribution-label">Good (650-749)</div>
            <div class="distribution-value">{{ getScoreCount(650, 749) }}</div>
            <div class="distribution-percentage">{{ getScorePercentage(650, 749).toFixed(1) }}%</div>
          </div>
        </div>

        <div class="distribution-card fair">
          <div class="distribution-icon">
            <app-feather-icon name="alert-circle" size="24px"></app-feather-icon>
          </div>
          <div class="distribution-content">
            <div class="distribution-label">Fair (550-649)</div>
            <div class="distribution-value">{{ getScoreCount(550, 649) }}</div>
            <div class="distribution-percentage">{{ getScorePercentage(550, 649).toFixed(1) }}%</div>
          </div>
        </div>

        <div class="distribution-card poor">
          <div class="distribution-icon">
            <app-feather-icon name="x-circle" size="24px"></app-feather-icon>
          </div>
          <div class="distribution-content">
            <div class="distribution-label">Poor (<550)</div>
            <div class="distribution-value">{{ getScoreCount(0, 549) }}</div>
            <div class="distribution-percentage">{{ getScorePercentage(0, 549).toFixed(1) }}%</div>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="summary-stats" *ngIf="creditScores.length > 0">
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="bar-chart-2" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">Average Score</div>
            <div class="stat-value">{{ averageScore.toFixed(0) }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="users" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Scores</div>
            <div class="stat-value">{{ creditScores.length }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="trending-up" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">High Risk</div>
            <div class="stat-value">{{ highRiskCount }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="calendar" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">Expiring Soon</div>
            <div class="stat-value">{{ expiringSoonCount }}</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="riskFilter">Risk Level</label>
            <select id="riskFilter" [(ngModel)]="selectedRiskLevel" (change)="filterScores()">
              <option value="">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical Risk</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="scoreRangeFilter">Score Range</label>
            <select id="scoreRangeFilter" [(ngModel)]="selectedScoreRange" (change)="filterScores()">
              <option value="">All Scores</option>
              <option value="750+">750+ (Excellent)</option>
              <option value="650-749">650-749 (Good)</option>
              <option value="550-649">550-649 (Fair)</option>
              <option value="<550">Below 550 (Poor)</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="searchInput">Search</label>
            <input 
              type="text" 
              id="searchInput" 
              [(ngModel)]="searchTerm" 
              (input)="filterScores()"
              placeholder="Search by borrower name or phone..."
            />
          </div>
        </div>
      </div>

      <!-- Credit Scores Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>Credit Scores</h3>
            <span class="score-count">{{ filteredScores.length }} scores</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredScores"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="filteredScores.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-score>
              <div class="dropdown" [class.show]="openDropdownId === score.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(score.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === score.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewScoreDetails(score)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View Details
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="recalculateScore(score)">
                      <app-feather-icon name="refresh-cw" size="14px" class="me-2"></app-feather-icon>
                      Recalculate
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="exportScore(score)">
                      <app-feather-icon name="download" size="14px" class="me-2"></app-feather-icon>
                      Export Report
                    </a>
                  </li>
                </ul>
              </div>
            </ng-template>
          </app-data-table>
        </div>
      </div>

      <!-- Score Details Modal -->
      <div class="modal-overlay" *ngIf="showScoreModal" (click)="closeScoreModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Credit Score Details</h3>
            <button class="close-btn" (click)="closeScoreModal()">
              <app-feather-icon name="x" size="20px"></app-feather-icon>
            </button>
          </div>
          
          <div class="modal-content" *ngIf="selectedScore">
            <div class="score-info">
              <div class="score-display">
                <div class="score-value" [class]="getScoreClass(selectedScore.score)">
                  {{ selectedScore.score }}
                </div>
                <div class="score-label">{{ getScoreLabel(selectedScore.score) }}</div>
                <div class="risk-badge" [class]="selectedScore.riskLevel">
                  {{ formatRiskLevel(selectedScore.riskLevel) }} Risk
                </div>
              </div>

              <div class="info-section">
                <h4>Borrower Information</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Name:</label>
                    <span>{{ selectedScore.borrowerName }}</span>
                  </div>
                  <div class="info-item">
                    <label>Phone:</label>
                    <span>{{ selectedScore.borrowerPhone }}</span>
                  </div>
                  <div class="info-item">
                    <label>Calculated:</label>
                    <span>{{ formatDate(selectedScore.calculatedAt) }}</span>
                  </div>
                  <div class="info-item">
                    <label>Valid Until:</label>
                    <span>{{ formatDate(selectedScore.validUntil) }}</span>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <h4>Score Components</h4>
                <div class="components-list">
                  <div class="component-item" *ngFor="let component of getScoreComponents(selectedScore)">
                    <div class="component-header">
                      <span class="component-name">{{ component.name }}</span>
                      <span class="component-score">{{ component.score }} points</span>
                    </div>
                    <div class="component-bar">
                      <div class="component-fill" [style.width.%]="(component.score / component.max) * 100"></div>
                    </div>
                    <div class="component-weight">Weight: {{ component.weight }}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./credit-scoring.component.scss']
})
export class CreditScoringComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  creditScores: CreditScore[] = [];
  filteredScores: CreditScore[] = [];
  selectedScore: CreditScore | null = null;
  showScoreModal = false;
  
  // Filters
  selectedRiskLevel = '';
  selectedScoreRange = '';
  searchTerm = '';
  
  // Stats
  averageScore = 0;
  highRiskCount = 0;
  expiringSoonCount = 0;
  
  // Table
  columns: any[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  openDropdownId: string | null = null;

  constructor(private lenderService: LenderService) {}

  ngOnInit() {
    this.initializeColumns();
    this.loadCreditScores();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeColumns() {
    this.columns = [
      { key: 'borrowerName', title: 'Borrower', type: 'text', sortable: true },
      { key: 'borrowerPhone', title: 'Phone', type: 'text', sortable: true },
      { key: 'score', title: 'Score', type: 'number', sortable: true },
      { key: 'riskLevel', title: 'Risk Level', type: 'status', sortable: true },
      { key: 'calculatedAt', title: 'Calculated', type: 'date', sortable: true },
      { key: 'validUntil', title: 'Valid Until', type: 'date', sortable: true }
    ];
  }

  private loadCreditScores() {
    this.loading = true;

    // Generate credit scores from loan applications
    this.lenderService.loanApplications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(applications => {
        this.creditScores = applications
          .filter(app => app.creditScore !== undefined)
          .map(app => this.createCreditScore(app));

        this.calculateStats();
        this.filterScores();
        this.loading = false;
      });
  }

  private createCreditScore(application: LoanApplication): CreditScore {
    const baseScore = application.creditScore || 600;
    const score = Math.max(300, Math.min(850, baseScore + Math.floor(Math.random() * 100) - 50));
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (score < 550) riskLevel = 'critical';
    else if (score < 650) riskLevel = 'high';
    else if (score < 750) riskLevel = 'medium';

    return {
      id: `SCORE-${application.id}`,
      borrowerId: application.applicantId,
      borrowerName: application.applicantName,
      borrowerPhone: application.applicantPhone,
      applicationId: application.id,
      score: score,
      riskLevel: riskLevel,
      scoreComponents: {
        paymentHistory: Math.floor(Math.random() * 200) + 100,
        creditUtilization: Math.floor(Math.random() * 200) + 100,
        creditHistory: Math.floor(Math.random() * 200) + 100,
        incomeStability: Math.floor(Math.random() * 200) + 100,
        debtToIncome: Math.floor(Math.random() * 200) + 100
      },
      calculatedAt: application.submittedAt,
      validUntil: new Date(application.submittedAt.getTime() + 90 * 24 * 60 * 60 * 1000)
    };
  }

  private calculateStats() {
    if (this.creditScores.length === 0) {
      this.averageScore = 0;
      this.highRiskCount = 0;
      this.expiringSoonCount = 0;
      return;
    }

    this.averageScore = this.creditScores.reduce((sum, score) => sum + score.score, 0) / this.creditScores.length;
    this.highRiskCount = this.creditScores.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical').length;
    
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    this.expiringSoonCount = this.creditScores.filter(s => s.validUntil <= thirtyDaysFromNow).length;
  }

  filterScores() {
    let filtered = [...this.creditScores];

    if (this.selectedRiskLevel) {
      filtered = filtered.filter(score => score.riskLevel === this.selectedRiskLevel);
    }

    if (this.selectedScoreRange) {
      switch (this.selectedScoreRange) {
        case '750+':
          filtered = filtered.filter(score => score.score >= 750);
          break;
        case '650-749':
          filtered = filtered.filter(score => score.score >= 650 && score.score < 750);
          break;
        case '550-649':
          filtered = filtered.filter(score => score.score >= 550 && score.score < 650);
          break;
        case '<550':
          filtered = filtered.filter(score => score.score < 550);
          break;
      }
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(score =>
        score.borrowerName.toLowerCase().includes(term) ||
        score.borrowerPhone.includes(term)
      );
    }

    this.filteredScores = filtered;
    this.totalPages = Math.ceil(this.filteredScores.length / this.pageSize);
  }

  getScoreCount(min: number, max: number): number {
    return this.creditScores.filter(score => score.score >= min && score.score <= max).length;
  }

  getScorePercentage(min: number, max: number): number {
    if (this.creditScores.length === 0) return 0;
    return (this.getScoreCount(min, max) / this.creditScores.length) * 100;
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    const { column, direction } = event;
    
    this.filteredScores.sort((a, b) => {
      let aValue: any = (a as any)[column];
      let bValue: any = (b as any)[column];
      
      if (column.includes('At') || column.includes('Until')) {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }
      
      if (typeof aValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  handlePageChange(page: number) {
    this.currentPage = page;
  }

  handlePageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  // Dropdown handlers
  toggleDropdown(scoreId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === scoreId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = scoreId;
    }
  }

  closeDropdown() {
    this.openDropdownId = null;
  }

  private setupEventListeners() {
    document.addEventListener('click', () => {
      this.closeDropdown();
    });
  }

  // Action methods
  viewScoreDetails(score: CreditScore) {
    this.closeDropdown();
    this.selectedScore = score;
    this.showScoreModal = true;
  }

  recalculateScore(score: CreditScore) {
    this.closeDropdown();
    console.log('Recalculate score for:', score.borrowerName);
    alert(`Recalculating credit score for ${score.borrowerName}...`);
  }

  exportScore(score: CreditScore) {
    this.closeDropdown();
    console.log('Export score report for:', score.borrowerName);
    alert(`Exporting credit score report for ${score.borrowerName}...`);
  }

  openScoringRulesModal() {
    alert('Scoring rules configuration will be implemented');
  }

  calculateNewScore() {
    alert('New credit score calculation will be implemented');
  }

  closeScoreModal() {
    this.showScoreModal = false;
    this.selectedScore = null;
  }

  getScoreClass(score: number): string {
    if (score >= 750) return 'excellent';
    if (score >= 650) return 'good';
    if (score >= 550) return 'fair';
    return 'poor';
  }

  getScoreLabel(score: number): string {
    if (score >= 750) return 'Excellent';
    if (score >= 650) return 'Good';
    if (score >= 550) return 'Fair';
    return 'Poor';
  }

  formatRiskLevel(riskLevel: string): string {
    return riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  getScoreComponents(score: CreditScore): Array<{ name: string; score: number; max: number; weight: number }> {
    return [
      { name: 'Payment History', score: score.scoreComponents.paymentHistory, max: 300, weight: 35 },
      { name: 'Credit Utilization', score: score.scoreComponents.creditUtilization, max: 300, weight: 30 },
      { name: 'Credit History Length', score: score.scoreComponents.creditHistory, max: 300, weight: 15 },
      { name: 'Income Stability', score: score.scoreComponents.incomeStability, max: 300, weight: 15 },
      { name: 'Debt-to-Income Ratio', score: score.scoreComponents.debtToIncome, max: 300, weight: 5 }
    ];
  }
}

