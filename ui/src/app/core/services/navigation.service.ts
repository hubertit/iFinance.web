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
  // Lender-specific menu items (typical banking institution structure)
  private lenderMenuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: 'home',
      path: 'lender/dashboard'
    },
    {
      title: 'Loan Applications',
      icon: 'file-text',
      path: 'lender/loan-applications'
    },
    {
      title: 'Active Loans',
      icon: 'dollar-sign',
      path: 'lender/active-loans'
    },
    {
      title: 'Loan Portfolio',
      icon: 'briefcase',
      children: [
        {
          title: 'Portfolio Overview',
          path: 'lender/portfolio/overview'
        },
        {
          title: 'Loan Performance',
          path: 'lender/portfolio/performance'
        },
        {
          title: 'Delinquency Management',
          path: 'lender/portfolio/delinquency'
        },
        {
          title: 'Collections',
          path: 'lender/portfolio/collections'
        }
      ]
    },
    {
      title: 'Credit Assessment',
      icon: 'check-circle',
      children: [
        {
          title: 'Credit Scoring',
          path: 'lender/credit/scoring'
        },
        {
          title: 'Risk Analysis',
          path: 'lender/credit/risk-analysis'
        },
        {
          title: 'KYC Verification',
          path: 'lender/credit/kyc'
        }
      ]
    },
    {
      title: 'Borrowers',
      icon: 'users',
      children: [
        {
          title: 'Borrower List',
          path: 'lender/borrowers/list'
        },
        {
          title: 'Borrower Profiles',
          path: 'lender/borrowers/profiles'
        },
        {
          title: 'Borrower History',
          path: 'lender/borrowers/history'
        },
        {
          title: 'Add New Borrower',
          path: 'lender/borrowers/add'
        }
      ]
    },
    {
      title: 'Disbursements',
      icon: 'send',
      path: 'lender/disbursements'
    },
    {
      title: 'Repayments',
      icon: 'trending-up',
      children: [
        {
          title: 'Repayment Schedule',
          path: 'lender/repayments/schedule'
        },
        {
          title: 'Payment Tracking',
          path: 'lender/repayments/tracking'
        },
        {
          title: 'Overdue Payments',
          path: 'lender/repayments/overdue'
        }
      ]
    },
    {
      title: 'Financials',
      icon: 'dollar-sign',
      children: [
        {
          title: 'Revenue & Income',
          path: 'lender/revenue'
        },
        {
          title: 'Interest Rates',
          path: 'lender/interest-rates'
        },
        {
          title: 'Fee Management',
          path: 'lender/fees'
        },
        {
          title: 'Accounting',
          path: 'lender/accounting'
        }
      ]
    },
    {
      title: 'Reports & Analytics',
      icon: 'bar-chart-2',
      children: [
        {
          title: 'Loan Reports',
          path: 'lender/reports/loans'
        },
        {
          title: 'Performance Reports',
          path: 'lender/reports/performance'
        },
        {
          title: 'Financial Reports',
          path: 'lender/reports/financial'
        },
        {
          title: 'Regulatory Reports',
          path: 'lender/reports/regulatory'
        },
        {
          title: 'Custom Reports',
          path: 'lender/reports/custom'
        }
      ]
    },
    {
      title: 'Settings',
      icon: 'settings',
      children: [
        {
          title: 'Loan Products',
          path: 'lender/products'
        },
        {
          title: 'Loan Terms',
          path: 'lender/terms'
        },
        {
          title: 'User Management',
          path: 'lender/users'
        },
        {
          title: 'Profile',
          path: 'profile'
        },
        {
          title: 'Notifications',
          path: 'notifications'
        },
        {
          title: 'Security',
          path: 'settings/security'
        },
        {
          title: 'Help & Support',
          path: 'settings/help'
        }
      ]
    }
  ];

  // Customer menu items (default)
  private customerMenuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: 'home',
      path: 'dashboard'
    },
    {
      title: 'Ikofi',
      icon: 'credit-card',
      path: 'ikofi'
    },
    {
      title: 'Transactions',
      icon: 'send',
      path: 'transactions'
    },
    {
      title: 'Loans',
      icon: 'dollar-sign',
      path: 'loans'
    },
    {
      title: 'Savings',
      icon: 'trending-up',
      path: 'savings'
    },
    {
      title: 'Insurance',
      icon: 'shield',
      path: 'insurance'
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
          title: 'Notifications',
          path: 'settings/notifications'
        },
        {
          title: 'Security',
          path: 'settings/security'
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

  // Admin menu items
  private adminMenuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: 'home',
      path: 'dashboard'
    },
    {
      title: 'Users',
      icon: 'users',
      path: 'users'
    },
    {
      title: 'Analytics',
      icon: 'bar-chart-2',
      path: 'analytics'
    },
    {
      title: 'System',
      icon: 'settings',
      children: [
        {
          title: 'Configuration',
          path: 'admin/config'
        },
        {
          title: 'Logs',
          path: 'admin/logs'
        },
        {
          title: 'Reports',
          path: 'admin/reports'
        }
      ]
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
          title: 'Notifications',
          path: 'settings/notifications'
        },
        {
          title: 'Security',
          path: 'settings/security'
        }
      ]
    }
  ];

  constructor(private authService: AuthService) {}

  getMenuItems(): MenuItem[] {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return [];
    }

    const userRole = (currentUser.role || currentUser.accountType || '').toLowerCase();
    
    switch (userRole) {
      case 'lender':
        return this.lenderMenuItems;
      case 'admin':
        return this.adminMenuItems;
      case 'customer':
      default:
        return this.customerMenuItems;
    }
  }
}