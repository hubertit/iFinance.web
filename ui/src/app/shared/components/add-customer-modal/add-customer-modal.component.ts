import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../feather-icon/feather-icon.component';

@Component({
  selector: 'app-add-customer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FeatherIconComponent],
  template: `
    <div class="modal-overlay" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="modal-header">
          <h2>Add New Customer</h2>
          <button class="close-btn" (click)="closeModal()">
            <app-feather-icon name="x" size="20px"></app-feather-icon>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <form #customerForm="ngForm" (ngSubmit)="onSubmit()">
            <!-- Name Field -->
            <div class="form-group">
              <label for="name">Full Name *</label>
              <div class="input-container">
                <app-feather-icon name="user" size="18px" class="input-icon"></app-feather-icon>
                <input
                  type="text"
                  id="name"
                  name="name"
                  [(ngModel)]="customerData.name"
                  #nameField="ngModel"
                  required
                  placeholder="Enter full name"
                  class="form-input"
                />
              </div>
              <div class="error-message" *ngIf="nameField.invalid && nameField.touched">
                Name is required
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
                      placeholder="788123456"
                      class="phone-input"
                    />
                  </div>
                </div>
              </div>
              <div class="error-message" *ngIf="phoneField.invalid && phoneField.touched">
                Phone number is required
              </div>
            </div>

            <!-- Email Field -->
            <div class="form-group">
              <label for="email">Email Address</label>
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
              <label for="address">Address</label>
              <div class="input-container">
                <app-feather-icon name="map-pin" size="18px" class="input-icon"></app-feather-icon>
                <input
                  type="text"
                  id="address"
                  name="address"
                  [(ngModel)]="customerData.address"
                  placeholder="Address (optional)"
                  class="form-input"
                />
              </div>
            </div>

            <!-- National ID Field -->
            <div class="form-group">
              <label for="idNumber">National ID</label>
              <div class="input-container">
                <app-feather-icon name="hash" size="18px" class="input-icon"></app-feather-icon>
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  [(ngModel)]="customerData.idNumber"
                  placeholder="National ID (optional)"
                  class="form-input"
                />
              </div>
            </div>

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
                  placeholder="Enter price per liter"
                  class="form-input"
                />
              </div>
              <div class="error-message" *ngIf="priceField.invalid && priceField.touched">
                Price per liter is required
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="modal-footer">
              <button type="button" class="btn btn-danger-outline" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!customerForm.valid">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                Add Customer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./add-customer-modal.component.scss']
})
export class AddCustomerModalComponent implements OnInit {
  @Output() customerAdded = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();

  customerData = {
    name: '',
    phone: '',
    email: '',
    address: '',
    idNumber: '',
    pricePerLiter: null as number | null,
    countryCode: '+250' // Default country code
  };

  countryCodes = [
    { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
    { code: '+256', flag: '🇺🇬', name: 'Uganda' },
    { code: '+254', flag: '🇰🇪', name: 'Kenya' },
    { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
    { code: '+243', flag: '🇨🇩', name: 'DRC' },
    { code: '+257', flag: '🇧🇮', name: 'Burundi' }
  ];

  loading = false;

  ngOnInit() {
    this.customerData.countryCode = '+250';
  }

  onSubmit() {
    if (this.customerData.name && this.customerData.phone && this.customerData.pricePerLiter) {
      this.loading = true;
      const fullPhoneNumber = `${this.customerData.countryCode}${this.customerData.phone}`;
      const customerToCreate = { ...this.customerData, phone: fullPhoneNumber };

      // Simulate API call
      setTimeout(() => {
        this.customerAdded.emit(customerToCreate);
        this.loading = false;
        this.closeModal();
      }, 1500);
    }
  }

  closeModal() {
    this.modalClosed.emit();
  }
}