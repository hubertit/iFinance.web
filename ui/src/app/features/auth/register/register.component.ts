import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService, ACCOUNT_TYPES, AccountType } from '../../../core/services/auth.service';
import { AuthLayoutComponent } from '../../../shared/components/auth-layout/auth-layout.component';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, AuthLayoutComponent, FormInputComponent, AlertComponent],
  template: `
    <app-auth-layout 
      title="Join iFinance"
      authLinkText="Already have an account?"
      authLinkLabel="Sign In"
      authLinkRoute="/login">
      
          <ng-template #formTemplate>
            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
              <app-form-input
                type="select"
                placeholder="Select Account Type"
                iconClass="fas fa-user-tag"
                formControlName="accountType"
                [isInvalid]="!!(registerForm.get('accountType')?.invalid && registerForm.get('accountType')?.touched)"
                errorMessage="Please select an account type"
                [options]="accountTypeOptions">
              </app-form-input>

              <app-form-input
                type="text"
                placeholder="Full Name"
                iconClass="fas fa-user"
                formControlName="name"
                [isInvalid]="!!(registerForm.get('name')?.invalid && registerForm.get('name')?.touched)"
                errorMessage="Full name is required">
              </app-form-input>

              <app-form-input
                type="email"
                placeholder="Email (Optional)"
                iconClass="fas fa-envelope"
                formControlName="email"
                [isInvalid]="!!(registerForm.get('email')?.invalid && registerForm.get('email')?.touched)"
                errorMessage="Please enter a valid email address">
              </app-form-input>

          <!-- Phone Number with Country Code -->
          <div class="form-group">
            <div class="unified-phone-input">
              <div class="phone-input-wrapper">
                <div class="country-code-section">
                  <select formControlName="countryCode" class="country-code-select">
                    <option *ngFor="let country of countryCodes" [value]="country.code">
                      {{ country.flag }} {{ country.code }}
                    </option>
                  </select>
                </div>
                <div class="phone-number-section">
                  <i class="fas fa-phone input-icon"></i>
                  <input
                    type="tel"
                    placeholder="788123456"
                    formControlName="phoneNumber"
                    [class.is-invalid]="!!(registerForm.get('phoneNumber')?.invalid && registerForm.get('phoneNumber')?.touched)"
                    class="phone-input"
                  />
                </div>
              </div>
            </div>
            <div class="invalid-feedback" *ngIf="!!(registerForm.get('phoneNumber')?.invalid && registerForm.get('phoneNumber')?.touched)">
              Phone number is required
            </div>
          </div>

          <!-- Spacing between phone and NID -->
          <div style="margin-top: 1rem;"></div>

          <app-form-input
            type="text"
            placeholder="National ID (Optional)"
            iconClass="fas fa-id-card"
            formControlName="idNumber"
            [isInvalid]="!!(registerForm.get('idNumber')?.invalid && registerForm.get('idNumber')?.touched)"
            errorMessage="Please enter a valid National ID">
          </app-form-input>

          <app-form-input
            type="password"
            placeholder="Password"
            iconClass="fas fa-key"
            formControlName="password"
            [isInvalid]="!!(registerForm.get('password')?.invalid && registerForm.get('password')?.touched)"
            errorMessage="Password is required and must be at least 6 characters"
            [showPasswordToggle]="true">
          </app-form-input>

          <app-form-input
            type="password"
            placeholder="Confirm Password"
            iconClass="fas fa-key"
            formControlName="confirmPassword"
            [isInvalid]="!!(registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched)"
            errorMessage="Passwords do not match"
            [showPasswordToggle]="true">
          </app-form-input>

          <app-alert 
            type="danger" 
            [message]="errorMessage">
          </app-alert>

          <button type="submit" class="auth-btn" [disabled]="registerForm.invalid || isLoading">
            <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
            {{ isLoading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </form>
      </ng-template>
    </app-auth-layout>
  `,
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  
  countryCodes = [
    { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
    { code: '+256', country: 'Uganda', flag: '🇺🇬' },
    { code: '+254', country: 'Kenya', flag: '🇰🇪' },
    { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
    { code: '+243', country: 'DRC', flag: '🇨🇩' },
    { code: '+257', country: 'Burundi', flag: '🇧🇮' },
    { code: '+1', country: 'USA', flag: '🇺🇸' },
    { code: '+1', country: 'Canada', flag: '🇨🇦' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+27', country: 'South Africa', flag: '🇿🇦' },
    { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
    { code: '+233', country: 'Ghana', flag: '🇬🇭' },
    { code: '+254', country: 'Kenya', flag: '🇰🇪' },
    { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
    { code: '+212', country: 'Morocco', flag: '🇲🇦' },
    { code: '+20', country: 'Egypt', flag: '🇪🇬' },
    { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
    { code: '+27', country: 'South Africa', flag: '🇿🇦' },
    { code: '+7', country: 'Russia', flag: '🇷🇺' },
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
    { code: '+54', country: 'Argentina', flag: '🇦🇷' },
    { code: '+52', country: 'Mexico', flag: '🇲🇽' },
    { code: '+57', country: 'Colombia', flag: '🇨🇴' },
    { code: '+51', country: 'Peru', flag: '🇵🇪' },
    { code: '+56', country: 'Chile', flag: '🇨🇱' },
    { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
    { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
    { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
    { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
    { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
    { code: '+32', country: 'Belgium', flag: '🇧🇪' },
    { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
    { code: '+43', country: 'Austria', flag: '🇦🇹' },
    { code: '+45', country: 'Denmark', flag: '🇩🇰' },
    { code: '+46', country: 'Sweden', flag: '🇸🇪' },
    { code: '+47', country: 'Norway', flag: '🇳🇴' },
    { code: '+358', country: 'Finland', flag: '🇫🇮' },
    { code: '+48', country: 'Poland', flag: '🇵🇱' },
    { code: '+420', country: 'Czech Republic', flag: '🇨🇿' },
    { code: '+421', country: 'Slovakia', flag: '🇸🇰' },
    { code: '+36', country: 'Hungary', flag: '🇭🇺' },
    { code: '+40', country: 'Romania', flag: '🇷🇴' },
    { code: '+359', country: 'Bulgaria', flag: '🇧🇬' },
    { code: '+385', country: 'Croatia', flag: '🇭🇷' },
    { code: '+386', country: 'Slovenia', flag: '🇸🇮' },
    { code: '+372', country: 'Estonia', flag: '🇪🇪' },
    { code: '+371', country: 'Latvia', flag: '🇱🇻' },
    { code: '+370', country: 'Lithuania', flag: '🇱🇹' },
    { code: '+353', country: 'Ireland', flag: '🇮🇪' },
    { code: '+351', country: 'Portugal', flag: '🇵🇹' },
    { code: '+30', country: 'Greece', flag: '🇬🇷' },
    { code: '+90', country: 'Turkey', flag: '🇹🇷' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+974', country: 'Qatar', flag: '🇶🇦' },
    { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
    { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
    { code: '+968', country: 'Oman', flag: '🇴🇲' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+66', country: 'Thailand', flag: '🇹🇭' },
    { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
    { code: '+63', country: 'Philippines', flag: '🇵🇭' },
    { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
    { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
    { code: '+93', country: 'Afghanistan', flag: '🇦🇫' },
    { code: '+98', country: 'Iran', flag: '🇮🇷' },
    { code: '+964', country: 'Iraq', flag: '🇮🇶' },
    { code: '+963', country: 'Syria', flag: '🇸🇾' },
    { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
    { code: '+962', country: 'Jordan', flag: '🇯🇴' },
    { code: '+972', country: 'Israel', flag: '🇮🇱' },
    { code: '+970', country: 'Palestine', flag: '🇵🇸' },
    { code: '+20', country: 'Egypt', flag: '🇪🇬' },
    { code: '+218', country: 'Libya', flag: '🇱🇾' },
    { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
    { code: '+213', country: 'Algeria', flag: '🇩🇿' },
    { code: '+212', country: 'Morocco', flag: '🇲🇦' },
    { code: '+220', country: 'Gambia', flag: '🇬🇲' },
    { code: '+221', country: 'Senegal', flag: '🇸🇳' },
    { code: '+223', country: 'Mali', flag: '🇲🇱' },
    { code: '+224', country: 'Guinea', flag: '🇬🇳' },
    { code: '+225', country: 'Ivory Coast', flag: '🇨🇮' },
    { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
    { code: '+227', country: 'Niger', flag: '🇳🇪' },
    { code: '+228', country: 'Togo', flag: '🇹🇬' },
    { code: '+229', country: 'Benin', flag: '🇧🇯' },
    { code: '+230', country: 'Mauritius', flag: '🇲🇺' },
    { code: '+231', country: 'Liberia', flag: '🇱🇷' },
    { code: '+232', country: 'Sierra Leone', flag: '🇸🇱' },
    { code: '+233', country: 'Ghana', flag: '🇬🇭' },
    { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
    { code: '+235', country: 'Chad', flag: '🇹🇩' },
    { code: '+236', country: 'Central African Republic', flag: '🇨🇫' },
    { code: '+237', country: 'Cameroon', flag: '🇨🇲' },
    { code: '+238', country: 'Cape Verde', flag: '🇨🇻' },
    { code: '+239', country: 'São Tomé and Príncipe', flag: '🇸🇹' },
    { code: '+240', country: 'Equatorial Guinea', flag: '🇬🇶' },
    { code: '+241', country: 'Gabon', flag: '🇬🇦' },
    { code: '+242', country: 'Republic of the Congo', flag: '🇨🇬' },
    { code: '+243', country: 'DRC', flag: '🇨🇩' },
    { code: '+244', country: 'Angola', flag: '🇦🇴' },
    { code: '+245', country: 'Guinea-Bissau', flag: '🇬🇼' },
    { code: '+246', country: 'British Indian Ocean Territory', flag: '🇮🇴' },
    { code: '+248', country: 'Seychelles', flag: '🇸🇨' },
    { code: '+249', country: 'Sudan', flag: '🇸🇩' },
    { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
    { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
    { code: '+252', country: 'Somalia', flag: '🇸🇴' },
    { code: '+253', country: 'Djibouti', flag: '🇩🇯' },
    { code: '+254', country: 'Kenya', flag: '🇰🇪' },
    { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
    { code: '+256', country: 'Uganda', flag: '🇺🇬' },
    { code: '+257', country: 'Burundi', flag: '🇧🇮' },
    { code: '+258', country: 'Mozambique', flag: '🇲🇿' },
    { code: '+260', country: 'Zambia', flag: '🇿🇲' },
    { code: '+261', country: 'Madagascar', flag: '🇲🇬' },
    { code: '+262', country: 'Réunion', flag: '🇷🇪' },
    { code: '+263', country: 'Zimbabwe', flag: '🇿🇼' },
    { code: '+264', country: 'Namibia', flag: '🇳🇦' },
    { code: '+265', country: 'Malawi', flag: '🇲🇼' },
    { code: '+266', country: 'Lesotho', flag: '🇱🇸' },
    { code: '+267', country: 'Botswana', flag: '🇧🇼' },
    { code: '+268', country: 'Swaziland', flag: '🇸🇿' },
    { code: '+269', country: 'Comoros', flag: '🇰🇲' },
    { code: '+290', country: 'Saint Helena', flag: '🇸🇭' },
    { code: '+291', country: 'Eritrea', flag: '🇪🇷' },
    { code: '+297', country: 'Aruba', flag: '🇦🇼' },
    { code: '+298', country: 'Faroe Islands', flag: '🇫🇴' },
    { code: '+299', country: 'Greenland', flag: '🇬🇱' }
  ];
  
  accountTypeOptions = [
    { value: 'farmer', label: 'Farmer' },
    { value: 'veterinarian', label: 'Veterinarian' },
    { value: 'supplier', label: 'Supplier' },
    { value: 'customer', label: 'Customer' },
    { value: 'agent', label: 'Agent' },
    { value: 'collector', label: 'Collector' },
    { value: 'mcc', label: 'MCC' }
  ];

      constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
      ) {
        this.registerForm = this.fb.group({
          name: ['', [Validators.required, Validators.minLength(2)]], // Empty placeholder
          accountName: ['', [Validators.required, Validators.minLength(2)]], // Auto-filled from name
          email: ['', [Validators.email]], // Empty placeholder
          countryCode: ['+250', [Validators.required]], // Default to Rwanda
          phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9\s\-\(\)]+$/)]], // Empty placeholder
          idNumber: [''], // Empty placeholder
          password: ['', [Validators.required, Validators.minLength(6)]], // Empty placeholder
          confirmPassword: ['', [Validators.required]], // Empty placeholder
          accountType: ['', [Validators.required]] // Empty placeholder
        }, { validators: this.passwordMatchValidator });

        // Auto-fill account name when name changes
        this.registerForm.get('name')?.valueChanges.subscribe(name => {
          if (name && name.trim()) {
            this.registerForm.get('accountName')?.setValue(name.trim(), { emitEvent: false });
          }
        });
      }

  ngOnInit(): void {
    // Component initialization
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else if (confirmPassword && confirmPassword.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }


  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData = this.registerForm.value;
      
      // Prepare registration data matching Flutter app structure
      const registrationData = {
        name: formData.name,
        accountName: formData.accountName,
        email: formData.email || null,
        phoneNumber: formData.countryCode + formData.phoneNumber,
        idNumber: formData.idNumber || null,
        password: formData.password,
        accountType: formData.accountType
      };

      this.authService.register(registrationData).subscribe({
        next: (user) => {
          this.isLoading = false;
          // Navigate to dashboard after successful registration
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error;
        }
      });
    } else {
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }
}
