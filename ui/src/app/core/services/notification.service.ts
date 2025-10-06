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
        message: 'You received RWF 45,000 from Jean Baptiste',
        amount: 45000,
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
        message: 'Your payment of RWF 12,500 to EWSA (Electricity) was successful',
        amount: 12500,
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
        message: 'Your business loan application for RWF 750,000 has been approved',
        amount: 750000,
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
        message: 'Congratulations! You have reached your Umuganda Savings goal',
        amount: 500000,
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
        message: 'You sent RWF 8,000 to Marie Claire for school fees',
        amount: 8000,
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
        message: 'Your health insurance claim for RWF 125,000 has been approved',
        amount: 125000,
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

    // Rwanda names pool for realistic notifications
    const rwandaNames = [
      'Jean Baptiste', 'Marie Claire', 'François', 'Immaculée', 'Théophile', 'Véronique',
      'Emmanuel', 'Claudine', 'Pacifique', 'Joséphine', 'Innocent', 'Béatrice',
      'Fidèle', 'Glorieuse', 'Séraphin', 'Angélique', 'Boniface', 'Célestine'
    ];

    const randomName = rwandaNames[Math.floor(Math.random() * rwandaNames.length)];

    switch (type) {
      case 'transaction_received':
        return {
          title: 'Money Received',
          message: `You received ${formattedAmount} from ${additionalInfo || randomName}`,
          icon: 'arrow-down-left',
          priority: 'high' as const
        };
      case 'transaction_sent':
        return {
          title: 'Money Sent',
          message: `You sent ${formattedAmount} to ${additionalInfo || randomName}`,
          icon: 'arrow-up-right',
          priority: 'low' as const
        };
      case 'payment_completed':
        const rwandaMerchants = [
          'EWSA (Electricity)', 'WASAC (Water)', 'MTN Rwanda', 'Airtel Rwanda', 
          'Kigali Bus Services', 'Kigali Market', 'Nyabugogo Taxi Park',
          'Kimisagara Market', 'Nyamirambo Market', 'Remera Market'
        ];
        const randomMerchant = rwandaMerchants[Math.floor(Math.random() * rwandaMerchants.length)];
        return {
          title: 'Payment Successful',
          message: `Your payment of ${formattedAmount} to ${additionalInfo || randomMerchant} was successful`,
          icon: 'check-circle',
          priority: 'medium' as const
        };
      case 'payment_failed':
        return {
          title: 'Payment Failed',
          message: `Your payment of ${formattedAmount} to ${additionalInfo || 'Merchant'} failed. Please try again.`,
          icon: 'x-circle',
          priority: 'high' as const
        };
      case 'loan_approved':
        return {
          title: 'Loan Approved',
          message: `Your business loan application for ${formattedAmount} has been approved by Ihuzo Finance`,
          icon: 'dollar-sign',
          priority: 'high' as const
        };
      case 'loan_rejected':
        return {
          title: 'Loan Rejected',
          message: `Your loan application for ${formattedAmount} was rejected. Contact support for more information.`,
          icon: 'x-circle',
          priority: 'medium' as const
        };
      case 'savings_goal_reached':
        const savingsGoals = [
          'Umuganda Savings', 'Education Fund', 'Emergency Fund', 'Business Capital',
          'Home Improvement', 'Wedding Fund', 'Medical Fund', 'Retirement Fund'
        ];
        const randomGoal = savingsGoals[Math.floor(Math.random() * savingsGoals.length)];
        return {
          title: 'Savings Goal Achieved',
          message: `Congratulations! You have reached your ${additionalInfo || randomGoal} goal of ${formattedAmount}`,
          icon: 'trending-up',
          priority: 'medium' as const
        };
      case 'insurance_claim_approved':
        return {
          title: 'Insurance Claim Approved',
          message: `Your health insurance claim for ${formattedAmount} has been approved by Ihuzo Insurance`,
          icon: 'shield',
          priority: 'high' as const
        };
      case 'insurance_claim_rejected':
        return {
          title: 'Insurance Claim Rejected',
          message: `Your insurance claim for ${formattedAmount} was rejected. Contact Ihuzo Insurance for details.`,
          icon: 'x-circle',
          priority: 'medium' as const
        };
      default:
        return {
          title: 'New Notification',
          message: 'You have a new notification from Ihuzo Finance',
          icon: 'bell',
          priority: 'low' as const
        };
    }
  }
}
