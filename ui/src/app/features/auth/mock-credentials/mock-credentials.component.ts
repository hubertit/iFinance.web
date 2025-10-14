import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { MockCredentialsService, MockCredentials } from '../../../core/services/mock-credentials.service';

@Component({
  selector: 'app-mock-credentials',
  standalone: true,
  imports: [CommonModule, RouterModule, FeatherIconComponent],
  template: `
    <div class="mock-credentials">
      <div class="container">
        <div class="header">
          <h1>Mock Credentials for Testing</h1>
          <p class="subtitle">Use these credentials to test different user roles and features</p>
        </div>

        <div class="credentials-grid">
          <div class="credential-card" *ngFor="let cred of credentials">
            <div class="card-header">
              <div class="role-badge" [class]="'role-' + cred.role">
                {{ getRoleDisplayName(cred.role) }}
              </div>
              <div class="card-actions">
                <button class="copy-btn" (click)="copyCredentials(cred)">
                  <app-feather-icon name="copy" size="16px"></app-feather-icon>
                </button>
              </div>
            </div>
            
            <div class="card-body">
              <div class="user-info">
                <h3>{{ cred.name }}</h3>
                <p class="description">{{ cred.description }}</p>
              </div>
              
              <div class="credentials-info">
                <div class="credential-item">
                  <label>Email:</label>
                  <span class="credential-value">{{ cred.email }}</span>
                </div>
                <div class="credential-item">
                  <label>Password:</label>
                  <span class="credential-value">{{ cred.password }}</span>
                </div>
              </div>
              
              <div class="features-section">
                <h4>Available Features:</h4>
                <ul class="features-list">
                  <li *ngFor="let feature of cred.features">
                    <app-feather-icon name="check" size="14px"></app-feather-icon>
                    {{ feature }}
                  </li>
                </ul>
              </div>
            </div>
            
            <div class="card-footer">
              <button class="login-btn" (click)="navigateToLogin(cred)">
                <app-feather-icon name="log-in" size="16px"></app-feather-icon>
                Login as {{ cred.name.split(' ')[0] }}
              </button>
            </div>
          </div>
        </div>

        <div class="instructions">
          <h2>How to Use</h2>
          <div class="instruction-steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>Choose a Role</h3>
                <p>Select the user role you want to test (Lender, Customer, Admin, etc.)</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>Copy Credentials</h3>
                <p>Click the copy button to copy the email and password to your clipboard</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>Login</h3>
                <p>Use the copied credentials to login and explore the features for that role</p>
              </div>
            </div>
          </div>
        </div>

        <div class="role-info">
          <h2>Role Descriptions</h2>
          <div class="role-descriptions">
            <div class="role-description" *ngFor="let role of availableRoles">
              <h3>{{ getRoleDisplayName(role) }}</h3>
              <p>{{ getRoleDescription(role) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./mock-credentials.component.scss']
})
export class MockCredentialsComponent implements OnInit {
  credentials: MockCredentials[] = [];
  availableRoles: string[] = [];

  constructor(private mockCredentialsService: MockCredentialsService) {}

  ngOnInit() {
    this.credentials = this.mockCredentialsService.getMockCredentials();
    this.availableRoles = this.mockCredentialsService.getAvailableRoles();
  }

  getRoleDisplayName(role: string): string {
    return this.mockCredentialsService.getRoleDisplayName(role);
  }

  getRoleDescription(role: string): string {
    return this.mockCredentialsService.getRoleDescription(role);
  }

  copyCredentials(cred: MockCredentials) {
    const credentialsText = `Email: ${cred.email}\nPassword: ${cred.password}`;
    navigator.clipboard.writeText(credentialsText).then(() => {
      // Show success message (you could implement a toast notification here)
      console.log('Credentials copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy credentials:', err);
    });
  }

  navigateToLogin(cred: MockCredentials) {
    // Navigate to login page with pre-filled credentials
    // You could implement this by passing the credentials as query parameters
    // or storing them in a service for the login component to pick up
    console.log('Navigate to login with credentials:', cred);
  }
}
