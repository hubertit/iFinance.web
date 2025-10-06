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
    // Show all menu items for Ihuzo Finance
    return this.menuItems;
  }
}