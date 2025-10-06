import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../feather-icon/feather-icon.component';
import { SalesService } from '../../../features/sales/sales.service';
import { CreateSaleRequest } from '../../../features/sales/sale.model';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer } from '../../../core/services/customer.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-record-sale-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FeatherIconComponent],
  template: `
    <div class="modal-overlay" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="modal-header">
          <h2>Record Milk Sale</h2>
          <button class="close-btn" (click)="closeModal()">
            <app-feather-icon name="x" size="20px"></app-feather-icon>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <form #saleForm="ngForm" (ngSubmit)="onSubmit()">
            <!-- Customer Selection -->
            <div class="form-group">
              <label for="customer">Select Customer *</label>
              <div class="input-container">
                <app-feather-icon name="user" size="18px" class="input-icon"></app-feather-icon>
                <select
                  id="customer"
                  name="customer"
                  [(ngModel)]="selectedCustomerAccountCode"
                  #customerField="ngModel"
                  required
                  class="form-select"
                >
                  <option value="">-- Select Customer --</option>
                  <option *ngFor="let customer of customers$ | async" [value]="customer.accountCode">
                    {{ customer.name }} ({{ customer.accountCode }})
                  </option>
                </select>
              </div>
              <div class="error-message" *ngIf="customerField.invalid && customerField.touched">
                Please select a customer
              </div>
            </div>

            <!-- Quantity Field -->
            <div class="form-group">
              <label for="quantity">Quantity (Liters) *</label>
              <div class="input-container">
                <app-feather-icon name="droplet" size="18px" class="input-icon"></app-feather-icon>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  [(ngModel)]="saleData.quantity"
                  #quantityField="ngModel"
                  required
                  min="0.1"
                  step="0.1"
                  placeholder="Enter quantity in liters"
                  class="form-input"
                />
              </div>
              <div class="error-message" *ngIf="quantityField.invalid && quantityField.touched">
                Please enter a valid quantity
              </div>
            </div>

            <!-- Status Field -->
            <div class="form-group">
              <label for="status">Status *</label>
              <div class="input-container">
                <app-feather-icon name="check-circle" size="18px" class="input-icon"></app-feather-icon>
                <select
                  id="status"
                  name="status"
                  [(ngModel)]="saleData.status"
                  #statusField="ngModel"
                  required
                  class="form-select"
                >
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div class="error-message" *ngIf="statusField.invalid && statusField.touched">
                Please select a status
              </div>
            </div>

            <!-- Sale Date & Time -->
            <div class="form-group">
              <label for="saleAt">Sale Date & Time *</label>
              <div class="input-container">
                <input
                  type="datetime-local"
                  id="saleAt"
                  name="saleAt"
                  [(ngModel)]="saleDateTimeLocal"
                  #saleAtField="ngModel"
                  required
                  class="form-input"
                />
              </div>
              <div class="error-message" *ngIf="saleAtField.invalid && saleAtField.touched">
                Please select sale date and time
              </div>
            </div>

            <!-- Notes Field -->
            <div class="form-group">
              <label for="notes">Notes (Optional)</label>
              <div class="input-container">
                <app-feather-icon name="file-text" size="18px" class="input-icon"></app-feather-icon>
                <textarea
                  id="notes"
                  name="notes"
                  [(ngModel)]="saleData.notes"
                  placeholder="Add any additional notes"
                  class="form-textarea"
                  rows="3"
                ></textarea>
              </div>
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
                [disabled]="saleForm.invalid || isSubmitting"
              >
                <span *ngIf="!isSubmitting">Record Sale</span>
                <span *ngIf="isSubmitting">Recording...</span>
                <app-feather-icon name="loader" size="16px" *ngIf="isSubmitting" class="spinning"></app-feather-icon>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./record-sale-modal.component.scss'],
})
export class RecordSaleModalComponent implements OnInit {
  @Output() saleRecorded = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();

  saleData: CreateSaleRequest = {
    customerAccountCode: '',
    quantity: 0,
    status: 'accepted',
    notes: '',
    saleAt: new Date()
  };

  selectedCustomerAccountCode: string = '';
  saleDateTimeLocal: string = ''; // For datetime-local input
  isSubmitting = false;
  customers$: Observable<Customer[]> = of([]);

  private salesService = inject(SalesService);
  private customerService = inject(CustomerService);

  ngOnInit() {
    this.loadCustomers();
    this.setInitialDateTime();
  }

  loadCustomers() {
    this.customers$ = of(this.customerService.getCustomers());
  }

  setInitialDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Adjust for local timezone
    this.saleDateTimeLocal = now.toISOString().slice(0, 16);
    this.saleData.saleAt = now;
  }

  onSubmit() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.saleData.customerAccountCode = this.selectedCustomerAccountCode;
    this.saleData.saleAt = new Date(this.saleDateTimeLocal);

    this.salesService.createSale(this.saleData).subscribe({
      next: (response) => {
        console.log('Sale recorded successfully:', response);
        this.saleRecorded.emit(response);
        this.isSubmitting = false;
        this.closeModal();
      },
      error: (error) => {
        console.error('Failed to record sale:', error);
        alert('Failed to record sale: ' + error.message);
        this.isSubmitting = false;
      }
    });
  }

  closeModal() {
    this.modalClosed.emit();
  }
}
