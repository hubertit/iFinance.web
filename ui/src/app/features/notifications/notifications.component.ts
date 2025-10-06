import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../shared/components/feather-icon/feather-icon.component';
import { NotificationService, TransactionNotification } from '../../core/services/notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent],
  template: `
    <div class="notifications-container">
      <!-- Header -->
      <div class="notifications-header">
        <div class="header-content">
          <h1>Notifications</h1>
          <p class="page-description">Manage your transaction and system notifications</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="markAllAsRead()" [disabled]="unreadCount === 0">
            <app-feather-icon name="check" size="16px"></app-feather-icon>
            <span>Mark All Read</span>
          </button>
          <button class="btn-primary" (click)="refreshNotifications()">
            <app-feather-icon name="refresh-cw" size="16px"></app-feather-icon>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="filters-section">
        <div class="search-box">
          <app-feather-icon name="search" size="16px"></app-feather-icon>
          <input 
            type="text" 
            placeholder="Search notifications..." 
            [(ngModel)]="searchTerm"
            (input)="onSearchChange()">
        </div>
        
        <div class="filter-controls">
          <select [(ngModel)]="selectedType" (change)="onFilterChange()">
            <option value="">All Types</option>
            <option value="transaction_received">Money Received</option>
            <option value="transaction_sent">Money Sent</option>
            <option value="payment_completed">Payment Completed</option>
            <option value="payment_failed">Payment Failed</option>
            <option value="loan_approved">Loan Approved</option>
            <option value="loan_rejected">Loan Rejected</option>
            <option value="savings_goal_reached">Savings Goal</option>
            <option value="insurance_claim_approved">Insurance Claim</option>
            <option value="insurance_claim_rejected">Insurance Rejected</option>
          </select>
          
          <select [(ngModel)]="selectedStatus" (change)="onFilterChange()">
            <option value="">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          
          <select [(ngModel)]="selectedPriority" (change)="onFilterChange()">
            <option value="">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      <!-- Notifications List -->
      <div class="notifications-list" *ngIf="!isLoading">
        <div class="notification-item" 
             *ngFor="let notification of filteredNotifications"
             [class.unread]="!notification.read"
             [class]="getNotificationPriorityClass(notification.priority)"
             (click)="toggleNotification(notification)">
          <div class="notification-icon" [class]="getNotificationTypeClass(notification.type)">
            <app-feather-icon [name]="notification.icon" size="16px"></app-feather-icon>
          </div>
          
          <div class="notification-content">
            <div class="notification-header">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-time">{{ formatNotificationTime(notification.timestamp) }}</div>
            </div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-meta" *ngIf="notification.amount">
              <span class="notification-amount">{{ formatCurrency(notification.amount) }}</span>
              <span class="notification-transaction" *ngIf="notification.transactionId">
                Transaction #{{ notification.transactionId }}
              </span>
            </div>
          </div>
          
          <div class="notification-actions">
            <button class="action-btn" 
                    [class.read]="notification.read"
                    (click)="toggleReadStatus(notification.id, $event)">
              <app-feather-icon 
                [name]="notification.read ? 'eye-off' : 'eye'" 
                size="14px">
              </app-feather-icon>
            </button>
            <button class="action-btn delete" (click)="deleteNotification(notification.id, $event)">
              <app-feather-icon name="trash-2" size="14px"></app-feather-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="loading-spinner">
          <app-feather-icon name="loader" size="24px"></app-feather-icon>
        </div>
        <p>Loading notifications...</p>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!isLoading && filteredNotifications.length === 0">
        <app-feather-icon name="bell-off" size="48px"></app-feather-icon>
        <h3>No notifications found</h3>
        <p>No notifications match your current filters</p>
        <button class="btn-primary" (click)="clearFilters()">Clear Filters</button>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="filteredNotifications.length > 0">
        <button class="btn-secondary" [disabled]="currentPage === 1" (click)="previousPage()">
          <app-feather-icon name="chevron-left" size="16px"></app-feather-icon>
          Previous
        </button>
        
        <div class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </div>
        
        <button class="btn-secondary" [disabled]="currentPage === totalPages" (click)="nextPage()">
          Next
          <app-feather-icon name="chevron-right" size="16px"></app-feather-icon>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  notifications: TransactionNotification[] = [];
  filteredNotifications: TransactionNotification[] = [];
  isLoading = false;
  unreadCount = 0;
  
  // Filter properties
  searchTerm = '';
  selectedType = '';
  selectedStatus = '';
  selectedPriority = '';
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadNotifications();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications() {
    this.isLoading = true;
    
    this.notificationService.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
        this.applyFilters();
        this.isLoading = false;
      });

    this.notificationService.getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  applyFilters() {
    let filtered = [...this.notifications];

    // Search filter
    if (this.searchTerm) {
      filtered = filtered.filter(notification => 
        notification.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        notification.type.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (this.selectedType) {
      filtered = filtered.filter(notification => 
        notification.type === this.selectedType
      );
    }

    // Status filter
    if (this.selectedStatus) {
      const isRead = this.selectedStatus === 'read';
      filtered = filtered.filter(notification => 
        notification.read === isRead
      );
    }

    // Priority filter
    if (this.selectedPriority) {
      filtered = filtered.filter(notification => 
        notification.priority === this.selectedPriority
      );
    }

    this.filteredNotifications = filtered;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredNotifications.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredNotifications = this.filteredNotifications.slice(startIndex, endIndex);
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.selectedPriority = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilters();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFilters();
    }
  }

  toggleNotification(notification: TransactionNotification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id);
    }
  }

  toggleReadStatus(notificationId: string, event: Event) {
    event.stopPropagation();
    this.notificationService.markAsRead(notificationId);
  }

  deleteNotification(notificationId: string, event: Event) {
    event.stopPropagation();
    this.notificationService.deleteNotification(notificationId);
    this.applyFilters();
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }

  refreshNotifications() {
    this.loadNotifications();
  }

  getNotificationTypeClass(type: string): string {
    switch(type) {
      case 'transaction_received':
        return 'success';
      case 'transaction_sent':
        return 'info';
      case 'payment_completed':
        return 'success';
      case 'payment_failed':
        return 'danger';
      case 'loan_approved':
        return 'success';
      case 'loan_rejected':
        return 'danger';
      case 'savings_goal_reached':
        return 'success';
      case 'insurance_claim_approved':
        return 'success';
      case 'insurance_claim_rejected':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  getNotificationPriorityClass(priority: string): string {
    switch(priority) {
      case 'high':
        return 'high-priority';
      case 'medium':
        return 'medium-priority';
      case 'low':
        return 'low-priority';
      default:
        return '';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-RW', { 
      style: 'currency', 
      currency: 'RWF' 
    }).format(amount);
  }

  formatNotificationTime(timestamp: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  }
}
