import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ConfigService } from '../../../core/services/config.service';
import { AuthLayoutComponent } from '../../../shared/components/auth-layout/auth-layout.component';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { User } from '../../../core/services/auth.service';

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
        private router: Router,
        private configService: ConfigService,
        private http: HttpClient
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

          // Check for DJYH lender credentials (any email ending with @djyh.rw)
          if (identifier.toLowerCase().endsWith('@djyh.rw')) {
            this.handleDjyhLenderLogin(identifier, password);
            return;
          }

          // Check for static lender credentials
          if (identifier.toLowerCase() === 'lender@ifinance.rw' && password === 'Pass123') {
            // Create mock lender user matching User interface
            const lenderUser: any = {
              id: 'lender-001',
              name: 'Lender Institution',
              email: 'lender@ifinance.rw',
              phoneNumber: '+250788000000',
              role: 'lender',
              accountType: 'lender',
              accountCode: 'LND001',
              accountName: 'Lender Institution',
              avatar: undefined,
              createdAt: new Date(),
              lastLoginAt: new Date(),
              isActive: true,
              token: 'lender-static-token-' + Date.now(),
              permissions: {}
            };

            // Store lender user data in localStorage
            localStorage.setItem('ihuzofinance.user', JSON.stringify(lenderUser));
            localStorage.setItem('ihuzofinance.token', lenderUser.token);
            localStorage.setItem('ihuzofinance.isLoggedIn', 'true');
            localStorage.setItem('ifinance.currentAccount', JSON.stringify({
              account_id: 999,
              account_code: 'LND001',
              account_name: 'Lender Institution',
              account_type: 'lender',
              role: 'lender'
            }));

            this.isLoading = false;
            this.isSuccess = true;
            this.successMessage = '';
            this.errorMessage = '';
            
            // Navigate to dashboard - sidebar will load menu based on lender role from localStorage
            this.router.navigate(['/dashboard']);
            return;
          }

          // Use direct API call with HttpClient for regular login
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

      private handleDjyhLenderLogin(email: string, password: string): void {
        const loginData = {
          email: email,
          password: password
        };

        // Try proxy first, fallback to direct API call
        const proxyUrl = '/djyh-api/api/v1/auth/login';
        const directUrl = 'https://www.djyh.rw/api/v1/auth/login';
        
        // Use HttpClient - try proxy first
        this.http.post<any>(proxyUrl, loginData).subscribe({
          next: (data: any) => {
            this.handleDjyhLoginSuccess(data);
          },
          error: (proxyError) => {
            console.warn('🔧 LoginComponent: Proxy failed, trying direct API call:', proxyError);
            // Fallback to direct API call using fetch with CORS
            this.tryDirectApiCall(directUrl, loginData);
          }
        });
      }

      private tryDirectApiCall(url: string, loginData: any): void {
        // Try direct call first
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(loginData),
          mode: 'cors'
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data: any) => {
          this.handleDjyhLoginSuccess(data);
        })
        .catch((corsError) => {
          console.warn('🔧 LoginComponent: Direct API call blocked by CORS, trying CORS proxy:', corsError);
          // Fallback: Use a CORS proxy service (for development only)
          // Note: In production, you should use your own backend proxy
          this.tryCorsProxy(url, loginData);
        });
      }

      private tryCorsProxy(originalUrl: string, loginData: any): void {
        // If proxy and direct call both fail, show helpful error message
        console.error('🔧 LoginComponent: All API attempts failed. Please restart the dev server with: ng serve');
        this.isLoading = false;
        this.isSuccess = false;
        this.errorMessage = 'Unable to connect to authentication server. Please restart the Angular dev server (ng serve) to activate the proxy configuration.';
        this.successMessage = '';
      }

      private handleDjyhLoginSuccess(data: any): void {
        console.log('🔧 LoginComponent: DJYH API response:', data);
        
        if (data.success && data.user && data.token) {
          const djyhUser = data.user;
          
          // Map DJYH response to our User interface
          // Convert permissions array to object format
          const permissionsObj: { [key: string]: boolean } = {};
          if (Array.isArray(djyhUser.permissions)) {
            djyhUser.permissions.forEach((perm: string) => {
              permissionsObj[perm] = true;
            });
          }

          const lenderUser: User = {
            id: djyhUser.id,
            name: djyhUser.name,
            email: djyhUser.email,
            phoneNumber: djyhUser.mvend_linked_msisdn ? `+${djyhUser.mvend_linked_msisdn}` : '',
            role: 'lender', // Map EMPLOYER role to lender
            accountType: 'lender',
            accountCode: djyhUser.mvend_wallet_id || 'LND001',
            accountName: djyhUser.name,
            avatar: djyhUser.avatar,
            createdAt: new Date(),
            lastLoginAt: new Date(),
            isActive: true,
            token: data.token,
            permissions: permissionsObj
          };

          // Create account object
          const lenderAccount = {
            account_id: parseInt(djyhUser.mvend_wallet_id) || 999,
            account_code: djyhUser.mvend_wallet_id || 'LND001',
            account_name: djyhUser.name,
            account_type: 'lender',
            account_status: 'active',
            account_created_at: new Date().toISOString(),
            role: 'lender',
            permissions: permissionsObj,
            user_account_status: 'active',
            access_granted_at: new Date().toISOString(),
            is_default: true,
            avatar: djyhUser.avatar
          };

          // Store user data in localStorage using the same keys as AuthService
          localStorage.setItem(this.configService.userKey, JSON.stringify(lenderUser));
          localStorage.setItem(this.configService.tokenKey, data.token);
          localStorage.setItem(this.configService.loginKey, 'true');
          localStorage.setItem('ifinance.currentAccount', JSON.stringify(lenderAccount));
          localStorage.setItem('ifinance.availableAccounts', JSON.stringify([lenderAccount]));

          this.isLoading = false;
          this.isSuccess = true;
          this.successMessage = '';
          this.errorMessage = '';
          
          // Navigate to lender dashboard
          this.router.navigate(['/lender/dashboard']);
        } else {
          throw new Error(data.message || 'Login failed');
        }
      }
}