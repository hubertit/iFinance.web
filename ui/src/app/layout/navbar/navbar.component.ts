import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, Account } from '../../core/services/auth.service';
import { WalletService, Wallet } from '../../core/services/wallet.service';
import { FeatherIconComponent } from '../../shared/components/feather-icon/feather-icon.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconComponent],
  template: `
    <nav class="navbar" [class.sidebar-collapsed]="isSidebarCollapsed">
      <div class="navbar-left">
        <button class="menu-toggle" (click)="onToggleSidebar()">
          <app-feather-icon name="menu" size="18px"></app-feather-icon>
        </button>
        
        <div class="datetime-display">
          <div class="time">{{ currentTime }}</div>
          <div class="date">{{ currentDate }}</div>
        </div>
      </div>

      <div class="navbar-right">
        <div class="nav-item notification-item" (click)="toggleNotificationPanel()">
          <button class="icon-button">
            <app-feather-icon name="bell" size="18px"></app-feather-icon>
            <span class="badge">3</span>
          </button>

          <!-- Notification Panel -->
          <div class="notification-panel" *ngIf="showNotificationPanel">
            <div class="panel-header">
              <h6>Notifications</h6>
              <span class="notification-count">3 new</span>
            </div>
            
            <div class="notification-list">
              <div class="notification-item" *ngFor="let notification of notifications">
                <div class="notification-avatar">
                  <app-feather-icon [name]="notification.icon" size="16px"></app-feather-icon>
                </div>
                <div class="notification-content">
                  <div class="notification-title">{{ notification.title }}</div>
                  <div class="notification-message">{{ notification.message }}</div>
                  <div class="notification-time">{{ notification.time }}</div>
                </div>
                <div class="notification-status" [class.unread]="!notification.read"></div>
              </div>
            </div>

            <div class="panel-footer">
              <button class="view-all-btn" (click)="viewAllNotifications()">
                <app-feather-icon name="eye" size="14px"></app-feather-icon>
                <span>View All Notifications</span>
              </button>
            </div>
          </div>
        </div>

        <div class="nav-item message-item" (click)="toggleMessagePanel()">
          <button class="icon-button">
            <app-feather-icon name="mail" size="18px"></app-feather-icon>
            <span class="badge">5</span>
          </button>

          <!-- Message Panel -->
          <div class="message-panel" *ngIf="showMessagePanel">
            <div class="panel-header">
              <h6>Messages</h6>
              <span class="message-count">5 new</span>
            </div>
            
            <div class="message-list">
              <div class="message-item" *ngFor="let message of messages">
                <div class="message-avatar">
                  <img [src]="message.avatar" [alt]="message.sender" class="avatar-img">
                </div>
                <div class="message-content">
                  <div class="message-sender">{{ message.sender }}</div>
                  <div class="message-preview">{{ message.preview }}</div>
                  <div class="message-time">{{ message.time }}</div>
                </div>
                <div class="message-status" [class.unread]="!message.read"></div>
              </div>
            </div>

            <div class="panel-footer">
              <button class="view-all-btn" (click)="viewAllMessages()">
                <app-feather-icon name="mail" size="14px"></app-feather-icon>
                <span>View All Messages</span>
              </button>
            </div>
          </div>
        </div>

        <div class="nav-item language-switcher" (click)="toggleLanguageMenu()">
          <button class="language-button">
            <img [src]="currentLanguage.flag" [alt]="currentLanguage.name" class="language-flag">
            <span class="language-name">{{ currentLanguage.code }}</span>
            <app-feather-icon name="chevron-down" size="14px"></app-feather-icon>
          </button>

          <!-- Language Dropdown Menu -->
          <div class="language-menu" *ngIf="showLanguageMenu">
            <div class="menu-items">
              <button 
                class="language-option" 
                *ngFor="let language of languages"
                [class.active]="language.code === currentLanguage.code"
                (click)="selectLanguage(language)">
                <img [src]="language.flag" [alt]="language.name" class="flag">
                <span class="name">{{ language.name }}</span>
                <app-feather-icon name="check" size="14px" *ngIf="language.code === currentLanguage.code"></app-feather-icon>
              </button>
            </div>
          </div>
        </div>

        <div class="nav-item user-profile" (click)="toggleUserMenu()">
          <img [src]="currentWallet?.avatar || 'assets/img/logo.png'" [alt]="currentWallet?.name" class="avatar">
          <div class="user-info">
            <span class="user-name">{{ currentWallet?.name || 'Main Wallet' }}</span>
            <span class="user-role">{{ formatBalance(currentWallet?.balance || 0) }}</span>
          </div>
          <app-feather-icon name="chevron-down" size="16px"></app-feather-icon>

          <!-- User Dropdown Menu -->
          <div class="user-menu" *ngIf="showUserMenu">
            <div class="menu-header">
              <img [src]="currentWallet?.avatar || 'assets/img/logo.png'" [alt]="currentWallet?.name" class="avatar">
              <div>
                <h6>{{ currentWallet?.name || 'Main Wallet' }}</h6>
                <span>{{ formatBalance(currentWallet?.balance || 0) }}</span>
              </div>
            </div>
            
            <!-- Wallet Switcher Section -->
            <div class="account-switcher-section">
              <div class="section-header">
                <h6>Switch Wallet</h6>
                <button class="add-account-btn" (click)="addNewWallet()">
                  <app-feather-icon name="plus" size="14px"></app-feather-icon>
                </button>
              </div>
              <div class="account-options">
                <button 
                  class="account-option" 
                  *ngFor="let wallet of availableWallets"
                  [class.active]="wallet.id === currentWallet?.id"
                  (click)="selectWallet(wallet)">
                  <img [src]="wallet.avatar || 'assets/img/logo.png'" [alt]="wallet.name" class="avatar">
                  <div class="account-details">
                    <span class="name">{{ wallet.name }}</span>
                    <span class="role">{{ formatBalance(wallet.balance) }}</span>
                  </div>
                  <app-feather-icon name="check" size="14px" *ngIf="wallet.id === currentWallet?.id"></app-feather-icon>
                </button>
              </div>
            </div>

            <div class="divider"></div>
            
            <div class="menu-items">
              <a href="javascript:void(0)" class="menu-item">
                <app-feather-icon name="user" size="16px"></app-feather-icon>
                <span>My Profile</span>
              </a>
              <a href="javascript:void(0)" class="menu-item">
                <app-feather-icon name="settings" size="16px"></app-feather-icon>
                <span>Settings</span>
              </a>
              <div class="divider"></div>
              <a href="javascript:void(0)" class="menu-item" (click)="lockScreen()">
                <app-feather-icon name="lock" size="16px"></app-feather-icon>
                <span>Lock Screen</span>
              </a>
              <a href="javascript:void(0)" class="menu-item" (click)="logout()">
                <app-feather-icon name="log-out" size="16px"></app-feather-icon>
                <span>Logout</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() isSidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  userName: string;
  userRole: string;
  showUserMenu = false;
  showLanguageMenu = false;
  showNotificationPanel = false;
  showMessagePanel = false;
  
  currentWallet: Wallet | null = null;
  availableWallets: Wallet[] = [];
  
  currentTime: string = '';
  currentDate: string = '';
  private timeInterval: any;

  notifications = [
    {
      id: 1,
      title: 'New Customer Added',
      message: 'John Doe has been added to your customer list',
      time: '2 minutes ago',
      icon: 'user-plus',
      read: false
    },
    {
      id: 2,
      title: 'Payment Received',
      message: 'Payment of RWF 15,000 received from Jane Smith',
      time: '1 hour ago',
      icon: 'dollar-sign',
      read: false
    },
    {
      id: 3,
      title: 'System Update',
      message: 'Your system has been updated to version 2.1.0',
      time: '3 hours ago',
      icon: 'download',
      read: true
    }
  ];

  messages = [
    {
      id: 1,
      sender: 'Jane Smith',
      preview: 'Thank you for the quick delivery! The milk quality is excellent.',
      time: '5 minutes ago',
      avatar: 'assets/img/user.png',
      read: false
    },
    {
      id: 2,
      sender: 'Mike Johnson',
      preview: 'Can we schedule the next delivery for tomorrow morning?',
      time: '1 hour ago',
      avatar: 'assets/img/user.png',
      read: false
    },
    {
      id: 3,
      sender: 'Sarah Wilson',
      preview: 'The payment has been processed successfully. Thank you!',
      time: '2 hours ago',
      avatar: 'assets/img/user.png',
      read: true
    },
    {
      id: 4,
      sender: 'David Brown',
      preview: 'I would like to increase my weekly order to 20 liters.',
      time: '3 hours ago',
      avatar: 'assets/img/user.png',
      read: false
    },
    {
      id: 5,
      sender: 'Lisa Davis',
      preview: 'The delivery was perfect as always. See you next week!',
      time: '1 day ago',
      avatar: 'assets/img/user.png',
      read: true
    }
  ];


  currentLanguage = {
    code: 'EN',
    name: 'English',
    flag: 'assets/img/flags/us.svg'
  };

  languages = [
    {
      code: 'EN',
      name: 'English',
      flag: 'assets/img/flags/us.svg'
    },
    {
      code: 'FR',
      name: 'Français',
      flag: 'assets/img/flags/fr.svg'
    },
    {
      code: 'RW',
      name: 'Kinyarwanda',
      flag: 'assets/img/flags/rw.svg'
    }
  ];

  constructor(
    private authService: AuthService,
    private walletService: WalletService,
    private router: Router
  ) {
    const user = this.authService.getCurrentUser();
    this.userName = user?.name || 'User';
    this.userRole = user?.role || 'Guest';

    // Load wallet data from WalletService
    this.loadWalletData();
  }

  ngOnInit() {
    this.updateDateTime();
    // Update time every second
    this.timeInterval = setInterval(() => {
      this.updateDateTime();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private updateDateTime() {
    const now = new Date();
    
    // Format time (HH:MM:SS)
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Format date (Day, Month DD, YYYY)
    this.currentDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showLanguageMenu = false;
    this.showNotificationPanel = false;
  }

  toggleNotificationPanel(): void {
    this.showNotificationPanel = !this.showNotificationPanel;
    this.showUserMenu = false;
    this.showLanguageMenu = false;
    this.showMessagePanel = false;
  }

  toggleMessagePanel(): void {
    this.showMessagePanel = !this.showMessagePanel;
    this.showUserMenu = false;
    this.showLanguageMenu = false;
    this.showNotificationPanel = false;
  }

  viewAllNotifications(): void {
    this.showNotificationPanel = false;
    // TODO: Navigate to full notifications page
    console.log('View all notifications clicked');
  }

  viewAllMessages(): void {
    this.showMessagePanel = false;
    // TODO: Navigate to full messages page
    console.log('View all messages clicked');
  }

  selectAccount(account: Account): void {
    // This method is kept for backward compatibility but not used in wallet switching
    console.log('Account switching not implemented in wallet mode');
  }

  private loadAccountsFromAPI(): void {
    // This method is kept for backward compatibility but not used in wallet switching
    console.log('Account loading not implemented in wallet mode');
  }

  addNewAccount(): void {
    this.showUserMenu = false;
    // TODO: Implement add new account logic
    console.log('Add new account clicked');
  }

  // Wallet-related methods
  private loadWalletData(): void {
    this.walletService.wallets$.subscribe(wallets => {
      this.availableWallets = wallets;
    });

    this.walletService.currentWallet$.subscribe(wallet => {
      this.currentWallet = wallet;
    });
  }

  selectWallet(wallet: Wallet): void {
    this.walletService.switchWallet(wallet.id);
    this.showUserMenu = false;
  }

  addNewWallet(): void {
    this.showUserMenu = false;
    // TODO: Implement add new wallet logic
    console.log('Add new wallet clicked');
  }

  formatBalance(balance: number): string {
    return this.walletService.formatBalance(balance);
  }

  toggleLanguageMenu(): void {
    this.showLanguageMenu = !this.showLanguageMenu;
    this.showUserMenu = false;
  }

  selectLanguage(language: any): void {
    this.currentLanguage = language;
    this.showLanguageMenu = false;
    // TODO: Implement language change logic
    console.log('Language changed to:', language.name);
  }

  lockScreen(): void {
    this.showUserMenu = false;
    this.router.navigate(['/lock']);
  }

  logout(): void {
    this.showUserMenu = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}