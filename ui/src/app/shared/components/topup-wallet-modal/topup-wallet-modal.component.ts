import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherIconComponent } from '../feather-icon/feather-icon.component';
import { WalletService, Wallet } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-topup-wallet-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FeatherIconComponent],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Top Up Wallet</h3>
          <button class="close-btn" (click)="close()">
            <app-feather-icon name="x" size="20px"></app-feather-icon>
          </button>
        </div>

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
              <button class="btn-secondary" (click)="showConfirmation = false">Cancel</button>
              <button class="btn-primary" (click)="confirmPayment()" [disabled]="isProcessing">
                <span *ngIf="isProcessing">Processing...</span>
                <span *ngIf="!isProcessing">I've Confirmed</span>
              </button>
            </div>
          </div>

          <!-- Top Up Form -->
          <form [formGroup]="topupForm" (ngSubmit)="onSubmit()" *ngIf="!showConfirmation">
            <!-- To Wallet -->
            <div class="form-group">
              <label>To Wallet</label>
              <select formControlName="walletId" class="form-control">
                <option value="">Select wallet</option>
                <option *ngFor="let wallet of wallets" [value]="wallet.id">
                  {{ wallet.name }} ({{ formatCurrency(wallet.balance) }})
                </option>
              </select>
              <div class="error-message" *ngIf="topupForm.get('walletId')?.touched && topupForm.get('walletId')?.errors?.['required']">
                Please select a wallet
              </div>
            </div>

            <!-- Amount -->
            <div class="form-group">
              <label>Amount</label>
              <div class="input-with-icon">
                <app-feather-icon name="dollar-sign" size="16px"></app-feather-icon>
                <input 
                  type="number" 
                  formControlName="amount" 
                  placeholder="Enter amount"
                  class="form-control">
              </div>
              <div class="error-message" *ngIf="topupForm.get('amount')?.touched && topupForm.get('amount')?.errors?.['required']">
                Amount is required
              </div>
              <div class="error-message" *ngIf="topupForm.get('amount')?.touched && topupForm.get('amount')?.errors?.['min']">
                Amount must be greater than 0
              </div>
            </div>

            <!-- Mobile Money Provider -->
            <div class="form-group">
              <label>Mobile Money Provider</label>
              <select formControlName="provider" class="form-control">
                <option value="">Select provider</option>
                <option value="MTN">MTN Mobile Money</option>
                <option value="Airtel">Airtel Money</option>
              </select>
              <div class="error-message" *ngIf="topupForm.get('provider')?.touched && topupForm.get('provider')?.errors?.['required']">
                Please select a provider
              </div>
            </div>

            <!-- Phone Number -->
            <div class="form-group">
              <label>Phone Number</label>
              <div class="input-with-icon">
                <app-feather-icon name="phone" size="16px"></app-feather-icon>
                <input 
                  type="tel" 
                  formControlName="phoneNumber" 
                  placeholder="e.g., 0788123456"
                  class="form-control">
              </div>
              <div class="error-message" *ngIf="topupForm.get('phoneNumber')?.touched && topupForm.get('phoneNumber')?.errors?.['required']">
                Phone number is required
              </div>
              <div class="error-message" *ngIf="topupForm.get('phoneNumber')?.touched && topupForm.get('phoneNumber')?.errors?.['minlength']">
                Enter a valid phone number
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="close()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="isLoading || topupForm.invalid">
                <span *ngIf="isLoading">Processing...</span>
                <span *ngIf="!isLoading">Submit</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./topup-wallet-modal.component.scss']
})
export class TopupWalletModalComponent implements OnInit {
  @Output() modalClosed = new EventEmitter<void>();
  @Output() topupCompleted = new EventEmitter<any>();

  topupForm: FormGroup;
  wallets: Wallet[] = [];
  isLoading = false;
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

    // Simulate mobile money processing
    setTimeout(() => {
      this.isProcessing = false;
      this.topupCompleted.emit(this.topupForm.value);
      this.close();
    }, 2000);
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  close() {
    this.modalClosed.emit();
  }
}

