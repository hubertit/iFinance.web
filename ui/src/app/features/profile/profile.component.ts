import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, User } from '../../core/services/auth.service';
import { FeatherIconComponent } from '../../shared/components/feather-icon/feather-icon.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, FeatherIconComponent],
  template: `
    <div class="profile-container">
      <!-- Header Section -->
      <div class="profile-header">
        <div class="header-content">
          <h1>My Profile</h1>
          <p class="page-description">Manage your personal information and account settings</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="toggleEditMode()">
            <app-feather-icon [name]="isEditing ? 'x' : 'edit-3'" size="16px"></app-feather-icon>
            <span>{{ isEditing ? 'Cancel' : 'Edit Profile' }}</span>
          </button>
        </div>
      </div>

      <!-- Profile Information -->
      <div class="profile-content">
        <!-- Personal Information Card -->
        <div class="profile-card">
          <div class="card-header">
            <div class="header-info">
              <app-feather-icon name="user" size="20px"></app-feather-icon>
              <h3>Personal Information</h3>
            </div>
            <div class="kyc-status" [class]="getKycStatusClass()">
              <app-feather-icon [name]="getKycStatusIcon()" size="14px"></app-feather-icon>
              <span>{{ getKycStatusText() }}</span>
            </div>
          </div>
          <div class="card-content">
            <div class="profile-avatar-section">
              <div class="avatar-container">
                <div class="avatar" [style.background-image]="getAvatarStyle()">
                  <app-feather-icon name="user" size="32px" *ngIf="!user?.avatar"></app-feather-icon>
                </div>
                <button class="avatar-edit-btn" *ngIf="isEditing" (click)="changeAvatar()">
                  <app-feather-icon name="camera" size="14px"></app-feather-icon>
                </button>
              </div>
              <div class="avatar-info">
                <h4>{{ user?.name || 'Loading...' }}</h4>
                <p class="user-role">{{ user?.role || 'User' }}</p>
                <p class="member-since">Member since {{ formatDate(user?.createdAt) }}</p>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="name">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  [(ngModel)]="profileData.name" 
                  [readonly]="!isEditing"
                  class="form-input"
                  placeholder="Enter your full name">
              </div>

              <div class="form-group">
                <label for="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  [(ngModel)]="profileData.email" 
                  [readonly]="!isEditing"
                  class="form-input"
                  placeholder="Enter your email">
              </div>

              <div class="form-group">
                <label for="phone">Phone Number</label>
                <input 
                  type="tel" 
                  id="phone" 
                  [(ngModel)]="profileData.phoneNumber" 
                  [readonly]="!isEditing"
                  class="form-input"
                  placeholder="Enter your phone number">
              </div>

              <div class="form-group">
                <label for="idNumber">ID Number</label>
                <input 
                  type="text" 
                  id="idNumber" 
                  [(ngModel)]="profileData.idNumber" 
                  [readonly]="!isEditing"
                  class="form-input"
                  placeholder="Enter your ID number">
              </div>

              <div class="form-group full-width">
                <label for="about">About</label>
                <textarea 
                  id="about" 
                  [(ngModel)]="profileData.about" 
                  [readonly]="!isEditing"
                  class="form-textarea"
                  placeholder="Tell us about yourself"
                  rows="3"></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Address Information Card -->
        <div class="profile-card">
          <div class="card-header">
            <div class="header-info">
              <app-feather-icon name="map-pin" size="20px"></app-feather-icon>
              <h3>Address Information</h3>
            </div>
          </div>
          <div class="card-content">
            <div class="form-grid">
              <div class="form-group">
                <label for="province">Province</label>
                <select 
                  id="province" 
                  [(ngModel)]="profileData.province" 
                  [disabled]="!isEditing"
                  class="form-select">
                  <option value="">Select Province</option>
                  <option value="Kigali">Kigali</option>
                  <option value="Northern">Northern Province</option>
                  <option value="Southern">Southern Province</option>
                  <option value="Eastern">Eastern Province</option>
                  <option value="Western">Western Province</option>
                </select>
              </div>

              <div class="form-group">
                <label for="district">District</label>
                <input 
                  type="text" 
                  id="district" 
                  [(ngModel)]="profileData.district" 
                  [readonly]="!isEditing"
                  class="form-input"
                  placeholder="Enter your district">
              </div>

              <div class="form-group">
                <label for="sector">Sector</label>
                <input 
                  type="text" 
                  id="sector" 
                  [(ngModel)]="profileData.sector" 
                  [readonly]="!isEditing"
                  class="form-input"
                  placeholder="Enter your sector">
              </div>

              <div class="form-group">
                <label for="cell">Cell</label>
                <input 
                  type="text" 
                  id="cell" 
                  [(ngModel)]="profileData.cell" 
                  [readonly]="!isEditing"
                  class="form-input"
                  placeholder="Enter your cell">
              </div>

              <div class="form-group">
                <label for="village">Village</label>
                <input 
                  type="text" 
                  id="village" 
                  [(ngModel)]="profileData.village" 
                  [readonly]="!isEditing"
                  class="form-input"
                  placeholder="Enter your village">
              </div>

              <div class="form-group full-width">
                <label for="address">Full Address</label>
                <textarea 
                  id="address" 
                  [(ngModel)]="profileData.address" 
                  [readonly]="!isEditing"
                  class="form-textarea"
                  placeholder="Enter your complete address"
                  rows="2"></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Account Information Card -->
        <div class="profile-card">
          <div class="card-header">
            <div class="header-info">
              <app-feather-icon name="credit-card" size="20px"></app-feather-icon>
              <h3>Account Information</h3>
            </div>
          </div>
          <div class="card-content">
            <div class="account-info-grid">
              <div class="info-item">
                <label>Account Type</label>
                <span class="info-value">{{ user?.accountType || 'Individual' }}</span>
              </div>
              <div class="info-item">
                <label>Account Code</label>
                <span class="info-value">{{ user?.accountCode || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <label>Account Name</label>
                <span class="info-value">{{ user?.accountName || user?.name || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <label>Role</label>
                <span class="info-value">{{ user?.role || 'User' }}</span>
              </div>
              <div class="info-item">
                <label>Status</label>
                <span class="status-badge" [class]="user?.isActive ? 'active' : 'inactive'">
                  {{ user?.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="info-item">
                <label>Last Login</label>
                <span class="info-value">{{ formatDate(user?.lastLoginAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="profile-actions" *ngIf="isEditing">
          <button class="btn-primary" (click)="saveProfile()" [disabled]="isSaving">
            <app-feather-icon name="save" size="16px" *ngIf="!isSaving"></app-feather-icon>
            <app-feather-icon name="loader" size="16px" *ngIf="isSaving" class="spinning"></app-feather-icon>
            <span>{{ isSaving ? 'Saving...' : 'Save Changes' }}</span>
          </button>
          <button class="btn-secondary" (click)="cancelEdit()">
            <app-feather-icon name="x" size="16px"></app-feather-icon>
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  user: User | null = null;
  isEditing = false;
  isSaving = false;
  
  profileData = {
    name: '',
    email: '',
    phoneNumber: '',
    idNumber: '',
    about: '',
    province: '',
    district: '',
    sector: '',
    cell: '',
    village: '',
    address: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserProfile() {
    this.authService.getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.user = user;
          this.populateProfileData();
        },
        error: (error) => {
          console.error('Failed to load profile:', error);
          // Handle error - maybe redirect to login
        }
      });
  }

  populateProfileData() {
    if (this.user) {
      this.profileData = {
        name: this.user.name || '',
        email: this.user.email || '',
        phoneNumber: this.user.phoneNumber || '',
        idNumber: this.user.idNumber || '',
        about: this.user.about || '',
        province: this.user.province || '',
        district: this.user.district || '',
        sector: this.user.sector || '',
        cell: this.user.cell || '',
        village: this.user.village || '',
        address: this.user.address || ''
      };
    }
  }

  toggleEditMode() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.populateProfileData(); // Reset to original data
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.populateProfileData(); // Reset to original data
  }

  saveProfile() {
    if (!this.user) return;
    
    this.isSaving = true;
    
    // Simulate API call
    setTimeout(() => {
      // Update user data
      this.user = {
        ...this.user,
        name: this.profileData.name,
        email: this.profileData.email,
        phoneNumber: this.profileData.phoneNumber,
        idNumber: this.profileData.idNumber,
        about: this.profileData.about,
        province: this.profileData.province,
        district: this.profileData.district,
        sector: this.profileData.sector,
        cell: this.profileData.cell,
        village: this.profileData.village,
        address: this.profileData.address
      };
      
      this.isSaving = false;
      this.isEditing = false;
      
      // Show success message
      console.log('Profile updated successfully');
    }, 1000);
  }

  changeAvatar() {
    // TODO: Implement avatar change functionality
    console.log('Change avatar clicked');
  }

  getAvatarStyle(): string {
    if (this.user?.avatar) {
      return `url(${this.user.avatar})`;
    }
    return '';
  }

  getKycStatusClass(): string {
    switch (this.user?.kycStatus) {
      case 'verified': return 'verified';
      case 'pending': return 'pending';
      case 'rejected': return 'rejected';
      default: return 'not-verified';
    }
  }

  getKycStatusIcon(): string {
    switch (this.user?.kycStatus) {
      case 'verified': return 'check-circle';
      case 'pending': return 'clock';
      case 'rejected': return 'x-circle';
      default: return 'alert-circle';
    }
  }

  getKycStatusText(): string {
    switch (this.user?.kycStatus) {
      case 'verified': return 'Verified';
      case 'pending': return 'Pending Review';
      case 'rejected': return 'Rejected';
      default: return 'Not Verified';
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Never';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  }
}
