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
      title: 'Feed',
      icon: 'rss',
      path: 'feed'
    },
    {
      title: 'Customers',
      icon: 'users',
      path: 'customers/list'
    },
    {
      title: 'Suppliers',
      icon: 'truck',
      path: 'suppliers/list'
    },
    {
      title: 'Collections',
      icon: 'package',
      path: 'collections'
    },
    {
      title: 'Sales',
      icon: 'shopping-cart',
      path: 'sales'
    },
      {
        title: 'Ikofi',
        icon: 'dollar-sign',
        path: 'ikofi'
      },
    {
      title: 'Chats',
      icon: 'message-circle',
      path: 'chats'
    },
    {
      title: 'Settings',
      icon: 'settings',
      children: [
        {
          title: 'General Settings',
          path: 'settings/general'
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
    // Hide specific items temporarily (Feed, Chats, Settings)
    const hiddenTitles = new Set(['Feed', 'Chats', 'Settings']);

    const filtered = this.menuItems
      .filter(item => !hiddenTitles.has(item.title));

    return filtered.map(item => {
      if (item.children) {
        return {
          ...item,
          children: item.children?.filter(child => !hiddenTitles.has(child.title))
        };
      }
      return item;
    });
  }
}