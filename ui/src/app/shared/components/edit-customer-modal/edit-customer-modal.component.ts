import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../feather-icon/feather-icon.component';
import { Customer } from '../../../core/services/customer.service';

@Component({
  selector: 'app-edit-customer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FeatherIconComponent],
  template: `
    <div class="modal-overlay" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="modal-header">
          <h2>Edit Customer</h2>
          <button class="close-btn" (click)="closeModal()">
            <app-feather-icon name="x" size="20px"></app-feather-icon>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <form #customerForm="ngForm" (ngSubmit)="onSubmit()">
            <!-- Row 1: Name and Phone -->
            <div class="form-row">
              <!-- Name Field -->
              <div class="form-group">
                <label for="name">Customer Name *</label>
                <div class="input-container">
                  <app-feather-icon name="user" size="18px" class="input-icon"></app-feather-icon>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    [(ngModel)]="customerData.name"
                    #nameField="ngModel"
                    required
                    placeholder="Enter customer name"
                    class="form-input"
                  />
                </div>
                <div class="error-message" *ngIf="nameField.invalid && nameField.touched">
                  Please enter customer name
                </div>
              </div>

              <!-- Phone Field -->
              <div class="form-group">
                <label for="phone">Phone Number *</label>
                <div class="unified-phone-input">
                  <div class="phone-input-wrapper">
                    <div class="country-code-section">
                      <select [(ngModel)]="customerData.countryCode" name="countryCode" class="country-code-select">
                        <option *ngFor="let country of countryCodes" [value]="country.code">
                          {{ country.flag }} {{ country.code }}
                        </option>
                      </select>
                    </div>
                    <div class="phone-number-section">
                      <app-feather-icon name="phone" size="18px" class="input-icon"></app-feather-icon>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        [(ngModel)]="customerData.phone"
                        #phoneField="ngModel"
                        required
                        placeholder="788606765"
                        class="phone-input"
                      />
                    </div>
                  </div>
                </div>
                <div class="error-message" *ngIf="phoneField.invalid && phoneField.touched">
                  Please enter a valid phone number
                </div>
              </div>
            </div>

            <!-- Row 2: Email and Address -->
            <div class="form-row">
              <!-- Email Field -->
              <div class="form-group">
                <label for="email">Email (Optional)</label>
                <div class="input-container">
                  <app-feather-icon name="mail" size="18px" class="input-icon"></app-feather-icon>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    [(ngModel)]="customerData.email"
                    placeholder="Email (optional)"
                    class="form-input"
                  />
                </div>
              </div>

              <!-- Address Field -->
              <div class="form-group">
                <label for="address">Address *</label>
                <div class="input-container">
                  <app-feather-icon name="map-pin" size="18px" class="input-icon"></app-feather-icon>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    [(ngModel)]="customerData.address"
                    #addressField="ngModel"
                    required
                    placeholder="Enter address"
                    class="form-input"
                  />
                </div>
                <div class="error-message" *ngIf="addressField.invalid && addressField.touched">
                  Please enter address
                </div>
              </div>
            </div>

            <!-- Row 3: Price per Liter and Customer Type -->
            <div class="form-row">
              <!-- Price per Liter Field -->
              <div class="form-group">
                <label for="pricePerLiter">Price per Liter (RWF) *</label>
                <div class="input-container">
                  <app-feather-icon name="dollar-sign" size="18px" class="input-icon"></app-feather-icon>
                  <input
                    type="number"
                    id="pricePerLiter"
                    name="pricePerLiter"
                    [(ngModel)]="customerData.pricePerLiter"
                    #priceField="ngModel"
                    required
                    min="0"
                    step="0.01"
                    placeholder="Price per Liter (RWF)"
                    class="form-input"
                  />
                </div>
                <div class="error-message" *ngIf="priceField.invalid && priceField.touched">
                  Please enter a valid price
                </div>
              </div>

              <!-- Customer Type Field -->
              <div class="form-group">
                <label for="customerType">Customer Type</label>
                <div class="input-container">
                  <app-feather-icon name="tag" size="18px" class="input-icon"></app-feather-icon>
                  <select
                    id="customerType"
                    name="customerType"
                    [(ngModel)]="customerData.customerType"
                    class="form-input"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Shop">Shop</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Cafe">Cafe</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Row 4: Payment Method -->
            <div class="form-row">
              <!-- Payment Method Field -->
              <div class="form-group">
                <label for="paymentMethod">Payment Method</label>
                <div class="input-container">
                  <app-feather-icon name="credit-card" size="18px" class="input-icon"></app-feather-icon>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    [(ngModel)]="customerData.paymentMethod"
                    class="form-input"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>

              <!-- Empty div for spacing -->
              <div class="form-group"></div>
            </div>

            <!-- Action Buttons -->
            <div class="form-actions">
              <button
                type="button"
                class="btn btn-danger-outline"
                (click)="closeModal()"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="customerForm.invalid || isSubmitting"
              >
                <span *ngIf="!isSubmitting">Update Customer</span>
                <span *ngIf="isSubmitting">Updating...</span>
                <app-feather-icon name="loader" size="16px" *ngIf="isSubmitting" class="spinning"></app-feather-icon>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./edit-customer-modal.component.scss']
})
export class EditCustomerModalComponent implements OnInit {
  @Input() customer!: Customer;
  @Output() customerUpdated = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();

  customerData = {
    name: '',
    phone: '',
    countryCode: '+250',
    email: '',
    address: '',
    pricePerLiter: null as number | null,
    customerType: 'Individual',
    paymentMethod: 'Cash'
  };

  countryCodes = [
    { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
    { code: '+256', country: 'Uganda', flag: '🇺🇬' },
    { code: '+254', country: 'Kenya', flag: '🇰🇪' },
    { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
    { code: '+243', country: 'DRC', flag: '🇨🇩' },
    { code: '+257', country: 'Burundi', flag: '🇧🇮' },
    { code: '+1', country: 'USA', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' }
  ];

  isSubmitting = false;

  ngOnInit() {
    // Extract country code and phone number from existing phone
    let phoneNumber = this.customer.phone || '';
    let countryCode = '+250'; // Default to Rwanda
    
    // Check if phone starts with a country code
    for (let country of this.countryCodes) {
      if (phoneNumber.startsWith(country.code)) {
        countryCode = country.code;
        phoneNumber = phoneNumber.substring(country.code.length);
        break;
      }
    }
    
    // Initialize form with customer data
    this.customerData = {
      name: this.customer.name,
      phone: phoneNumber,
      countryCode: countryCode,
      email: this.customer.email || '',
      address: this.customer.address || this.customer.location || '',
      pricePerLiter: this.customer.pricePerLiter || this.customer.buyingPricePerLiter || 0,
      customerType: this.customer.customerType || 'Individual',
      paymentMethod: this.customer.paymentMethod || 'Cash'
    };
  }

  onSubmit() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    
    // Combine country code and phone number
    const fullPhoneNumber = this.customerData.countryCode + this.customerData.phone;
    
    // Simulate API call
    setTimeout(() => {
      this.customerUpdated.emit({ 
        ...this.customerData,
        phone: fullPhoneNumber,
        id: this.customer.id 
      });
      this.isSubmitting = false;
      this.closeModal();
    }, 1500);
  }

  closeModal() {
    this.modalClosed.emit();
  }
}
