import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { LenderService, ActiveLoan } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

export interface CollectionActivity {
  id: string;
  loanId: string;
  loanNumber: string;
  borrowerName: string;
  borrowerPhone: string;
  activityType: 'call' | 'email' | 'sms' | 'visit' | 'payment' | 'promise_to_pay';
  activityDate: Date;
  status: 'completed' | 'pending' | 'scheduled' | 'cancelled';
  outcome?: string;
  nextAction?: Date;
  amountCollected?: number;
  collectorName?: string;
  notes?: string;
}

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="collections">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Collections</h1>
          <p class="page-description">Track and manage collection activities and recovery efforts</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="exportReport()">
            <app-feather-icon name="download" size="16px"></app-feather-icon>
            Export Report
          </button>
          <button class="btn-primary" (click)="openNewActivityModal()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            New Activity
          </button>
        </div>
      </div>

      <!-- Collection Stats -->
      <div class="stats-grid" *ngIf="collectionStats">
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="phone" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ collectionStats.totalActivities }}</div>
            <div class="stat-label">Total Activities</div>
            <div class="stat-change positive">{{ collectionStats.completedActivities }} completed</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="dollar-sign" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(collectionStats.totalCollected) }}</div>
            <div class="stat-label">Total Collected</div>
            <div class="stat-change positive">This month</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="target" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ collectionStats.successRate.toFixed(1) }}%</div>
            <div class="stat-label">Success Rate</div>
            <div class="stat-change positive">+{{ collectionStats.improvement.toFixed(1) }}% vs last month</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="calendar" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ collectionStats.scheduledActivities }}</div>
            <div class="stat-label">Scheduled</div>
            <div class="stat-change">{{ collectionStats.pendingActivities }} pending</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="typeFilter">Activity Type</label>
            <select id="typeFilter" [(ngModel)]="selectedActivityType" (change)="filterActivities()">
              <option value="">All Types</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="visit">Visit</option>
              <option value="payment">Payment</option>
              <option value="promise_to_pay">Promise to Pay</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="statusFilter">Status</label>
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterActivities()">
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="dateRangeFilter">Date Range</label>
            <select id="dateRangeFilter" [(ngModel)]="selectedDateRange" (change)="filterActivities()">
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="searchInput">Search</label>
            <input 
              type="text" 
              id="searchInput" 
              [(ngModel)]="searchTerm" 
              (input)="filterActivities()"
              placeholder="Search by borrower or loan number..."
            />
          </div>
        </div>
      </div>

      <!-- Activities Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>Collection Activities</h3>
            <span class="activity-count">{{ filteredActivities.length }} activities</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredActivities"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="filteredActivities.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-activity>
              <div class="dropdown" [class.show]="openDropdownId === activity.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(activity.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === activity.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewActivity(activity)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View Details
                    </a>
                  </li>
                  <li *ngIf="activity.status !== 'completed'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="editActivity(activity)">
                      <app-feather-icon name="edit" size="14px" class="me-2"></app-feather-icon>
                      Edit
                    </a>
                  </li>
                  <li *ngIf="activity.status === 'scheduled'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="markAsCompleted(activity)">
                      <app-feather-icon name="check" size="14px" class="me-2"></app-feather-icon>
                      Mark as Completed
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="scheduleFollowUp(activity)">
                      <app-feather-icon name="calendar" size="14px" class="me-2"></app-feather-icon>
                      Schedule Follow-up
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="deleteActivity(activity)">
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

      <!-- Activity Details Modal -->
      <div class="modal-overlay" *ngIf="showActivityModal" (click)="closeActivityModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ selectedActivity ? 'Activity Details' : 'New Collection Activity' }}</h3>
            <button class="close-btn" (click)="closeActivityModal()">
              <app-feather-icon name="x" size="20px"></app-feather-icon>
            </button>
          </div>
          <div class="modal-content" *ngIf="selectedActivity">
            <div class="activity-info">
              <div class="info-section">
                <h4>Activity Information</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Type:</label>
                    <span class="activity-type-badge" [class]="selectedActivity.activityType">
                      {{ formatActivityType(selectedActivity.activityType) }}
                    </span>
                  </div>
                  <div class="info-item">
                    <label>Status:</label>
                    <span class="status-badge" [class]="selectedActivity.status">
                      {{ formatStatus(selectedActivity.status) }}
                    </span>
                  </div>
                  <div class="info-item">
                    <label>Date:</label>
                    <span>{{ formatDate(selectedActivity.activityDate) }}</span>
                  </div>
                  <div class="info-item" *ngIf="selectedActivity.collectorName">
                    <label>Collector:</label>
                    <span>{{ selectedActivity.collectorName }}</span>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <h4>Loan Information</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Loan Number:</label>
                    <span>{{ selectedActivity.loanNumber }}</span>
                  </div>
                  <div class="info-item">
                    <label>Borrower:</label>
                    <span>{{ selectedActivity.borrowerName }}</span>
                  </div>
                  <div class="info-item">
                    <label>Phone:</label>
                    <span>{{ selectedActivity.borrowerPhone }}</span>
                  </div>
                  <div class="info-item" *ngIf="selectedActivity.amountCollected">
                    <label>Amount Collected:</label>
                    <span class="amount">{{ formatCurrency(selectedActivity.amountCollected) }}</span>
                  </div>
                </div>
              </div>

              <div class="info-section" *ngIf="selectedActivity.outcome">
                <h4>Outcome</h4>
                <p class="outcome-text">{{ selectedActivity.outcome }}</p>
              </div>

              <div class="info-section" *ngIf="selectedActivity.notes">
                <h4>Notes</h4>
                <p class="notes-text">{{ selectedActivity.notes }}</p>
              </div>

              <div class="info-section" *ngIf="selectedActivity.nextAction">
                <h4>Next Action</h4>
                <p class="next-action-text">{{ formatDate(selectedActivity.nextAction) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./collections.component.scss']
})
export class CollectionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  activities: CollectionActivity[] = [];
  filteredActivities: CollectionActivity[] = [];
  selectedActivity: CollectionActivity | null = null;
  showActivityModal = false;
  
  // Filters
  selectedActivityType = '';
  selectedStatus = '';
  selectedDateRange = '';
  searchTerm = '';
  
  // Stats
  collectionStats: {
    totalActivities: number;
    completedActivities: number;
    totalCollected: number;
    successRate: number;
    improvement: number;
    scheduledActivities: number;
    pendingActivities: number;
  } | null = null;
  
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
    this.loadActivities();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeColumns() {
    this.columns = [
      { key: 'activityDate', title: 'Date', type: 'date', sortable: true },
      { key: 'loanNumber', title: 'Loan Number', type: 'text', sortable: true },
      { key: 'borrowerName', title: 'Borrower', type: 'text', sortable: true },
      { key: 'activityType', title: 'Activity Type', type: 'status', sortable: true },
      { key: 'status', title: 'Status', type: 'status', sortable: true },
      { key: 'amountCollected', title: 'Amount', type: 'currency', sortable: true },
      { key: 'outcome', title: 'Outcome', type: 'text', sortable: false }
    ];
  }

  private loadActivities() {
    this.loading = true;

    // Generate mock collection activities from active loans
    this.lenderService.activeLoans$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loans => {
        this.activities = this.generateMockActivities(loans);
        this.calculateStats();
        this.filterActivities();
        this.loading = false;
      });
  }

  private generateMockActivities(loans: ActiveLoan[]): CollectionActivity[] {
    const activities: CollectionActivity[] = [];
    const types: Array<'call' | 'email' | 'sms' | 'visit' | 'payment' | 'promise_to_pay'> = ['call', 'email', 'sms', 'visit', 'payment', 'promise_to_pay'];
    const statuses: Array<'completed' | 'pending' | 'scheduled' | 'cancelled'> = ['completed', 'pending', 'scheduled', 'cancelled'];
    
    // Generate activities for overdue loans
    loans
      .filter(loan => loan.daysPastDue > 0)
      .forEach((loan, index) => {
        const type = types[Math.floor(Math.random() * types.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        
        activities.push({
          id: `ACT-${Date.now()}-${index}`,
          loanId: loan.id,
          loanNumber: loan.loanNumber,
          borrowerName: loan.borrowerName,
          borrowerPhone: loan.borrowerPhone,
          activityType: type,
          activityDate: date,
          status: status,
          outcome: status === 'completed' ? this.generateOutcome(type) : undefined,
          nextAction: status === 'scheduled' ? new Date(date.getTime() + 24 * 60 * 60 * 1000) : undefined,
          amountCollected: type === 'payment' && status === 'completed' ? loan.monthlyPayment * (0.5 + Math.random() * 0.5) : undefined,
          collectorName: 'John Doe',
          notes: `Collection activity for overdue loan ${loan.loanNumber}`
        });
      });

    return activities.sort((a, b) => b.activityDate.getTime() - a.activityDate.getTime());
  }

  private generateOutcome(type: string): string {
    const outcomes: Record<string, string[]> = {
      call: ['Borrower promised to pay within 7 days', 'Borrower requested payment plan', 'No answer, left voicemail', 'Payment arranged'],
      email: ['Email sent with payment reminder', 'Payment link sent', 'Follow-up scheduled'],
      sms: ['SMS reminder sent', 'Borrower responded via SMS'],
      visit: ['Home visit completed', 'Borrower unavailable, left notice'],
      payment: ['Partial payment received', 'Full payment received'],
      promise_to_pay: ['Promise to pay documented', 'Payment plan agreed']
    };
    
    const typeOutcomes = outcomes[type] || ['Activity completed'];
    return typeOutcomes[Math.floor(Math.random() * typeOutcomes.length)];
  }

  private calculateStats() {
    const total = this.activities.length;
    const completed = this.activities.filter(a => a.status === 'completed').length;
    const totalCollected = this.activities
      .filter(a => a.amountCollected)
      .reduce((sum, a) => sum + (a.amountCollected || 0), 0);
    const scheduled = this.activities.filter(a => a.status === 'scheduled').length;
    const pending = this.activities.filter(a => a.status === 'pending').length;
    const successRate = total > 0 ? (completed / total) * 100 : 0;

    this.collectionStats = {
      totalActivities: total,
      completedActivities: completed,
      totalCollected: totalCollected,
      successRate: successRate,
      improvement: 5.2, // Mock improvement
      scheduledActivities: scheduled,
      pendingActivities: pending
    };
  }

  filterActivities() {
    let filtered = [...this.activities];

    if (this.selectedActivityType) {
      filtered = filtered.filter(a => a.activityType === this.selectedActivityType);
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(a => a.status === this.selectedStatus);
    }

    if (this.selectedDateRange) {
      const now = new Date();
      filtered = filtered.filter(a => {
        const date = new Date(a.activityDate);
        switch (this.selectedDateRange) {
          case 'today':
            return date.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return date >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return date >= monthAgo;
          case 'quarter':
            const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            return date >= quarterAgo;
          default:
            return true;
        }
      });
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.borrowerName.toLowerCase().includes(term) ||
        a.loanNumber.toLowerCase().includes(term)
      );
    }

    this.filteredActivities = filtered;
    this.totalPages = Math.ceil(this.filteredActivities.length / this.pageSize);
  }

  openNewActivityModal() {
    // TODO: Implement new activity modal
    alert('New activity creation will be implemented');
  }

  refreshData() {
    this.loadActivities();
  }

  exportReport() {
    console.log('Export collections report');
    alert('Export functionality will be implemented');
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    const { column, direction } = event;
    
    this.filteredActivities.sort((a, b) => {
      let aValue: any = (a as any)[column];
      let bValue: any = (b as any)[column];
      
      if (column.includes('Date')) {
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
  toggleDropdown(activityId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === activityId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = activityId;
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
  viewActivity(activity: CollectionActivity) {
    this.closeDropdown();
    this.selectedActivity = activity;
    this.showActivityModal = true;
  }

  editActivity(activity: CollectionActivity) {
    this.closeDropdown();
    // TODO: Implement edit functionality
    console.log('Edit activity:', activity.id);
  }

  markAsCompleted(activity: CollectionActivity) {
    this.closeDropdown();
    // TODO: Implement mark as completed
    console.log('Mark as completed:', activity.id);
    alert('Activity marked as completed');
  }

  scheduleFollowUp(activity: CollectionActivity) {
    this.closeDropdown();
    // TODO: Implement schedule follow-up
    console.log('Schedule follow-up for:', activity.id);
    alert('Follow-up scheduled');
  }

  deleteActivity(activity: CollectionActivity) {
    this.closeDropdown();
    if (confirm(`Are you sure you want to delete this activity?`)) {
      // TODO: Implement delete
      console.log('Delete activity:', activity.id);
      this.activities = this.activities.filter(a => a.id !== activity.id);
      this.filterActivities();
      this.calculateStats();
    }
  }

  closeActivityModal() {
    this.showActivityModal = false;
    this.selectedActivity = null;
  }

  formatCurrency(amount: number): string {
    return this.lenderService.formatCurrency(amount);
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

  formatActivityType(type: string): string {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

