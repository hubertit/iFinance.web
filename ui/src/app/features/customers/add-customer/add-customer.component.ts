import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { CustomerService, Customer } from '../../../core/services/customer.service';

@Component({
  selector: 'app-add-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, FeatherIconComponent],
  template: `
    <div class="add-customer-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <button class="back-btn" (click)="goBack()">
            <app-feather-icon name="arrow-left" size="20px"></app-feather-icon>
          </button>
          <div class="header-text">
            <h1>Add New Customer</h1>
            <p class="page-description">Create a new customer profile in your system</p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <div class="form-container">
        <form (ngSubmit)="onSubmit()" #customerForm="ngForm" class="customer-form">
          <!-- Personal Information -->
          <div class="form-section">
            <div class="section-header">
              <h3>Personal Information</h3>
              <p>Basic details about the customer</p>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label for="name" class="form-label">Full Name *</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  [(ngModel)]="customer.name" 
                  required 
                  class="form-input"
                  placeholder="Enter customer's full name">
              </div>
              <div class="form-group">
                <label for="email" class="form-label">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  [(ngModel)]="customer.email" 
                  class="form-input"
                  placeholder="customer@example.com">
              </div>
              <div class="form-group">
                <label for="phone" class="form-label">Phone Number *</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone" 
                  [(ngModel)]="customer.phone" 
                  required 
                  class="form-input"
                  placeholder="+250788123456">
              </div>
              <div class="form-group">
                <label for="customerType" class="form-label">Customer Type *</label>
                <select 
                  id="customerType" 
                  name="customerType" 
                  [(ngModel)]="customer.customerType" 
                  required 
                  class="form-select">
                  <option value="">Select customer type</option>
                  <option value="Individual">Individual</option>
                  <option value="Business">Business</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="School">School</option>
                  <option value="Hospital">Hospital</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Address Information -->
          <div class="form-section">
            <div class="section-header">
              <h3>Address Information</h3>
              <p>Customer's location details</p>
            </div>
            <div class="form-grid">
              <div class="form-group full-width">
                <label for="address" class="form-label">Street Address *</label>
                <input 
                  type="text" 
                  id="address" 
                  name="address" 
                  [(ngModel)]="customer.address" 
                  required 
                  class="form-input"
                  placeholder="Enter street address">
              </div>
              <div class="form-group">
                <label for="city" class="form-label">City *</label>
                <input 
                  type="text" 
                  id="city" 
                  name="city" 
                  [(ngModel)]="customer.city" 
                  required 
                  class="form-input"
                  placeholder="Enter city">
              </div>
              <div class="form-group">
                <label for="region" class="form-label">Region *</label>
                <select 
                  id="region" 
                  name="region" 
                  [(ngModel)]="customer.region" 
                  required 
                  class="form-select">
                  <option value="">Select region</option>
                  <option value="Kigali">Kigali</option>
                  <option value="Northern Province">Northern Province</option>
                  <option value="Southern Province">Southern Province</option>
                  <option value="Eastern Province">Eastern Province</option>
                  <option value="Western Province">Western Province</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Preferences -->
          <div class="form-section">
            <div class="section-header">
              <h3>Preferences</h3>
              <p>Customer's delivery and service preferences</p>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label for="preferredDeliveryTime" class="form-label">Preferred Delivery Time</label>
                <select 
                  id="preferredDeliveryTime" 
                  name="preferredDeliveryTime" 
                  [(ngModel)]="customer.preferredDeliveryTime" 
                  class="form-select">
                  <option value="">Select preferred time</option>
                  <option value="Early Morning (5:00-7:00)">Early Morning (5:00-7:00)</option>
                  <option value="Morning (7:00-9:00)">Morning (7:00-9:00)</option>
                  <option value="Late Morning (9:00-11:00)">Late Morning (9:00-11:00)</option>
                  <option value="Afternoon (13:00-15:00)">Afternoon (13:00-15:00)</option>
                  <option value="Evening (17:00-19:00)">Evening (17:00-19:00)</option>
                </select>
              </div>
              <div class="form-group">
                <label for="status" class="form-label">Status</label>
                <select 
                  id="status" 
                  name="status" 
                  [(ngModel)]="customer.status" 
                  class="form-select">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="notes" class="form-label">Notes</label>
              <textarea 
                id="notes" 
                name="notes" 
                [(ngModel)]="customer.notes" 
                class="form-textarea"
                rows="4"
                placeholder="Additional notes about the customer..."></textarea>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="goBack()">
              Cancel
            </button>
            <button type="submit" class="btn-primary" [disabled]="!customerForm.valid || isSubmitting">
              <app-feather-icon *ngIf="isSubmitting" name="loader" size="16px" class="spinning"></app-feather-icon>
              <app-feather-icon *ngIf="!isSubmitting" name="save" size="16px"></app-feather-icon>
              {{ isSubmitting ? 'Creating...' : 'Create Customer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./add-customer.component.scss']
})
export class AddCustomerComponent implements OnInit {
  customer: Partial<Customer> = {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    customerType: 'Individual',
    status: 'Active',
    preferredDeliveryTime: '',
    notes: ''
  };

  isSubmitting = false;

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit() {
    // Initialize form
  }

  onSubmit() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    this.customerService.addCustomer({
      name: this.customer.name!,
      phone: this.customer.phone!,
      email: this.customer.email,
      address: this.customer.address,
      pricePerLiter: this.customer.pricePerLiter || 0
    }).subscribe({
      next: (response) => {
        console.log('Customer created:', response);
        
        // Show success message
        alert('Customer created successfully!');
        
        // Navigate back to customers list
        this.router.navigate(['/customers/list']);
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error creating customer:', error);
        alert('Error creating customer. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/customers/list']);
  }
}
