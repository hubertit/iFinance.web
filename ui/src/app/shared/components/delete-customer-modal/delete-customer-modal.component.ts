import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatherIconComponent } from '../feather-icon/feather-icon.component';
import { Customer } from '../../../core/services/customer.service';

@Component({
  selector: 'app-delete-customer-modal',
  standalone: true,
  imports: [CommonModule, FeatherIconComponent],
  template: `
    <!-- Modal -->
    <div class="modal fade" [class.show]="true" [style.display]="'block'" 
         tabindex="-1" role="dialog" [attr.aria-hidden]="false">
      <div class="modal-dialog modal-md modal-dialog-centered" role="document">
        <div class="modal-content">
          <!-- Modal Header -->
          <div class="modal-header">
            <h5 class="modal-title">Delete Customer</h5>
            <button type="button" class="btn-close-custom" (click)="closeModal()" aria-label="Close">
              <app-feather-icon name="x" size="18px"></app-feather-icon>
            </button>
          </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <div class="delete-warning">
            <div class="warning-icon">
              <app-feather-icon name="alert-triangle" size="48px"></app-feather-icon>
            </div>
            
            <h3>Are you sure you want to delete this customer?</h3>
            
            <div class="customer-preview">
              <div class="customer-avatar">
                <img [src]="customer.avatar || 'assets/img/user.png'" [alt]="customer.name" class="avatar-img">
              </div>
              <div class="customer-info">
                <div class="customer-name">{{ customer.name }}</div>
                <div class="customer-phone">{{ customer.phone }}</div>
                <div class="customer-address">{{ customer.address || customer.location }}</div>
              </div>
            </div>

            <div class="warning-message">
              <p><strong>This action cannot be undone.</strong></p>
              <p>All customer data, including:</p>
              <ul>
                <li>Customer information</li>
                <li>Purchase history</li>
                <li>Payment records</li>
                <li>Related transactions</li>
              </ul>
              <p>will be permanently deleted.</p>
            </div>
          </div>
        </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <button type="button" class="btn btn-danger-outline" (click)="closeModal()">Cancel</button>
            <button type="button" class="btn btn-danger" (click)="confirmDelete()" [disabled]="isDeleting">
              <span *ngIf="!isDeleting">Delete Customer</span>
              <span *ngIf="isDeleting">Deleting...</span>
              <app-feather-icon name="loader" size="16px" *ngIf="isDeleting" class="spinning"></app-feather-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal Backdrop -->
    <div class="modal-backdrop fade show"></div>
  `,
  styleUrls: ['./delete-customer-modal.component.scss']
})
export class DeleteCustomerModalComponent {
  @Input() customer!: Customer;
  @Output() customerDeleted = new EventEmitter<Customer>();
  @Output() modalClosed = new EventEmitter<void>();

  isDeleting = false;

  closeModal() {
    this.modalClosed.emit();
  }

  confirmDelete() {
    if (this.isDeleting) return;

    this.isDeleting = true;
    
    // Simulate API call
    setTimeout(() => {
      this.customerDeleted.emit(this.customer);
      this.isDeleting = false;
      this.closeModal();
    }, 1500);
  }
}
