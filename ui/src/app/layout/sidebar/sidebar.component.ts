import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationService, MenuItem } from '../../core/services/navigation.service';
import { FeatherIconComponent } from '../../shared/components/feather-icon/feather-icon.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconComponent],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed">
      <div class="sidebar-header">
        <div class="logo-container">
          <img src="assets/img/logo.png" alt="iFinance Logo" class="logo">
          <span class="logo-text" *ngIf="!isCollapsed">iFinance</span>
        </div>
      </div>

      <div class="user-info" *ngIf="!isCollapsed">
        <div class="user-avatar">
          <img [src]="userAvatar" [alt]="userName">
        </div>
        <div class="user-details text-center">
          <h5 class="user-name">{{ userName }}</h5>
          <span class="user-role">{{ userRole }}</span>
        </div>
      </div>

      <div class="sidebar-content">
        <nav class="sidebar-nav">
          <ng-container *ngFor="let item of menuItems">
            <!-- Menu Item with Children -->
            <div class="nav-item" *ngIf="item.children" [class.active]="isMenuActive(item)">
              <a class="nav-link" (click)="toggleSubmenu(item)">
                <app-feather-icon [name]="item.icon" size="16px" *ngIf="item.icon"></app-feather-icon>
                <span class="nav-text" *ngIf="!isCollapsed">{{ item.title }}</span>
                <app-feather-icon name="chevron-right" size="12px" *ngIf="!isCollapsed"
                   [class.rotated]="item.expanded"></app-feather-icon>
              </a>
              <div class="submenu" *ngIf="item.expanded && !isCollapsed">
                <a *ngFor="let child of item.children"
                   [routerLink]="child.path"
                   routerLinkActive="active"
                   class="submenu-item">
                  {{ child.title }}
                </a>
              </div>
            </div>

            <!-- Single Menu Item -->
            <div class="nav-item" *ngIf="!item.children">
              <a class="nav-link" [routerLink]="[item.path]" routerLinkActive="active">
                <app-feather-icon [name]="item.icon" size="16px" *ngIf="item.icon"></app-feather-icon>
                <span class="nav-text" *ngIf="!isCollapsed">{{ item.title }}</span>
              </a>
            </div>
          </ng-container>
        </nav>
      </div>

    </aside>
  `,
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() isCollapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  menuItems: MenuItem[] = [];
  userName: string = '';
  userRole: string = '';
  userAvatar: string = '/assets/img/user.png';

  constructor(
    private navigationService: NavigationService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.updateMenuItems();
    this.updateUserInfo();
    
    // Listen for user changes to update menu
    const user = this.authService.getCurrentUser();
    if (user) {
      this.updateMenuItems();
      this.updateUserInfo();
    }
  }

  private updateMenuItems(): void {
    this.menuItems = this.navigationService.getMenuItems();
  }

  private updateUserInfo(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.name;
      this.userRole = user.role || user.accountType || 'User';
      if (user.avatar) {
        this.userAvatar = user.avatar;
      }
    }
  }

  toggleSubmenu(item: MenuItem): void {
    item.expanded = !item.expanded;
    // Close other submenus
    this.menuItems.forEach(menuItem => {
      if (menuItem !== item) {
        menuItem.expanded = false;
      }
    });
  }

  isMenuActive(item: MenuItem): boolean {
    if (!item.children) {
      return false;
    }
    return item.children.some(child =>
      window.location.pathname.startsWith(child.path || '')
    );
  }
}
