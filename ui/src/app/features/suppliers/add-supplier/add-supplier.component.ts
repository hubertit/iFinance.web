import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { SuppliersService } from '../suppliers.service';
import { CreateSupplierRequest } from '../supplier.model';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';

@Component({
  selector: 'app-add-supplier',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent],
  template: `
    <div class="add-supplier-container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <button class="back-btn" routerLink="/suppliers/list">
              <app-feather-icon name="arrow-left" size="20px"></app-feather-icon>
            </button>
            <div class="title-text">
              <h1 class="page-title">Add New Supplier</h1>
              <p class="page-subtitle">Enter supplier information to get started</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Section -->
      <div class="form-container">
        <form #supplierForm="ngForm" (ngSubmit)="onSubmit(supplierForm)" class="supplier-form">
          <!-- Basic Information -->
          <div class="form-section">
            <h3 class="section-title">Basic Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="name" class="form-label">Supplier Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  [(ngModel)]="supplierData.name"
                  #nameField="ngModel"
                  required
                  class="form-input"
                  [class.is-invalid]="nameField.invalid && nameField.touched"
                  placeholder="Enter supplier name"
                >
                <div class="invalid-feedback" *ngIf="nameField.invalid && nameField.touched">
                  Supplier name is required
                </div>
              </div>
              
              <div class="form-group">
                <label for="phone" class="form-label">Phone Number *</label>
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
                        placeholder="788606765"
                        class="phone-input"
                        [class.is-invalid]="phoneField.invalid && phoneField.touched"
                      />
                    </div>
                  </div>
                </div>
                <div class="invalid-feedback" *ngIf="phoneField.invalid && phoneField.touched">
                  Phone number is required
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="email" class="form-label">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  [(ngModel)]="supplierData.email"
                  class="form-input"
                  placeholder="supplier@example.com"
                >
              </div>
              
              <div class="form-group">
                <label for="location" class="form-label">Location *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  [(ngModel)]="supplierData.location"
                  #locationField="ngModel"
                  required
                  class="form-input"
                  [class.is-invalid]="locationField.invalid && locationField.touched"
                  placeholder="Enter location"
                >
                <div class="invalid-feedback" *ngIf="locationField.invalid && locationField.touched">
                  Location is required
                </div>
              </div>
            </div>
          </div>

          <!-- Business Information -->
          <div class="form-section">
            <h3 class="section-title">Business Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="businessType" class="form-label">Business Type *</label>
                <select
                  id="businessType"
                  name="businessType"
                  [(ngModel)]="supplierData.businessType"
                  #businessTypeField="ngModel"
                  required
                  class="form-select"
                  [class.is-invalid]="businessTypeField.invalid && businessTypeField.touched"
                >
                  <option value="">Select business type</option>
                  <option value="individual">Individual</option>
                  <option value="cooperative">Cooperative</option>
                  <option value="farm">Farm</option>
                </select>
                <div class="invalid-feedback" *ngIf="businessTypeField.invalid && businessTypeField.touched">
                  Business type is required
                </div>
              </div>
              
              <div class="form-group">
                <label for="farmType" class="form-label">Farm Type *</label>
                <select
                  id="farmType"
                  name="farmType"
                  [(ngModel)]="supplierData.farmType"
                  #farmTypeField="ngModel"
                  required
                  class="form-select"
                  [class.is-invalid]="farmTypeField.invalid && farmTypeField.touched"
                >
                  <option value="">Select farm type</option>
                  <option value="dairy">Dairy Farm</option>
                  <option value="mixed">Mixed Farm</option>
                  <option value="specialized">Specialized Dairy</option>
                </select>
                <div class="invalid-feedback" *ngIf="farmTypeField.invalid && farmTypeField.touched">
                  Farm type is required
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="cattleCount" class="form-label">Number of Cattle *</label>
                <input
                  type="number"
                  id="cattleCount"
                  name="cattleCount"
                  [(ngModel)]="supplierData.cattleCount"
                  #cattleCountField="ngModel"
                  required
                  min="1"
                  class="form-input"
                  [class.is-invalid]="cattleCountField.invalid && cattleCountField.touched"
                  placeholder="Enter number of cattle"
                >
                <div class="invalid-feedback" *ngIf="cattleCountField.invalid && cattleCountField.touched">
                  Number of cattle is required
                </div>
              </div>
              
              <div class="form-group">
                <label for="dailyProduction" class="form-label">Daily Production (L) *</label>
                <input
                  type="number"
                  id="dailyProduction"
                  name="dailyProduction"
                  [(ngModel)]="supplierData.dailyProduction"
                  #dailyProductionField="ngModel"
                  required
                  min="0"
                  step="0.1"
                  class="form-input"
                  [class.is-invalid]="dailyProductionField.invalid && dailyProductionField.touched"
                  placeholder="Enter daily production"
                >
                <div class="invalid-feedback" *ngIf="dailyProductionField.invalid && dailyProductionField.touched">
                  Daily production is required
                </div>
              </div>
            </div>
          </div>

          <!-- Pricing Information -->
          <div class="form-section">
            <h3 class="section-title">Pricing Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="sellingPricePerLiter" class="form-label">Price per Liter (RWF) *</label>
                <input
                  type="number"
                  id="sellingPricePerLiter"
                  name="sellingPricePerLiter"
                  [(ngModel)]="supplierData.sellingPricePerLiter"
                  #sellingPriceField="ngModel"
                  required
                  min="0"
                  step="0.01"
                  class="form-input"
                  [class.is-invalid]="sellingPriceField.invalid && sellingPriceField.touched"
                  placeholder="Enter price per liter"
                >
                <div class="invalid-feedback" *ngIf="sellingPriceField.invalid && sellingPriceField.touched">
                  Price per liter is required
                </div>
              </div>
              
              <div class="form-group">
                <label for="qualityGrades" class="form-label">Quality Grade *</label>
                <select
                  id="qualityGrades"
                  name="qualityGrades"
                  [(ngModel)]="supplierData.qualityGrades"
                  #qualityGradesField="ngModel"
                  required
                  class="form-select"
                  [class.is-invalid]="qualityGradesField.invalid && qualityGradesField.touched"
                >
                  <option value="">Select quality grade</option>
                  <option value="A">Grade A (Premium)</option>
                  <option value="B">Grade B (Standard)</option>
                  <option value="C">Grade C (Basic)</option>
                </select>
                <div class="invalid-feedback" *ngIf="qualityGradesField.invalid && qualityGradesField.touched">
                  Quality grade is required
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="collectionSchedule" class="form-label">Collection Schedule *</label>
                <select
                  id="collectionSchedule"
                  name="collectionSchedule"
                  [(ngModel)]="supplierData.collectionSchedule"
                  #collectionScheduleField="ngModel"
                  required
                  class="form-select"
                  [class.is-invalid]="collectionScheduleField.invalid && collectionScheduleField.touched"
                >
                  <option value="">Select collection schedule</option>
                  <option value="daily">Daily</option>
                  <option value="twice-daily">Twice Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom Schedule</option>
                </select>
                <div class="invalid-feedback" *ngIf="collectionScheduleField.invalid && collectionScheduleField.touched">
                  Collection schedule is required
                </div>
              </div>
              
              <div class="form-group">
                <label for="paymentMethod" class="form-label">Payment Method *</label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  [(ngModel)]="supplierData.paymentMethod"
                  #paymentMethodField="ngModel"
                  required
                  class="form-select"
                  [class.is-invalid]="paymentMethodField.invalid && paymentMethodField.touched"
                >
                  <option value="">Select payment method</option>
                  <option value="cash">Cash</option>
                  <option value="mobile-money">Mobile Money</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                </select>
                <div class="invalid-feedback" *ngIf="paymentMethodField.invalid && paymentMethodField.touched">
                  Payment method is required
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Details -->
          <div class="form-section" *ngIf="supplierData.paymentMethod === 'mobile-money' || supplierData.paymentMethod === 'bank-transfer'">
            <h3 class="section-title">Payment Details</h3>
            <div class="form-row">
              <div class="form-group" *ngIf="supplierData.paymentMethod === 'mobile-money'">
                <label for="mobileMoneyNumber" class="form-label">Mobile Money Number</label>
                <input
                  type="tel"
                  id="mobileMoneyNumber"
                  name="mobileMoneyNumber"
                  [(ngModel)]="supplierData.mobileMoneyNumber"
                  class="form-input"
                  placeholder="Enter mobile money number"
                >
              </div>
              
              <div class="form-group" *ngIf="supplierData.paymentMethod === 'bank-transfer'">
                <label for="bankAccount" class="form-label">Bank Account</label>
                <input
                  type="text"
                  id="bankAccount"
                  name="bankAccount"
                  [(ngModel)]="supplierData.bankAccount"
                  class="form-input"
                  placeholder="Enter bank account details"
                >
              </div>
            </div>
          </div>

          <!-- Additional Information -->
          <div class="form-section">
            <h3 class="section-title">Additional Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="idNumber" class="form-label">ID Number</label>
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  [(ngModel)]="supplierData.idNumber"
                  class="form-input"
                  placeholder="Enter ID number"
                >
              </div>
              
              <div class="form-group">
                <label for="gpsCoordinates" class="form-label">GPS Coordinates</label>
                <input
                  type="text"
                  id="gpsCoordinates"
                  name="gpsCoordinates"
                  [(ngModel)]="supplierData.gpsCoordinates"
                  class="form-input"
                  placeholder="Enter GPS coordinates"
                >
              </div>
            </div>

            <div class="form-group">
              <label for="notes" class="form-label">Notes</label>
              <textarea
                id="notes"
                name="notes"
                [(ngModel)]="supplierData.notes"
                class="form-textarea"
                rows="4"
                placeholder="Enter any additional notes about this supplier"
              ></textarea>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="form-actions">
            <button type="button" class="btn btn-danger-outline" routerLink="/suppliers/list">
              Cancel
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="supplierForm.invalid || isSubmitting"
            >
              <span *ngIf="isSubmitting" class="loading-spinner"></span>
              {{ isSubmitting ? 'Adding Supplier...' : 'Add Supplier' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./add-supplier.component.scss']
})
export class AddSupplierComponent implements OnInit {
  supplierData: CreateSupplierRequest = {
    name: '',
    phone: '',
    email: '',
    location: '',
    gpsCoordinates: '',
    businessType: '',
    cattleCount: 0,
    dailyProduction: 0,
    farmType: '',
    collectionSchedule: '',
    sellingPricePerLiter: 0,
    qualityGrades: '',
    paymentMethod: '',
    bankAccount: '',
    mobileMoneyNumber: '',
    idNumber: '',
    notes: ''
  };

  countryCode = '+250';
  isSubmitting = false;

  countryCodes = [
    { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
    { code: '+256', flag: '🇺🇬', name: 'Uganda' },
    { code: '+254', flag: '🇰🇪', name: 'Kenya' },
    { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
    { code: '+243', flag: '🇨🇩', name: 'DRC' },
    { code: '+257', flag: '🇧🇮', name: 'Burundi' }
  ];

  constructor(private suppliersService: SuppliersService) {}

  ngOnInit() {
    // Initialize with default values
    this.supplierData.countryCode = '+250';
  }

  onSubmit(form: NgForm) {
    if (form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    // Combine country code with phone number
    const fullPhone = this.supplierData.countryCode + this.supplierData.phone;

    const supplierData = {
      ...this.supplierData,
      phone: fullPhone
    };

    this.suppliersService.createSupplier(supplierData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.code === 200) {
          console.log('Supplier created successfully:', response);
          // Navigate back to suppliers list
          window.history.back();
        } else {
          console.error('Failed to create supplier:', response.message);
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error creating supplier:', error);
      }
    });
  }
}
