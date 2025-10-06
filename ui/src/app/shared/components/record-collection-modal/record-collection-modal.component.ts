import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../feather-icon/feather-icon.component';
import { CollectionsService } from '../../../features/collections/collections.service';
import { SuppliersService } from '../../../features/suppliers/suppliers.service';
import { CreateCollectionRequest } from '../../../features/collections/collection.model';

@Component({
  selector: 'app-record-collection-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FeatherIconComponent],
  template: `
    <div class="modal-overlay" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="modal-header">
          <h2>Record Collection</h2>
          <button class="close-btn" (click)="closeModal()">
            <app-feather-icon name="x" size="20px"></app-feather-icon>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <form #collectionForm="ngForm" (ngSubmit)="onSubmit()">
            <!-- Supplier Selection -->
            <div class="form-group">
              <label for="supplier">Select Supplier *</label>
              <div class="input-container">
                <app-feather-icon name="user" size="18px" class="input-icon"></app-feather-icon>
                <select
                  id="supplier"
                  name="supplier"
                  [(ngModel)]="collectionData.supplierAccountCode"
                  #supplierField="ngModel"
                  required
                  class="form-input">
                  <option value="">Choose a supplier...</option>
                  <option *ngFor="let supplier of suppliers" [value]="supplier.accountCode">
                    {{ supplier.name }} - {{ supplier.phone }}
                  </option>
                </select>
              </div>
              <div class="error-message" *ngIf="supplierField.invalid && supplierField.touched">
                Please select a supplier
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
                  [(ngModel)]="collectionData.quantity"
                  #quantityField="ngModel"
                  required
                  min="0"
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
                  [(ngModel)]="collectionData.status"
                  #statusField="ngModel"
                  required
                  class="form-input">
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <!-- Collection Date and Time -->
            <div class="form-row">
              <div class="form-group">
                <label for="collectionDate">Collection Date *</label>
                <div class="input-container">
                  <app-feather-icon name="calendar" size="18px" class="input-icon"></app-feather-icon>
                  <input
                    type="date"
                    id="collectionDate"
                    name="collectionDate"
                    [(ngModel)]="collectionDate"
                    #dateField="ngModel"
                    required
                    class="form-input"
                  />
                </div>
              </div>

              <div class="form-group">
                <label for="collectionTime">Collection Time *</label>
                <div class="input-container">
                  <app-feather-icon name="clock" size="18px" class="input-icon"></app-feather-icon>
                  <input
                    type="time"
                    id="collectionTime"
                    name="collectionTime"
                    [(ngModel)]="collectionTime"
                    #timeField="ngModel"
                    required
                    class="form-input"
                  />
                </div>
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
                  [(ngModel)]="collectionData.notes"
                  placeholder="Add any additional notes..."
                  rows="3"
                  class="textarea-input">
                </textarea>
              </div>
            </div>

            <!-- Summary Card -->
            <div class="summary-card" *ngIf="collectionData.supplierAccountCode && collectionData.quantity">
              <h4>Collection Summary</h4>
              <div class="summary-row">
                <span>Supplier:</span>
                <span>{{ getSelectedSupplierName() }}</span>
              </div>
              <div class="summary-row">
                <span>Quantity:</span>
                <span>{{ collectionData.quantity }}L</span>
              </div>
              <div class="summary-row">
                <span>Status:</span>
                <span class="status-badge" [class]="collectionData.status">
                  {{ collectionData.status | titlecase }}
                </span>
              </div>
              <div class="summary-row">
                <span>Date & Time:</span>
                <span>{{ formatDateTime() }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="modal-footer">
              <button type="button" class="btn btn-danger-outline" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!collectionForm.valid || loading">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                Record Collection
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./record-collection-modal.component.scss']
})
export class RecordCollectionModalComponent implements OnInit {
  @Output() collectionRecorded = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();

  collectionData: CreateCollectionRequest = {
    supplierAccountCode: '',
    quantity: 0,
    status: 'accepted',
    notes: '',
    collectionAt: new Date()
  };

  suppliers: any[] = [];
  collectionDate = '';
  collectionTime = '';
  loading = false;

  private collectionsService = inject(CollectionsService);
  private suppliersService = inject(SuppliersService);

  ngOnInit() {
    this.setCurrentDateTime();
    this.loadSuppliers();
  }

  setCurrentDateTime() {
    const now = new Date();
    this.collectionDate = now.toISOString().split('T')[0];
    this.collectionTime = now.toTimeString().split(' ')[0].substring(0, 5);
  }

  loadSuppliers() {
    this.suppliersService.getSuppliers().subscribe({
      next: (response) => {
        if (response.code === 200 || response.status === 'success') {
          this.suppliers = response.data || [];
        }
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        // Load mock suppliers for development
        this.suppliers = [
          { accountCode: 'A_120BA3', name: 'kayumba', phone: '+250 788 123 456' },
          { accountCode: 'A_BA957A', name: 'pasteur', phone: '+250 788 234 567' },
          { accountCode: 'A_825DE9', name: 'Rwahama', phone: '+250 788 345 678' },
          { accountCode: 'A_AE9A68', name: 'celestin', phone: '+250 788 456 789' },
          { accountCode: 'A_1B047F', name: 'Arbert', phone: '+250 788 567 890' }
        ];
      }
    });
  }

  onSubmit() {
    if (this.loading) return;

    this.loading = true;
    
    // Combine date and time
    const collectionDateTime = new Date(`${this.collectionDate}T${this.collectionTime}`);
    this.collectionData.collectionAt = collectionDateTime;

    this.collectionsService.createCollection(this.collectionData).subscribe({
      next: (response) => {
        console.log('Collection recorded successfully:', response);
        this.collectionRecorded.emit(response);
        this.closeModal();
      },
      error: (error) => {
        console.error('Error recording collection:', error);
        // Handle error (e.g., show an alert)
        alert('Failed to record collection. Please try again.');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  closeModal() {
    this.modalClosed.emit();
  }

  getSelectedSupplierName(): string {
    const supplier = this.suppliers.find(s => s.accountCode === this.collectionData.supplierAccountCode);
    return supplier ? supplier.name : '';
  }

  formatDateTime(): string {
    if (this.collectionDate && this.collectionTime) {
      const date = new Date(`${this.collectionDate}T${this.collectionTime}`);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return '';
  }
}
