import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { InactivityService } from './core/services/inactivity.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'iFinance';

  constructor(
    private router: Router,
    private inactivityService: InactivityService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Start monitoring user activity when logged in
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.authService.isLoggedIn() && 
          !this.router.url.includes('/login') && 
          !this.router.url.includes('/lock')) {
        this.inactivityService.init();
      } else {
        this.inactivityService.stop();
      }
    });
  }

  ngOnDestroy() {
    this.inactivityService.stop();
  }
}