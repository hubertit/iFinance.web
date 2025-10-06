import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-test-api',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="test-api-container">
      <h2>API Integration Test</h2>
      
      <div class="test-section">
        <h3>Login Test</h3>
        <div class="form-group">
          <input type="text" [(ngModel)]="loginIdentifier" placeholder="Email or Phone" class="form-control">
          <input type="password" [(ngModel)]="loginPassword" placeholder="Password" class="form-control">
          <button (click)="testLogin()" [disabled]="isLoading" class="btn btn-primary">
            {{ isLoading ? 'Testing...' : 'Test Login' }}
          </button>
        </div>
        <div *ngIf="loginResult" class="result">
          <h4>Login Result:</h4>
          <pre>{{ loginResult | json }}</pre>
        </div>
      </div>

      <div class="test-section">
        <h3>Register Test</h3>
        <div class="form-group">
          <input type="text" [(ngModel)]="registerData.name" placeholder="Name" class="form-control">
          <input type="text" [(ngModel)]="registerData.accountName" placeholder="Account Name" class="form-control">
          <input type="email" [(ngModel)]="registerData.email" placeholder="Email" class="form-control">
          <input type="tel" [(ngModel)]="registerData.phoneNumber" placeholder="Phone" class="form-control">
          <input type="password" [(ngModel)]="registerData.password" placeholder="Password" class="form-control">
          <select [(ngModel)]="registerData.accountType" class="form-control">
            <option value="">Select Account Type</option>
            <option value="farmer">Farmer</option>
            <option value="veterinarian">Veterinarian</option>
            <option value="supplier">Supplier</option>
            <option value="customer">Customer</option>
            <option value="agent">Agent</option>
            <option value="collector">Collector</option>
            <option value="mcc">MCC</option>
          </select>
          <button (click)="testRegister()" [disabled]="isLoading" class="btn btn-success">
            {{ isLoading ? 'Testing...' : 'Test Register' }}
          </button>
        </div>
        <div *ngIf="registerResult" class="result">
          <h4>Register Result:</h4>
          <pre>{{ registerResult | json }}</pre>
        </div>
      </div>

      <div class="test-section">
        <h3>Profile Test</h3>
        <button (click)="testGetProfile()" [disabled]="isLoading" class="btn btn-info">
          {{ isLoading ? 'Testing...' : 'Test Get Profile' }}
        </button>
        <div *ngIf="profileResult" class="result">
          <h4>Profile Result:</h4>
          <pre>{{ profileResult | json }}</pre>
        </div>
      </div>

      <div class="test-section">
        <h3>Password Reset Test</h3>
        <div class="form-group">
          <input type="email" [(ngModel)]="resetEmail" placeholder="Email" class="form-control">
          <button (click)="testPasswordReset()" [disabled]="isLoading" class="btn btn-warning">
            {{ isLoading ? 'Testing...' : 'Test Password Reset' }}
          </button>
        </div>
        <div *ngIf="resetResult" class="result">
          <h4>Password Reset Result:</h4>
          <pre>{{ resetResult | json }}</pre>
        </div>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .test-api-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .test-section {
      margin-bottom: 30px;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-control {
      width: 100%;
      padding: 8px 12px;
      margin-bottom: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 10px;
    }
    
    .btn-primary { background-color: #007bff; color: white; }
    .btn-success { background-color: #28a745; color: white; }
    .btn-info { background-color: #17a2b8; color: white; }
    .btn-warning { background-color: #ffc107; color: black; }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .result {
      margin-top: 15px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 4px;
    }
    
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .alert {
      padding: 15px;
      margin-bottom: 20px;
      border: 1px solid transparent;
      border-radius: 4px;
    }
    
    .alert-danger {
      color: #721c24;
      background-color: #f8d7da;
      border-color: #f5c6cb;
    }
  `]
})
export class TestApiComponent {
  isLoading = false;
  errorMessage = '';
  
  // Login test data
  loginIdentifier = '';
  loginPassword = '';
  loginResult: any = null;
  
  // Register test data
  registerData = {
    name: '',
    accountName: '',
    email: '',
    phoneNumber: '',
    password: '',
    accountType: ''
  };
  registerResult: any = null;
  
  // Profile test data
  profileResult: any = null;
  
  // Password reset test data
  resetEmail = '';
  resetResult: any = null;

  constructor(private authService: AuthService) {}

  testLogin() {
    if (!this.loginIdentifier || !this.loginPassword) {
      this.errorMessage = 'Please enter both identifier and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.loginResult = null;

    this.authService.login(this.loginIdentifier, this.loginPassword).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.loginResult = result;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error;
      }
    });
  }

  testRegister() {
    if (!this.registerData.name || !this.registerData.accountName || !this.registerData.phoneNumber || !this.registerData.password || !this.registerData.accountType) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.registerResult = null;

    this.authService.register(this.registerData).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.registerResult = result;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error;
      }
    });
  }

  testGetProfile() {
    this.isLoading = true;
    this.errorMessage = '';
    this.profileResult = null;

    this.authService.getProfile().subscribe({
      next: (result) => {
        this.isLoading = false;
        this.profileResult = result;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error;
      }
    });
  }

  testPasswordReset() {
    if (!this.resetEmail) {
      this.errorMessage = 'Please enter an email address';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.resetResult = null;

    this.authService.requestPasswordReset(this.resetEmail).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.resetResult = result;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error;
      }
    });
  }
}
