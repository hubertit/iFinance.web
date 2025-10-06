import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InactivityService } from '../../../core/services/inactivity.service';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { AnalogClockComponent } from '../../../shared/components/analog-clock/analog-clock.component';

@Component({
  selector: 'app-lock',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FormInputComponent, AlertComponent, AnalogClockComponent],
  template: `
    <div class="auth-page">
      <!-- Left side - Lock Form -->
      <div class="auth-section">
        <div class="auth-container">
          <div class="user-info">
            <div class="user-avatar">
              <i class="fas fa-user-circle"></i>
            </div>
            <h5>{{ userName }}</h5>
            <p class="text-muted">Your session is locked</p>
          </div>
          
          <form (ngSubmit)="unlock()" #lockForm="ngForm" class="auth-form">
            <app-form-input
              type="password"
              placeholder="Enter your password"
              iconClass="fas fa-lock"
              [(ngModel)]="password"
              name="password"
              [isInvalid]="!!error"
              [errorMessage]="error">
            </app-form-input>

            <app-alert 
              type="danger" 
              [message]="error">
            </app-alert>

            <button type="submit" class="auth-btn" [disabled]="!password">
              <i class="fas fa-unlock"></i>
              Unlock
            </button>
            
            <div class="auth-links">
              <a routerLink="/login" class="switch-account">
                <i class="fas fa-sign-out-alt"></i>
                Sign in as a different user
              </a>
            </div>
          </form>

          <div class="footer-text">
            <p>© {{ currentYear }} iFinance</p>
            <p>A comprehensive dairy farming management system</p>
            <p>Developed for Rwandan Dairy Farmers</p>
          </div>
        </div>
      </div>

      <!-- Right side - Background with Clock -->
      <div class="background-section">
        <app-analog-clock></app-analog-clock>
      </div>
    </div>
  `,
  styleUrls: ['./lock.component.scss']
})
export class LockComponent implements OnInit, OnDestroy {
  private clockInterval: any;
  userName: string = '';
  password: string = '';
  error: string = '';
  currentDate = new Date();
  currentYear = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private inactivityService: InactivityService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.name;
    }
    this.startClock();
  }

  private startClock() {
    const updateClock = () => {
      const now = new Date();
      const seconds = now.getSeconds();
      const minutes = now.getMinutes();
      const hours = now.getHours();

      // Calculate rotations
      const secondRotation = (seconds * 6) + 'deg'; // 360° / 60 = 6°
      const minuteRotation = ((minutes * 6) + (seconds * 0.1)) + 'deg'; // 360° / 60 = 6°
      const hourRotation = ((hours * 30) + (minutes * 0.5)) + 'deg'; // 360° / 12 = 30°

      // Update CSS variables
      document.documentElement.style.setProperty('--second-rotation', secondRotation);
      document.documentElement.style.setProperty('--minute-rotation', minuteRotation);
      document.documentElement.style.setProperty('--hour-rotation', hourRotation);

      // Update date
      this.currentDate = now;
    };

    // Update immediately
    updateClock();

    // Update every second
    this.clockInterval = setInterval(updateClock, 1000);
  }

  ngOnDestroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  unlock() {
    if (!this.password) return;

    this.authService.validatePassword(this.password).subscribe({
      next: (valid) => {
        if (valid) {
          this.error = '';
          this.inactivityService.unlock();
        } else {
          this.error = 'Invalid password';
          this.password = '';
        }
      },
      error: (err) => {
        this.error = 'An error occurred. Please try again.';
        console.error('Unlock error:', err);
      }
    });
  }
}