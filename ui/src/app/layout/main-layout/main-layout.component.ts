import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent],
  template: `
    <div class="main-container" [class.sidebar-collapsed]="isSidebarCollapsed">
      <app-navbar 
        [isSidebarCollapsed]="isSidebarCollapsed"
        (toggleSidebar)="toggleSidebar()">
      </app-navbar>
      <app-sidebar
        [isCollapsed]="isSidebarCollapsed"
        (toggleCollapse)="toggleSidebar()">
      </app-sidebar>
      <div class="page-wrapper" (click)="onPageClick()">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  private readonly MOBILE_BREAKPOINT = 992; // Bootstrap's lg breakpoint

  ngOnInit() {
    // Set initial state based on screen size
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    if (typeof window !== 'undefined') {
      this.isSidebarCollapsed = window.innerWidth < this.MOBILE_BREAKPOINT;
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  onPageClick(): void {
    // Close sidebar on mobile when clicking outside
    if (typeof window !== 'undefined' && window.innerWidth < this.MOBILE_BREAKPOINT && this.isSidebarCollapsed) {
      this.isSidebarCollapsed = false;
    }
  }
}