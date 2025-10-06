import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../feather-icon/feather-icon.component';
import { SuppliersService } from '../../../features/suppliers/suppliers.service';
import { CreateSupplierRequest } from '../../../features/suppliers/supplier.model';

@Component({
  selector: 'app-add-supplier-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FeatherIconComponent],
  template: `
    <div class="modal-overlay" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="modal-header">
          <h2>Add New Supplier</h2>
          <button class="close-btn" (click)="closeModal()">
            <app-feather-icon name="x" size="20px"></app-feather-icon>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <form #supplierForm="ngForm" (ngSubmit)="onSubmit()">
            <!-- Name Field -->
            <div class="form-group">
              <label for="name">Full Name *</label>
              <div class="input-container">
                <app-feather-icon name="user" size="18px" class="input-icon"></app-feather-icon>
                <input
                  type="text"
                  id="name"
                  name="name"
                  [(ngModel)]="supplierData.name"
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
                    <select [(ngModel)]="supplierData.countryCode" name="countryCode" class="country-code-select">
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
                      [(ngModel)]="supplierData.phone"
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
                  [(ngModel)]="supplierData.email"
                  placeholder="Email (optional)"
                  class="form-input"
                />
              </div>
            </div>

            <!-- Address Field -->
            <div class="form-group">
              <label for="location">Address</label>
              <div class="input-container">
                <app-feather-icon name="map-pin" size="18px" class="input-icon"></app-feather-icon>
                <input
                  type="text"
                  id="location"
                  name="location"
                  [(ngModel)]="supplierData.location"
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
                  [(ngModel)]="supplierData.idNumber"
                  placeholder="National ID (optional)"
                  class="form-input"
                />
              </div>
            </div>

            <!-- Price per Liter Field -->
            <div class="form-group">
              <label for="sellingPricePerLiter">Price per Liter (RWF) *</label>
              <div class="input-container">
                <app-feather-icon name="dollar-sign" size="18px" class="input-icon"></app-feather-icon>
                <input
                  type="number"
                  id="sellingPricePerLiter"
                  name="sellingPricePerLiter"
                  [(ngModel)]="supplierData.sellingPricePerLiter"
                  #sellingPriceField="ngModel"
                  required
                  min="0"
                  step="0.01"
                  placeholder="Enter price per liter"
                  class="form-input"
                />
              </div>
              <div class="error-message" *ngIf="sellingPriceField.invalid && sellingPriceField.touched">
                Price per liter is required
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="modal-footer">
              <button type="button" class="btn btn-danger-outline" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!supplierForm.valid">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                Add Supplier
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./add-supplier-modal.component.scss']
})
export class AddSupplierModalComponent implements OnInit {
  @Output() supplierAdded = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();

  supplierData: CreateSupplierRequest = {
    name: '',
    phone: '',
    email: '',
    location: '',
    businessType: 'individual', // Default value
    cattleCount: 0,
    dailyProduction: 0,
    farmType: 'dairy', // Default value
    collectionSchedule: 'daily', // Default value
    sellingPricePerLiter: 0,
    qualityGrades: 'B', // Default value
    paymentMethod: 'cash', // Default value
    idNumber: '',
    notes: '',
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

  private suppliersService = inject(SuppliersService);

  ngOnInit() {
    this.supplierData.countryCode = '+250';
  }

  onSubmit() {
    if (this.supplierData.name && this.supplierData.phone && this.supplierData.sellingPricePerLiter) {
      this.loading = true;
      const fullPhoneNumber = `${this.supplierData.countryCode}${this.supplierData.phone}`;
      const supplierToCreate = { ...this.supplierData, phone: fullPhoneNumber };

      this.suppliersService.createSupplier(supplierToCreate).subscribe({
        next: (response) => {
          console.log('Supplier added successfully:', response);
          this.supplierAdded.emit(response);
          this.closeModal();
        },
        error: (error) => {
          console.error('Error adding supplier:', error);
          // Handle error (e.g., show an alert)
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }

  closeModal() {
    this.modalClosed.emit();
  }
}