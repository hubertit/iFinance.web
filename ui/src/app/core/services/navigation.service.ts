import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface MenuItem {
  title: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  roles?: string[];
  expanded?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: 'home',
      path: 'dashboard'
    },
    {
      title: 'Wallets',
      icon: 'credit-card',
      children: [
        {
          title: 'My Wallets',
          path: 'wallets'
        },
        {
          title: 'Wallet Management',
          children: [
            {
              title: 'Top Up',
              path: 'wallets/topup'
            },
            {
              title: 'Withdraw',
              path: 'wallets/withdraw'
            },
            {
              title: 'Transfer',
              path: 'wallets/transfer'
            }
          ]
        }
      ]
    },
    {
      title: 'Transactions',
      icon: 'swap-horizontal',
      children: [
        {
          title: 'All Transactions',
          path: 'transactions'
        },
        {
          title: 'Payment Types',
          children: [
            {
              title: 'Payments',
              path: 'transactions/payments'
            },
            {
              title: 'Transfers',
              path: 'transactions/transfers'
            },
            {
              title: 'Request Payment',
              path: 'transactions/request'
            }
          ]
        }
      ]
    },
    {
      title: 'Loans',
      icon: 'dollar-sign',
      children: [
        {
          title: 'My Loans',
          path: 'loans'
        },
        {
          title: 'Apply for Loan',
          path: 'loans/apply'
        },
        {
          title: 'Repayments',
          path: 'loans/repayments'
        }
      ]
    },
    {
      title: 'Savings',
      icon: 'piggy-bank',
      children: [
        {
          title: 'Savings Goals',
          path: 'savings'
        },
        {
          title: 'Create Goal',
          path: 'savings/create'
        },
        {
          title: 'Savings History',
          path: 'savings/history'
        }
      ]
    },
    {
      title: 'Insurance',
      icon: 'shield',
      children: [
        {
          title: 'My Policies',
          path: 'insurance'
        },
        {
          title: 'Purchase Insurance',
          path: 'insurance/purchase'
        },
        {
          title: 'Claims',
          path: 'insurance/claims'
        }
      ]
    },
    {
      title: 'Merchant',
      icon: 'store',
      children: [
        {
          title: 'Merchant Dashboard',
          path: 'merchant/dashboard'
        },
        {
          title: 'Business Analytics',
          path: 'merchant/analytics'
        },
        {
          title: 'Payment Processing',
          path: 'merchant/payments'
        }
      ]
    },
    {
      title: 'Chat',
      icon: 'message-circle',
      path: 'chat'
    },
    {
      title: 'Settings',
      icon: 'settings',
      children: [
        {
          title: 'Profile',
          path: 'settings/profile'
        },
        {
          title: 'Security',
          path: 'settings/security'
        },
        {
          title: 'Notifications',
          path: 'settings/notifications'
        },
        {
          title: 'Help & Support',
          path: 'settings/help'
        },
        {
          title: 'About',
          path: 'settings/about'
        }
      ]
    }
  ];

  constructor(private authService: AuthService) {}

  getMenuItems(): MenuItem[] {
    // Return all menu items for the comprehensive fintech app
    return this.menuItems;
  }
}