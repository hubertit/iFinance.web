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

  constructor(private authService: AuthService) {}

  getMenuItems(): MenuItem[] {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return [];
    }

    const userRole = currentUser.role?.toLowerCase();
    
    switch (userRole) {
      case 'lender':
        return this.getLenderMenuItems();
      case 'customer':
        return this.getCustomerMenuItems();
      case 'admin':
        return this.getAdminMenuItems();
      default:
        return this.getCustomerMenuItems(); // Default to customer menu
    }
  }

  private getLenderMenuItems(): MenuItem[] {
    return [
      {
        title: 'Dashboard',
        icon: 'home',
        path: 'lender/dashboard'
      },
      {
        title: 'Loan Applications',
        icon: 'file-text',
        path: 'lender/applications'
      },
      {
        title: 'Loan Products',
        icon: 'package',
        path: 'lender/products'
      },
      {
        title: 'Analytics',
        icon: 'bar-chart-2',
        path: 'analytics'
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
          }
        ]
      }
    ];
  }

  private getCustomerMenuItems(): MenuItem[] {
    return [
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
          }
        ]
      }
    ];
  }

  private getAdminMenuItems(): MenuItem[] {
    return [
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
  }
}