import { Component, EventEmitter, Output, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherIconComponent } from '../feather-icon/feather-icon.component';
import { WalletService, Wallet } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-topup-wallet-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FeatherIconComponent],
  template: `
    <!-- Modal -->
    <div class="modal fade" [class.show]="isVisible" [style.display]="isVisible ? 'block' : 'none'" 
         tabindex="-1" role="dialog" [attr.aria-hidden]="!isVisible">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <!-- Modal Header -->
          <div class="modal-header">
            <h5 class="modal-title">Top Up Wallet</h5>
            <button type="button" class="btn-close-custom" (click)="onClose()" aria-label="Close">
              <app-feather-icon name="x" size="18px"></app-feather-icon>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <!-- Confirmation Dialog -->
            <div class="confirmation-dialog" *ngIf="showConfirmation">
              <div class="confirm-icon">
                <app-feather-icon name="smartphone" size="32px"></app-feather-icon>
              </div>
              <h4>Mobile Money Payment</h4>
              <p>Please confirm the payment on your mobile money account:</p>
              
              <div class="confirm-details">
                <div class="detail-row">
                  <span class="label">Provider:</span>
                  <span class="value">{{ topupForm.get('provider')?.value }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Phone:</span>
                  <span class="value">{{ topupForm.get('phoneNumber')?.value }}</span>
                </div>
                <div class="detail-row highlight">
                  <span class="label">Amount:</span>
                  <span class="value">{{ formatCurrency(topupForm.get('amount')?.value) }}</span>
                </div>
              </div>

              <p class="hint">Check your phone for a mobile money prompt and confirm the payment.</p>

              <div class="confirm-actions">
                <button type="button" class="btn btn-secondary" (click)="showConfirmation = false">Cancel</button>
                <button type="button" class="btn btn-primary" (click)="confirmPayment()" [disabled]="isProcessing">
                  <span *ngIf="isProcessing" class="spinner-border spinner-border-sm me-1" role="status"></span>
                  {{ isProcessing ? 'Processing...' : "I've Confirmed" }}
                </button>
              </div>
            </div>

            <!-- Top Up Form -->
            <form [formGroup]="topupForm" (ngSubmit)="onSubmit()" *ngIf="!showConfirmation" novalidate>
              <!-- To Wallet -->
              <div class="mb-3">
                <label for="walletId" class="form-label required">
                  <app-feather-icon name="credit-card" size="16px" class="me-1"></app-feather-icon>
                  To Wallet
                </label>
                <select 
                  id="walletId"
                  formControlName="walletId" 
                  class="form-select"
                  [class.is-invalid]="topupForm.get('walletId')?.touched && topupForm.get('walletId')?.invalid">
                  <option value="">Select wallet</option>
                  <option *ngFor="let wallet of wallets" [value]="wallet.id">
                    {{ wallet.name }} ({{ formatCurrency(wallet.balance) }})
                  </option>
                </select>
                <div *ngIf="topupForm.get('walletId')?.touched && topupForm.get('walletId')?.errors?.['required']" class="invalid-feedback">
                  Please select a wallet
                </div>
              </div>

              <!-- Amount -->
              <div class="mb-3">
                <label for="amount" class="form-label required">
                  <app-feather-icon name="dollar-sign" size="16px" class="me-1"></app-feather-icon>
                  Amount
                </label>
                <input 
                  type="number"
                  id="amount" 
                  formControlName="amount" 
                  placeholder="Enter amount"
                  class="form-control"
                  [class.is-invalid]="topupForm.get('amount')?.touched && topupForm.get('amount')?.invalid">
                <div *ngIf="topupForm.get('amount')?.touched && topupForm.get('amount')?.errors?.['required']" class="invalid-feedback">
                  Amount is required
                </div>
                <div *ngIf="topupForm.get('amount')?.touched && topupForm.get('amount')?.errors?.['min']" class="invalid-feedback">
                  Amount must be greater than 0
                </div>
              </div>

              <!-- Mobile Money Provider -->
              <div class="mb-3">
                <label for="provider" class="form-label required">
                  <app-feather-icon name="smartphone" size="16px" class="me-1"></app-feather-icon>
                  Mobile Money Provider
                </label>
                <select 
                  id="provider"
                  formControlName="provider" 
                  class="form-select"
                  [class.is-invalid]="topupForm.get('provider')?.touched && topupForm.get('provider')?.invalid">
                  <option value="">Select provider</option>
                  <option value="MTN">MTN Mobile Money</option>
                  <option value="Airtel">Airtel Money</option>
                </select>
                <div *ngIf="topupForm.get('provider')?.touched && topupForm.get('provider')?.errors?.['required']" class="invalid-feedback">
                  Please select a provider
                </div>
              </div>

              <!-- Phone Number -->
              <div class="mb-3">
                <label for="phoneNumber" class="form-label required">
                  <app-feather-icon name="phone" size="16px" class="me-1"></app-feather-icon>
                  Phone Number
                </label>
                <input 
                  type="tel"
                  id="phoneNumber" 
                  formControlName="phoneNumber" 
                  placeholder="e.g., 0788123456"
                  class="form-control"
                  [class.is-invalid]="topupForm.get('phoneNumber')?.touched && topupForm.get('phoneNumber')?.invalid">
                <div *ngIf="topupForm.get('phoneNumber')?.touched && topupForm.get('phoneNumber')?.errors?.['required']" class="invalid-feedback">
                  Phone number is required
                </div>
                <div *ngIf="topupForm.get('phoneNumber')?.touched && topupForm.get('phoneNumber')?.errors?.['minlength']" class="invalid-feedback">
                  Enter a valid phone number
                </div>
              </div>
            </form>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer" *ngIf="!showConfirmation">
            <button type="button" class="btn btn-secondary" (click)="onClose()" [disabled]="isLoading">
              Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              (click)="onSubmit()"
              [disabled]="isLoading || topupForm.invalid">
              <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
              {{ isLoading ? 'Processing...' : 'Submit' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div class="modal-backdrop fade" [class.show]="isVisible" *ngIf="isVisible" (click)="onBackdropClick()"></div>
  `,
  styleUrls: ['./topup-wallet-modal.component.scss']
})
export class TopupWalletModalComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() isLoading = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  topupForm: FormGroup;
  wallets: Wallet[] = [];
  isProcessing = false;
  showConfirmation = false;

  constructor(
    private fb: FormBuilder,
    private walletService: WalletService
  ) {
    this.topupForm = this.fb.group({
      walletId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      provider: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    this.loadWallets();
  }

  ngOnChanges() {
    if (this.isVisible) {
      this.resetForm();
    }
  }

  private resetForm() {
    this.topupForm.reset();
    this.showConfirmation = false;
    if (this.wallets.length > 0) {
      const defaultWallet = this.wallets.find(w => w.isDefault) || this.wallets[0];
      this.topupForm.patchValue({ walletId: defaultWallet.id });
    }
  }

  loadWallets() {
    this.walletService.wallets$.subscribe(wallets => {
      this.wallets = wallets;
      if (wallets.length > 0) {
        const defaultWallet = wallets.find(w => w.isDefault) || wallets[0];
        this.topupForm.patchValue({ walletId: defaultWallet.id });
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }

  onSubmit() {
    if (this.topupForm.invalid) return;
    this.showConfirmation = true;
  }

  confirmPayment() {
    this.isProcessing = true;

    setTimeout(() => {
      this.isProcessing = false;
      this.save.emit(this.topupForm.value);
    }, 2000);
  }

  onBackdropClick() {
    if (!this.isLoading && !this.isProcessing) {
      this.onClose();
    }
  }

  onClose() {
    this.close.emit();
  }
}
