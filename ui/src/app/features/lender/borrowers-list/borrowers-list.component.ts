import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { LenderService, ActiveLoan, LoanApplication } from '../../../core/services/lender.service';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

export interface Borrower {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  defaultedLoans: number;
  totalBorrowed: number;
  totalPaid: number;
  outstandingBalance: number;
  creditScore?: number;
  riskLevel: 'low' | 'medium' | 'high';
  registeredAt: Date;
  lastLoanDate?: Date;
}

@Component({
  selector: 'app-borrowers-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="borrowers-list">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Borrowers</h1>
          <p class="page-description">Manage your borrower database</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="navigateToAddBorrower()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            Add Borrower
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid" *ngIf="borrowers.length > 0">
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="users" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ borrowers.length }}</div>
            <div class="stat-label">Total Borrowers</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="dollar-sign" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(totalOutstanding) }}</div>
            <div class="stat-label">Total Outstanding</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="trending-up" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ activeBorrowersCount }}</div>
            <div class="stat-label">Active Borrowers</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="alert-triangle" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ highRiskBorrowersCount }}</div>
            <div class="stat-label">High Risk</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="riskFilter">Risk Level</label>
            <select id="riskFilter" [(ngModel)]="selectedRiskLevel" (change)="filterBorrowers()">
              <option value="">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="statusFilter">Status</label>
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterBorrowers()">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="defaulted">Defaulted</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="searchInput">Search</label>
            <input 
              type="text" 
              id="searchInput" 
              [(ngModel)]="searchTerm" 
              (input)="filterBorrowers()"
              placeholder="Search by name, phone, or email..."
            />
          </div>
        </div>
      </div>

      <!-- Borrowers Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>All Borrowers</h3>
            <span class="borrower-count">{{ filteredBorrowers.length }} borrowers</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredBorrowers"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="filteredBorrowers.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-borrower>
              <div class="dropdown" [class.show]="openDropdownId === borrower.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(borrower.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === borrower.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewBorrower(borrower)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View Profile
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewBorrowerHistory(borrower)">
                      <app-feather-icon name="clock" size="14px" class="me-2"></app-feather-icon>
                      View History
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="editBorrower(borrower)">
                      <app-feather-icon name="edit" size="14px" class="me-2"></app-feather-icon>
                      Edit
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="deleteBorrower(borrower)">
                      <app-feather-icon name="trash-2" size="14px" class="me-2"></app-feather-icon>
                      Delete
                    </a>
                  </li>
                </ul>
              </div>
            </ng-template>
          </app-data-table>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./borrowers-list.component.scss']
})
export class BorrowersListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  borrowers: Borrower[] = [];
  filteredBorrowers: Borrower[] = [];
  
  // Filters
  selectedRiskLevel = '';
  selectedStatus = '';
  searchTerm = '';
  
  // Stats
  totalOutstanding = 0;
  activeBorrowersCount = 0;
  highRiskBorrowersCount = 0;
  
  // Table
  columns: any[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  openDropdownId: string | null = null;

  constructor(
    private lenderService: LenderService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeColumns();
    this.loadBorrowers();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeColumns() {
    this.columns = [
      { key: 'name', title: 'Name', type: 'text', sortable: true },
      { key: 'phone', title: 'Phone', type: 'text', sortable: true },
      { key: 'email', title: 'Email', type: 'text', sortable: true },
      { key: 'totalLoans', title: 'Total Loans', type: 'number', sortable: true },
      { key: 'activeLoans', title: 'Active', type: 'number', sortable: true },
      { key: 'outstandingBalance', title: 'Outstanding', type: 'currency', sortable: true },
      { key: 'creditScore', title: 'Credit Score', type: 'number', sortable: true },
      { key: 'riskLevel', title: 'Risk Level', type: 'status', sortable: true }
    ];
  }

  private loadBorrowers() {
    this.loading = true;

    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loans => {
        this.borrowers = this.extractBorrowersFromLoans(loans);
        this.calculateStats();
        this.filterBorrowers();
        this.loading = false;
      });
  }

  private extractBorrowersFromLoans(loans: ActiveLoan[]): Borrower[] {
    const borrowerMap = new Map<string, Borrower>();

    loans.forEach(loan => {
      const existing = borrowerMap.get(loan.borrowerId) || {
        id: loan.borrowerId,
        name: loan.borrowerName,
        phone: loan.borrowerPhone,
        email: `${loan.borrowerName.toLowerCase().replace(' ', '.')}@email.com`,
        totalLoans: 0,
        activeLoans: 0,
        completedLoans: 0,
        defaultedLoans: 0,
        totalBorrowed: 0,
        totalPaid: 0,
        outstandingBalance: 0,
        creditScore: 650 + Math.floor(Math.random() * 150),
        riskLevel: 'low' as 'low' | 'medium' | 'high',
        registeredAt: loan.disbursedAt,
        lastLoanDate: loan.disbursedAt
      };

      existing.totalLoans++;
      existing.totalBorrowed += loan.disbursedAmount;
      existing.totalPaid += loan.totalPaid;
      existing.outstandingBalance += loan.outstandingBalance;
      
      if (loan.status === 'active') existing.activeLoans++;
      else if (loan.status === 'completed') existing.completedLoans++;
      else if (loan.status === 'defaulted') existing.defaultedLoans++;

      if (loan.daysPastDue > 60 || loan.status === 'defaulted') {
        existing.riskLevel = 'high';
      } else if (loan.daysPastDue > 30) {
        existing.riskLevel = 'medium';
      }

      borrowerMap.set(loan.borrowerId, existing);
    });

    return Array.from(borrowerMap.values());
  }

  private calculateStats() {
    this.totalOutstanding = this.borrowers.reduce((sum, b) => sum + b.outstandingBalance, 0);
    this.activeBorrowersCount = this.borrowers.filter(b => b.activeLoans > 0).length;
    this.highRiskBorrowersCount = this.borrowers.filter(b => b.riskLevel === 'high').length;
  }

  filterBorrowers() {
    let filtered = [...this.borrowers];

    if (this.selectedRiskLevel) {
      filtered = filtered.filter(b => b.riskLevel === this.selectedRiskLevel);
    }

    if (this.selectedStatus) {
      switch (this.selectedStatus) {
        case 'active':
          filtered = filtered.filter(b => b.activeLoans > 0);
          break;
        case 'inactive':
          filtered = filtered.filter(b => b.activeLoans === 0);
          break;
        case 'defaulted':
          filtered = filtered.filter(b => b.defaultedLoans > 0);
          break;
      }
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(term) ||
        b.phone.includes(term) ||
        (b.email && b.email.toLowerCase().includes(term))
      );
    }

    this.filteredBorrowers = filtered;
    this.totalPages = Math.ceil(this.filteredBorrowers.length / this.pageSize);
  }

  navigateToAddBorrower() {
    this.router.navigate(['/lender/borrowers/add']);
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    const { column, direction } = event;
    
    this.filteredBorrowers.sort((a, b) => {
      let aValue: any = (a as any)[column];
      let bValue: any = (b as any)[column];
      
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
  toggleDropdown(borrowerId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === borrowerId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = borrowerId;
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
  viewBorrower(borrower: Borrower) {
    this.closeDropdown();
    this.router.navigate(['/lender/borrowers/profiles'], { queryParams: { id: borrower.id } });
  }

  viewBorrowerHistory(borrower: Borrower) {
    this.closeDropdown();
    this.router.navigate(['/lender/borrowers/history'], { queryParams: { id: borrower.id } });
  }

  editBorrower(borrower: Borrower) {
    this.closeDropdown();
    // TODO: Open edit borrower modal
    console.log('Edit borrower:', borrower.id);
  }

  deleteBorrower(borrower: Borrower) {
    this.closeDropdown();
    if (confirm(`Are you sure you want to delete borrower ${borrower.name}?`)) {
      // TODO: Implement delete
      console.log('Delete borrower:', borrower.id);
      this.borrowers = this.borrowers.filter(b => b.id !== borrower.id);
      this.filterBorrowers();
      this.calculateStats();
    }
  }

  formatCurrency(amount: number): string {
    return this.lenderService.formatCurrency(amount);
  }
}

