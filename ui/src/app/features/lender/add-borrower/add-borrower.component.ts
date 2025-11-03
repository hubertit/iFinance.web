import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';

@Component({
  selector: 'app-add-borrower',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, FeatherIconComponent],
  template: `
    <div class="add-borrower">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Add New Borrower</h1>
          <p class="page-description">Register a new borrower in the system</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="goBack()">
            <app-feather-icon name="arrow-left" size="16px"></app-feather-icon>
            Cancel
          </button>
        </div>
      </div>

      <!-- Borrower Form -->
      <div class="form-container">
        <form [formGroup]="borrowerForm" (ngSubmit)="onSubmit()">
          <!-- Personal Information -->
          <div class="form-section">
            <div class="section-header">
              <h3>Personal Information</h3>
            </div>
            <div class="form-grid">
              <div class="form-group" [class.error]="borrowerForm.get('firstName')?.invalid && borrowerForm.get('firstName')?.touched">
                <label for="firstName">First Name <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="firstName" 
                  formControlName="firstName"
                  placeholder="Enter first name"
                  [class.error]="borrowerForm.get('firstName')?.invalid && borrowerForm.get('firstName')?.touched"
                />
                <span class="error-message" *ngIf="borrowerForm.get('firstName')?.invalid && borrowerForm.get('firstName')?.touched">
                  First name is required
                </span>
              </div>

              <div class="form-group" [class.error]="borrowerForm.get('lastName')?.invalid && borrowerForm.get('lastName')?.touched">
                <label for="lastName">Last Name <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="lastName" 
                  formControlName="lastName"
                  placeholder="Enter last name"
                  [class.error]="borrowerForm.get('lastName')?.invalid && borrowerForm.get('lastName')?.touched"
                />
                <span class="error-message" *ngIf="borrowerForm.get('lastName')?.invalid && borrowerForm.get('lastName')?.touched">
                  Last name is required
                </span>
              </div>

              <div class="form-group" [class.error]="borrowerForm.get('phone')?.invalid && borrowerForm.get('phone')?.touched">
                <label for="phone">Phone Number <span class="required">*</span></label>
                <input 
                  type="tel" 
                  id="phone" 
                  formControlName="phone"
                  placeholder="+250788000000"
                  [class.error]="borrowerForm.get('phone')?.invalid && borrowerForm.get('phone')?.touched"
                />
                <span class="error-message" *ngIf="borrowerForm.get('phone')?.invalid && borrowerForm.get('phone')?.touched">
                  Valid phone number is required
                </span>
              </div>

              <div class="form-group" [class.error]="borrowerForm.get('email')?.invalid && borrowerForm.get('email')?.touched">
                <label for="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  formControlName="email"
                  placeholder="example@email.com"
                  [class.error]="borrowerForm.get('email')?.invalid && borrowerForm.get('email')?.touched"
                />
                <span class="error-message" *ngIf="borrowerForm.get('email')?.invalid && borrowerForm.get('email')?.touched">
                  Valid email is required
                </span>
              </div>

              <div class="form-group" [class.error]="borrowerForm.get('dateOfBirth')?.invalid && borrowerForm.get('dateOfBirth')?.touched">
                <label for="dateOfBirth">Date of Birth</label>
                <input 
                  type="date" 
                  id="dateOfBirth" 
                  formControlName="dateOfBirth"
                  [class.error]="borrowerForm.get('dateOfBirth')?.invalid && borrowerForm.get('dateOfBirth')?.touched"
                />
              </div>

              <div class="form-group">
                <label for="gender">Gender</label>
                <select id="gender" formControlName="gender">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Address Information -->
          <div class="form-section">
            <div class="section-header">
              <h3>Address Information</h3>
            </div>
            <div class="form-grid">
              <div class="form-group full-width" [class.error]="borrowerForm.get('address')?.invalid && borrowerForm.get('address')?.touched">
                <label for="address">Street Address</label>
                <input 
                  type="text" 
                  id="address" 
                  formControlName="address"
                  placeholder="Enter street address"
                  [class.error]="borrowerForm.get('address')?.invalid && borrowerForm.get('address')?.touched"
                />
              </div>

              <div class="form-group">
                <label for="city">City</label>
                <input 
                  type="text" 
                  id="city" 
                  formControlName="city"
                  placeholder="Enter city"
                />
              </div>

              <div class="form-group">
                <label for="district">District</label>
                <input 
                  type="text" 
                  id="district" 
                  formControlName="district"
                  placeholder="Enter district"
                />
              </div>

              <div class="form-group">
                <label for="province">Province</label>
                <select id="province" formControlName="province">
                  <option value="">Select province</option>
                  <option value="kigali">Kigali</option>
                  <option value="north">North</option>
                  <option value="south">South</option>
                  <option value="east">East</option>
                  <option value="west">West</option>
                </select>
              </div>

              <div class="form-group">
                <label for="postalCode">Postal Code</label>
                <input 
                  type="text" 
                  id="postalCode" 
                  formControlName="postalCode"
                  placeholder="Enter postal code"
                />
              </div>
            </div>
          </div>

          <!-- Employment Information -->
          <div class="form-section">
            <div class="section-header">
              <h3>Employment Information</h3>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label for="occupation">Occupation</label>
                <input 
                  type="text" 
                  id="occupation" 
                  formControlName="occupation"
                  placeholder="Enter occupation"
                />
              </div>

              <div class="form-group">
                <label for="employer">Employer</label>
                <input 
                  type="text" 
                  id="employer" 
                  formControlName="employer"
                  placeholder="Enter employer name"
                />
              </div>

              <div class="form-group">
                <label for="employmentType">Employment Type</label>
                <select id="employmentType" formControlName="employmentType">
                  <option value="">Select type</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="self-employed">Self-employed</option>
                  <option value="unemployed">Unemployed</option>
                </select>
              </div>

              <div class="form-group">
                <label for="monthlyIncome">Monthly Income (RWF)</label>
                <input 
                  type="number" 
                  id="monthlyIncome" 
                  formControlName="monthlyIncome"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          <!-- Additional Information -->
          <div class="form-section">
            <div class="section-header">
              <h3>Additional Information</h3>
            </div>
            <div class="form-grid">
              <div class="form-group full-width">
                <label for="notes">Notes</label>
                <textarea 
                  id="notes" 
                  formControlName="notes"
                  rows="4"
                  placeholder="Any additional notes about the borrower..."
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="goBack()">
              Cancel
            </button>
            <button type="submit" class="btn-primary" [disabled]="borrowerForm.invalid || isSubmitting">
              <app-feather-icon name="save" size="16px"></app-feather-icon>
              {{ isSubmitting ? 'Saving...' : 'Save Borrower' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./add-borrower.component.scss']
})
export class AddBorrowerComponent implements OnInit {
  borrowerForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.borrowerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      email: ['', [Validators.email]],
      dateOfBirth: [''],
      gender: [''],
      address: [''],
      city: [''],
      district: [''],
      province: [''],
      postalCode: [''],
      occupation: [''],
      employer: [''],
      employmentType: [''],
      monthlyIncome: [''],
      notes: ['']
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.borrowerForm.valid) {
      this.isSubmitting = true;
      
      // TODO: Implement API call to save borrower
      console.log('Borrower data:', this.borrowerForm.value);
      
      setTimeout(() => {
        this.isSubmitting = false;
        alert('Borrower registered successfully!');
        this.router.navigate(['/lender/borrowers/list']);
      }, 1000);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.borrowerForm.controls).forEach(key => {
        this.borrowerForm.get(key)?.markAsTouched();
      });
    }
  }

  goBack() {
    this.router.navigate(['/lender/borrowers/list']);
  }
}

