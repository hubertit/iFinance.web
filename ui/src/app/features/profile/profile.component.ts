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

        <!-- KYC Information Card -->
        <div class="profile-card">
          <div class="card-header">
            <div class="header-info">
              <app-feather-icon name="shield" size="20px"></app-feather-icon>
              <h3>KYC Information</h3>
            </div>
            <div class="kyc-status" [class]="getKycStatusClass()">
              <app-feather-icon [name]="getKycStatusIcon()" size="14px"></app-feather-icon>
              <span>{{ getKycStatusText() }}</span>
            </div>
          </div>
          <div class="card-content">
            <div class="kyc-section">
              <div class="kyc-info">
                <div class="kyc-item">
                  <label>KYC Status</label>
                  <span class="kyc-status-badge" [class]="getKycStatusClass()">
                    {{ getKycStatusText() }}
                  </span>
                </div>
                <div class="kyc-item">
                  <label>ID Number</label>
                  <span class="kyc-value">{{ user?.idNumber || 'Not provided' }}</span>
                </div>
                <div class="kyc-item">
                  <label>Verification Date</label>
                  <span class="kyc-value">{{ getKycVerificationDate() }}</span>
                </div>
              </div>
            </div>

            <!-- NID Photo Upload Section -->
            <div class="nid-upload-section">
              <h4>National ID Documents</h4>
              <p class="upload-description">Upload clear photos of your National ID front and back for verification</p>
              
              <div class="nid-photos-grid">
                <!-- NID Front -->
                <div class="nid-photo-container">
                  <div class="photo-upload-area" 
                       [class.has-image]="kycData.nidFront"
                       (click)="selectNidPhoto('front')"
                       (dragover)="onDragOver($event)"
                       (drop)="onDrop($event, 'front')">
                    <div class="photo-preview" *ngIf="kycData.nidFront">
                      <img [src]="kycData.nidFront" alt="NID Front" class="nid-image">
                      <button class="remove-photo" (click)="removeNidPhoto('front', $event)">
                        <app-feather-icon name="x" size="14px"></app-feather-icon>
                      </button>
                    </div>
                    <div class="upload-placeholder" *ngIf="!kycData.nidFront">
                      <app-feather-icon name="camera" size="24px"></app-feather-icon>
                      <span>NID Front</span>
                      <small>Click or drag to upload</small>
                    </div>
                  </div>
                  <div class="photo-status" [class]="getPhotoStatusClass('front')">
                    <app-feather-icon [name]="getPhotoStatusIcon('front')" size="12px"></app-feather-icon>
                    <span>{{ getPhotoStatusText('front') }}</span>
                  </div>
                </div>

                <!-- NID Back -->
                <div class="nid-photo-container">
                  <div class="photo-upload-area" 
                       [class.has-image]="kycData.nidBack"
                       (click)="selectNidPhoto('back')"
                       (dragover)="onDragOver($event)"
                       (drop)="onDrop($event, 'back')">
                    <div class="photo-preview" *ngIf="kycData.nidBack">
                      <img [src]="kycData.nidBack" alt="NID Back" class="nid-image">
                      <button class="remove-photo" (click)="removeNidPhoto('back', $event)">
                        <app-feather-icon name="x" size="14px"></app-feather-icon>
                      </button>
                    </div>
                    <div class="upload-placeholder" *ngIf="!kycData.nidBack">
                      <app-feather-icon name="camera" size="24px"></app-feather-icon>
                      <span>NID Back</span>
                      <small>Click or drag to upload</small>
                    </div>
                  </div>
                  <div class="photo-status" [class]="getPhotoStatusClass('back')">
                    <app-feather-icon [name]="getPhotoStatusIcon('back')" size="12px"></app-feather-icon>
                    <span>{{ getPhotoStatusText('back') }}</span>
                  </div>
                </div>
              </div>

              <!-- Upload Guidelines -->
              <div class="upload-guidelines">
                <h5>Upload Guidelines:</h5>
                <ul>
                  <li>Ensure the document is clearly visible and readable</li>
                  <li>Good lighting and no shadows on the document</li>
                  <li>All four corners of the document should be visible</li>
                  <li>File formats: JPG, PNG (Max 5MB each)</li>
                </ul>
              </div>
            </div>

            <!-- Selfie Photo Upload Section -->
            <div class="selfie-upload-section">
              <h4>Selfie Photograph</h4>
              <p class="upload-description">Upload a clear selfie photo for identity verification</p>
              
              <div class="selfie-photo-container">
                <div class="photo-upload-area selfie-upload" 
                     [class.has-image]="kycData.selfiePhoto"
                     (click)="selectSelfiePhoto()"
                     (dragover)="onDragOver($event)"
                     (drop)="onDrop($event, 'selfie')">
                  <div class="photo-preview" *ngIf="kycData.selfiePhoto">
                    <img [src]="kycData.selfiePhoto" alt="Selfie Photo" class="selfie-image">
                    <button class="remove-photo" (click)="removeSelfiePhoto($event)">
                      <app-feather-icon name="x" size="14px"></app-feather-icon>
                    </button>
                  </div>
                  <div class="upload-placeholder" *ngIf="!kycData.selfiePhoto">
                    <app-feather-icon name="user" size="32px"></app-feather-icon>
                    <span>Selfie Photo</span>
                    <small>Click or drag to upload</small>
                  </div>
                </div>
                <div class="photo-status" [class]="getSelfieStatusClass()">
                  <app-feather-icon [name]="getSelfieStatusIcon()" size="12px"></app-feather-icon>
                  <span>{{ getSelfieStatusText() }}</span>
                </div>
              </div>

              <!-- Selfie Guidelines -->
              <div class="upload-guidelines">
                <h5>Selfie Guidelines:</h5>
                <ul>
                  <li>Look directly at the camera with a neutral expression</li>
                  <li>Ensure good lighting on your face</li>
                  <li>Remove glasses, hats, or face coverings</li>
                  <li>Your face should be clearly visible and centered</li>
                  <li>File formats: JPG, PNG (Max 5MB)</li>
                </ul>
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
                <span class="info-value">Hubert IRAFASHA</span>
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

  kycData = {
    nidFront: '',
    nidBack: '',
    selfiePhoto: '',
    verificationDate: null as Date | null,
    status: 'pending' as 'verified' | 'pending' | 'rejected' | 'not-verified'
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
      } as User;
      
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

  // KYC Methods
  getKycVerificationDate(): string {
    if (!this.kycData.verificationDate) return 'Not verified';
    return this.formatDate(this.kycData.verificationDate);
  }

  selectNidPhoto(type: 'front' | 'back'): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.handleFileUpload(file, type);
      }
    };
    input.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent, type: 'front' | 'back' | 'selfie'): void {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      if (type === 'selfie') {
        this.handleSelfieUpload(files[0]);
      } else {
        this.handleFileUpload(files[0], type);
      }
    }
  }

  handleFileUpload(file: File, type: 'front' | 'back'): void {
    // Validate file
    if (!this.validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (type === 'front') {
        this.kycData.nidFront = e.target.result;
      } else {
        this.kycData.nidBack = e.target.result;
      }
      console.log(`NID ${type} uploaded successfully`);
    };
    reader.readAsDataURL(file);
  }

  validateFile(file: File): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG and PNG files are allowed');
      return false;
    }
    
    return true;
  }

  removeNidPhoto(type: 'front' | 'back', event: Event): void {
    event.stopPropagation();
    if (type === 'front') {
      this.kycData.nidFront = '';
    } else {
      this.kycData.nidBack = '';
    }
  }

  getPhotoStatusClass(type: 'front' | 'back'): string {
    const hasImage = type === 'front' ? this.kycData.nidFront : this.kycData.nidBack;
    return hasImage ? 'uploaded' : 'pending';
  }

  getPhotoStatusIcon(type: 'front' | 'back'): string {
    const hasImage = type === 'front' ? this.kycData.nidFront : this.kycData.nidBack;
    return hasImage ? 'check-circle' : 'upload';
  }

  getPhotoStatusText(type: 'front' | 'back'): string {
    const hasImage = type === 'front' ? this.kycData.nidFront : this.kycData.nidBack;
    return hasImage ? 'Uploaded' : 'Pending';
  }

  // Selfie Photo Methods
  selectSelfiePhoto(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.handleSelfieUpload(file);
      }
    };
    input.click();
  }

  handleSelfieUpload(file: File): void {
    if (!this.validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.kycData.selfiePhoto = e.target.result;
      console.log('Selfie photo uploaded successfully');
    };
    reader.readAsDataURL(file);
  }

  removeSelfiePhoto(event: Event): void {
    event.stopPropagation();
    this.kycData.selfiePhoto = '';
  }

  getSelfieStatusClass(): string {
    return this.kycData.selfiePhoto ? 'uploaded' : 'pending';
  }

  getSelfieStatusIcon(): string {
    return this.kycData.selfiePhoto ? 'check-circle' : 'upload';
  }

  getSelfieStatusText(): string {
    return this.kycData.selfiePhoto ? 'Uploaded' : 'Pending';
  }
}
