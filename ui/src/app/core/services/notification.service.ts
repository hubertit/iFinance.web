import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface TransactionNotification {
  id: string;
  type: 'transaction_received' | 'transaction_sent' | 'payment_completed' | 'payment_failed' | 'loan_approved' | 'loan_rejected' | 'savings_goal_reached' | 'insurance_claim_approved' | 'insurance_claim_rejected';
  title: string;
  message: string;
  amount?: number;
  currency?: string;
  transactionId?: string;
  timestamp: Date;
  read: boolean;
  icon: string;
  priority: 'low' | 'medium' | 'high';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<TransactionNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    this.initializeMockNotifications();
  }

  private initializeMockNotifications(): void {
    const mockNotifications: TransactionNotification[] = [
      {
        id: 'notif_1',
        type: 'transaction_received',
        title: 'Money Received',
        message: 'You received RWF 25,000 from John Doe',
        amount: 25000,
        currency: 'RWF',
        transactionId: 'txn_001',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        read: false,
        icon: 'arrow-down-left',
        priority: 'high'
      },
      {
        id: 'notif_2',
        type: 'payment_completed',
        title: 'Payment Successful',
        message: 'Your payment of RWF 15,000 to Electricity Company was successful',
        amount: 15000,
        currency: 'RWF',
        transactionId: 'txn_002',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        read: false,
        icon: 'check-circle',
        priority: 'medium'
      },
      {
        id: 'notif_3',
        type: 'loan_approved',
        title: 'Loan Approved',
        message: 'Your loan application for RWF 500,000 has been approved',
        amount: 500000,
        currency: 'RWF',
        transactionId: 'loan_001',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        icon: 'dollar-sign',
        priority: 'high'
      },
      {
        id: 'notif_4',
        type: 'savings_goal_reached',
        title: 'Savings Goal Achieved',
        message: 'Congratulations! You have reached your Emergency Fund goal',
        amount: 1000000,
        currency: 'RWF',
        transactionId: 'savings_001',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        read: true,
        icon: 'trending-up',
        priority: 'medium'
      },
      {
        id: 'notif_5',
        type: 'transaction_sent',
        title: 'Money Sent',
        message: 'You sent RWF 10,000 to Jane Smith',
        amount: 10000,
        currency: 'RWF',
        transactionId: 'txn_003',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        read: true,
        icon: 'arrow-up-right',
        priority: 'low'
      },
      {
        id: 'notif_6',
        type: 'insurance_claim_approved',
        title: 'Insurance Claim Approved',
        message: 'Your auto insurance claim for RWF 75,000 has been approved',
        amount: 75000,
        currency: 'RWF',
        transactionId: 'claim_001',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        read: true,
        icon: 'shield',
        priority: 'high'
      }
    ];

    this.notificationsSubject.next(mockNotifications);
    this.updateUnreadCount();
  }

  getNotifications(): Observable<TransactionNotification[]> {
    return this.notifications$;
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }

  markAsRead(notificationId: string): void {
    const notifications = this.notificationsSubject.value;
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    );
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
  }

  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value;
    const updatedNotifications = notifications.map(notification => 
      ({ ...notification, read: true })
    );
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
  }

  deleteNotification(notificationId: string): void {
    const notifications = this.notificationsSubject.value;
    const updatedNotifications = notifications.filter(notification => 
      notification.id !== notificationId
    );
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
  }

  addNotification(notification: Omit<TransactionNotification, 'id' | 'timestamp'>): void {
    const newNotification: TransactionNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: new Date()
    };
    
    const notifications = this.notificationsSubject.value;
    this.notificationsSubject.next([newNotification, ...notifications]);
    this.updateUnreadCount();
  }

  private updateUnreadCount(): void {
    const notifications = this.notificationsSubject.value;
    const unreadCount = notifications.filter(notification => !notification.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  // Helper method to create transaction-based notifications
  createTransactionNotification(
    type: TransactionNotification['type'],
    amount: number,
    currency: string = 'RWF',
    transactionId: string,
    additionalInfo?: string
  ): void {
    const notificationConfig = this.getNotificationConfig(type, amount, currency, additionalInfo);
    
    this.addNotification({
      type,
      title: notificationConfig.title,
      message: notificationConfig.message,
      amount,
      currency,
      transactionId,
      read: false,
      icon: notificationConfig.icon,
      priority: notificationConfig.priority
    });
  }

  private getNotificationConfig(
    type: TransactionNotification['type'],
    amount: number,
    currency: string,
    additionalInfo?: string
  ) {
    const formattedAmount = new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: currency
    }).format(amount);

    switch (type) {
      case 'transaction_received':
        return {
          title: 'Money Received',
          message: `You received ${formattedAmount} from ${additionalInfo || 'Unknown'}`,
          icon: 'arrow-down-left',
          priority: 'high' as const
        };
      case 'transaction_sent':
        return {
          title: 'Money Sent',
          message: `You sent ${formattedAmount} to ${additionalInfo || 'Unknown'}`,
          icon: 'arrow-up-right',
          priority: 'low' as const
        };
      case 'payment_completed':
        return {
          title: 'Payment Successful',
          message: `Your payment of ${formattedAmount} to ${additionalInfo || 'Merchant'} was successful`,
          icon: 'check-circle',
          priority: 'medium' as const
        };
      case 'payment_failed':
        return {
          title: 'Payment Failed',
          message: `Your payment of ${formattedAmount} to ${additionalInfo || 'Merchant'} failed`,
          icon: 'x-circle',
          priority: 'high' as const
        };
      case 'loan_approved':
        return {
          title: 'Loan Approved',
          message: `Your loan application for ${formattedAmount} has been approved`,
          icon: 'dollar-sign',
          priority: 'high' as const
        };
      case 'loan_rejected':
        return {
          title: 'Loan Rejected',
          message: `Your loan application for ${formattedAmount} was rejected`,
          icon: 'x-circle',
          priority: 'medium' as const
        };
      case 'savings_goal_reached':
        return {
          title: 'Savings Goal Achieved',
          message: `Congratulations! You have reached your ${additionalInfo || 'savings'} goal of ${formattedAmount}`,
          icon: 'trending-up',
          priority: 'medium' as const
        };
      case 'insurance_claim_approved':
        return {
          title: 'Insurance Claim Approved',
          message: `Your insurance claim for ${formattedAmount} has been approved`,
          icon: 'shield',
          priority: 'high' as const
        };
      case 'insurance_claim_rejected':
        return {
          title: 'Insurance Claim Rejected',
          message: `Your insurance claim for ${formattedAmount} was rejected`,
          icon: 'x-circle',
          priority: 'medium' as const
        };
      default:
        return {
          title: 'Notification',
          message: 'You have a new notification',
          icon: 'bell',
          priority: 'low' as const
        };
    }
  }
}
