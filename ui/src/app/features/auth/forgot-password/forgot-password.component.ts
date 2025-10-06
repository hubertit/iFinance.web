import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormInputComponent, AlertComponent],
  template: `
    <div class="auth-page">
      <!-- Left side - Forgot Password Form -->
      <div class="login-section">
        <div class="login-container">
          <div class="logo-container">
            <img src="assets/img/logo.png" alt="iFinance Logo" class="logo">
          </div>
          <h1>Reset <span>Password</span></h1>
          
          <div class="new-user">
            <span>Remember your password? </span>
            <a routerLink="/login">Sign In</a>
          </div>

          <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="login-form">
            <app-form-input
              type="email"
              placeholder="Enter your email address"
              iconClass="fas fa-envelope"
              formControlName="email"
              [isInvalid]="!!(forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched)"
              errorMessage="Please enter a valid email address">
            </app-form-input>

            <app-alert 
              type="success" 
              [message]="successMessage">
            </app-alert>

            <app-alert 
              type="danger" 
              [message]="errorMessage">
            </app-alert>

            <button type="submit" class="login-btn" [disabled]="forgotPasswordForm.invalid || isLoading">
              <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
            </button>

            <div class="auth-links">
              <a routerLink="/login" class="back-to-login-link">
                ← Back to Login
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
        <div class="analog-clock">
          <div class="clock-face">
            <div class="numbers">
              <span>12</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
              <span>7</span>
              <span>8</span>
              <span>9</span>
              <span>10</span>
              <span>11</span>
            </div>
            <div class="hand hour-hand"></div>
            <div class="hand minute-hand"></div>
            <div class="hand second-hand"></div>
            <div class="center-dot"></div>
          </div>
          <div class="date">{{ currentTime | date:'EEEE, MMMM d, y' }}</div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  currentTime = new Date();
  currentYear = new Date().getFullYear();
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Update time every second
    setInterval(() => {
      this.currentTime = new Date();
      this.updateClockHands();
    }, 1000);
  }

  private updateClockHands(): void {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours() % 12;

    // Calculate rotation angles
    const secondDegrees = (seconds / 60) * 360;
    const minuteDegrees = ((minutes + seconds / 60) / 60) * 360;
    const hourDegrees = ((hours + minutes / 60) / 12) * 360;

    // Update hand rotations using CSS custom properties
    document.documentElement.style.setProperty('--second-rotation', `${secondDegrees}deg`);
    document.documentElement.style.setProperty('--minute-rotation', `${minuteDegrees}deg`);
    document.documentElement.style.setProperty('--hour-rotation', `${hourDegrees}deg`);
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { email } = this.forgotPasswordForm.value;

      this.authService.requestPasswordReset(email).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Password reset link has been sent to your email address. Please check your inbox and follow the instructions.';
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error;
        }
      });
    } else {
      Object.keys(this.forgotPasswordForm.controls).forEach(key => {
        const control = this.forgotPasswordForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }
}
