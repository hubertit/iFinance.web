import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AuthLayoutComponent } from '../../../shared/components/auth-layout/auth-layout.component';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, AuthLayoutComponent, FormInputComponent, AlertComponent],
  template: `
    <app-auth-layout 
      title="Log In to iFinance"
      authLinkText="New Here?"
      authLinkLabel="Create Account"
      authLinkRoute="/register">
      
      <ng-template #formTemplate>
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
          <app-form-input
            type="text"
            placeholder="Email or Phone Number"
            iconClass="fas fa-user"
            formControlName="identifier"
            [isInvalid]="!!(loginForm.get('identifier')?.invalid && loginForm.get('identifier')?.touched)"
            errorMessage="Please enter a valid email or phone number">
          </app-form-input>

          <app-form-input
            type="password"
            placeholder="Password"
            iconClass="fas fa-lock"
            formControlName="password"
            [isInvalid]="!!(loginForm.get('password')?.invalid && loginForm.get('password')?.touched)"
            errorMessage="Password is required"
            [showPasswordToggle]="true">
          </app-form-input>

          <app-alert 
            type="danger" 
            [message]="errorMessage">
          </app-alert>
          
          <app-alert 
            type="success" 
            [message]="successMessage">
          </app-alert>

          <button type="submit" class="auth-btn" [disabled]="loginForm.invalid || isLoading">
            <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
            {{ isLoading ? 'Logging in...' : 'Log In' }}
          </button>

          <div class="auth-links">
            <a routerLink="/forgot-password" class="forgot-password-link">
              Forgot Password?
            </a>
          </div>
        </form>
      </ng-template>
    </app-auth-layout>
  `,
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isSuccess = false;

      constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
      ) {
        this.loginForm = this.fb.group({
          identifier: ['', [Validators.required]], // Empty placeholder
          password: ['', Validators.required] // Empty placeholder
        });
      }

  ngOnInit(): void {
    // Component initialization
  }

      onSubmit(): void {
        if (this.loginForm.valid) {
          this.isLoading = true;
          this.errorMessage = '';

          const { identifier, password } = this.loginForm.value;

          // Use direct API call with HttpClient
          this.authService.login(identifier, password).subscribe({
            next: (user) => {
              console.log('🔧 LoginComponent: Login successful:', user);
              this.isLoading = false;
              this.isSuccess = true;
              this.successMessage = '';
              this.errorMessage = '';
              // Redirect immediately
              this.router.navigate(['/dashboard']);
            },
            error: (error) => {
              console.log('🔧 LoginComponent: Login failed:', error);
              this.isLoading = false;
              this.isSuccess = false;
              this.errorMessage = error;
              this.successMessage = '';
            }
          });
        } else {
          Object.keys(this.loginForm.controls).forEach(key => {
            const control = this.loginForm.get(key);
            if (control?.invalid) {
              control.markAsTouched();
            }
          });
        }
      }
}