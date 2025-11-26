import { Component, EventEmitter, Output, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherIconComponent } from '../feather-icon/feather-icon.component';
import { WalletService, Wallet } from '../../../core/services/wallet.service';

type PayMethod = 'reference' | 'qr' | 'contact';

@Component({
  selector: 'app-send-money-modal',
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
            <h5 class="modal-title">Send Money</h5>
            <button type="button" class="btn-close-custom" (click)="onClose()" aria-label="Close">
              <app-feather-icon name="x" size="18px"></app-feather-icon>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <!-- Method Selector -->
            <div class="method-selector mb-3">
              <button 
                type="button"
                class="method-btn" 
                [class.active]="payMethod === 'reference'"
                (click)="setPayMethod('reference')">
                <app-feather-icon name="hash" size="18px"></app-feather-icon>
                <span>Reference</span>
              </button>
              <button 
                type="button"
                class="method-btn" 
                [class.active]="payMethod === 'qr'"
                (click)="setPayMethod('qr')">
                <app-feather-icon name="maximize" size="18px"></app-feather-icon>
                <span>Scan QR</span>
              </button>
              <button 
                type="button"
                class="method-btn" 
                [class.active]="payMethod === 'contact'"
                (click)="setPayMethod('contact')">
                <app-feather-icon name="user" size="18px"></app-feather-icon>
                <span>Contact</span>
              </button>
            </div>

            <form [formGroup]="sendForm" (ngSubmit)="onSubmit()" novalidate>
              <!-- From Wallet -->
              <div class="mb-3">
                <label for="walletId" class="form-label required">
                  <app-feather-icon name="credit-card" size="16px" class="me-1"></app-feather-icon>
                  From Wallet
                </label>
                <select 
                  id="walletId"
                  formControlName="walletId" 
                  class="form-select"
                  [class.is-invalid]="sendForm.get('walletId')?.touched && sendForm.get('walletId')?.invalid">
                  <option value="">Select wallet</option>
                  <option *ngFor="let wallet of wallets" [value]="wallet.id">
                    {{ wallet.name }} ({{ formatCurrency(wallet.balance) }})
                  </option>
                </select>
                <div *ngIf="sendForm.get('walletId')?.touched && sendForm.get('walletId')?.errors?.['required']" class="invalid-feedback">
                  Please select a wallet
                </div>
              </div>

              <!-- Reference Input -->
              <div class="mb-3" *ngIf="payMethod === 'reference'">
                <label for="reference" class="form-label">
                  <app-feather-icon name="hash" size="16px" class="me-1"></app-feather-icon>
                  Reference Code
                </label>
                <input 
                  type="text" 
                  id="reference"
                  formControlName="reference" 
                  placeholder="Enter reference code"
                  class="form-control">
              </div>

              <!-- QR Code Input -->
              <div class="mb-3" *ngIf="payMethod === 'qr'">
                <label for="qrReference" class="form-label">
                  <app-feather-icon name="maximize" size="16px" class="me-1"></app-feather-icon>
                  Scan QR Code
                </label>
                <div class="input-group">
                  <input 
                    type="text" 
                    id="qrReference"
                    formControlName="reference" 
                    placeholder="Scanned reference will appear here"
                    class="form-control"
                    readonly>
                  <button type="button" class="btn btn-outline-primary" (click)="scanQR()">
                    <app-feather-icon name="camera" size="18px"></app-feather-icon>
                  </button>
                </div>
              </div>

              <!-- Contact Input -->
              <div class="mb-3" *ngIf="payMethod === 'contact'">
                <label for="phoneNumber" class="form-label required">
                  <app-feather-icon name="phone" size="16px" class="me-1"></app-feather-icon>
                  Recipient Phone Number
                </label>
                <input 
                  type="tel" 
                  id="phoneNumber"
                  formControlName="phoneNumber" 
                  placeholder="e.g., 0788123456"
                  class="form-control"
                  [class.is-invalid]="sendForm.get('phoneNumber')?.touched && sendForm.get('phoneNumber')?.invalid">
                <div *ngIf="sendForm.get('phoneNumber')?.touched && sendForm.get('phoneNumber')?.errors?.['required']" class="invalid-feedback">
                  Phone number is required
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
                  [class.is-invalid]="sendForm.get('amount')?.touched && sendForm.get('amount')?.invalid">
                <div *ngIf="sendForm.get('amount')?.touched && sendForm.get('amount')?.errors?.['required']" class="invalid-feedback">
                  Amount is required
                </div>
                <div *ngIf="sendForm.get('amount')?.touched && sendForm.get('amount')?.errors?.['min']" class="invalid-feedback">
                  Amount must be greater than 0
                </div>
              </div>

              <!-- Note -->
              <div class="mb-3">
                <label for="note" class="form-label">
                  <app-feather-icon name="edit-3" size="16px" class="me-1"></app-feather-icon>
                  Note (optional)
                </label>
                <input 
                  type="text" 
                  id="note"
                  formControlName="note" 
                  placeholder="Add a note"
                  class="form-control">
              </div>
            </form>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-danger" (click)="onClose()" [disabled]="isLoading">
              <app-feather-icon name="x" size="16px" class="me-1"></app-feather-icon>
              Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              (click)="onSubmit()"
              [disabled]="isLoading || sendForm.invalid">
              <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
              {{ isLoading ? 'Processing...' : 'Send Money' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div class="modal-backdrop fade" [class.show]="isVisible" *ngIf="isVisible" (click)="onBackdropClick()"></div>
  `,
  styleUrls: ['./send-money-modal.component.scss']
})
export class SendMoneyModalComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() isLoading = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  sendForm: FormGroup;
  wallets: Wallet[] = [];
  payMethod: PayMethod = 'reference';

  constructor(
    private fb: FormBuilder,
    private walletService: WalletService
  ) {
    this.sendForm = this.fb.group({
      walletId: ['', Validators.required],
      reference: [''],
      phoneNumber: [''],
      amount: ['', [Validators.required, Validators.min(1)]],
      note: ['']
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
    this.sendForm.reset();
    this.payMethod = 'reference';
    if (this.wallets.length > 0) {
      const defaultWallet = this.wallets.find(w => w.isDefault) || this.wallets[0];
      this.sendForm.patchValue({ walletId: defaultWallet.id });
    }
  }

  loadWallets() {
    this.walletService.wallets$.subscribe(wallets => {
      this.wallets = wallets;
      if (wallets.length > 0) {
        const defaultWallet = wallets.find(w => w.isDefault) || wallets[0];
        this.sendForm.patchValue({ walletId: defaultWallet.id });
      }
    });
  }

  setPayMethod(method: PayMethod) {
    this.payMethod = method;
    this.sendForm.patchValue({ reference: '', phoneNumber: '' });
  }

  scanQR() {
    this.sendForm.patchValue({ reference: 'REF-QR-' + Date.now() });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  onSubmit() {
    if (this.sendForm.invalid || this.isLoading) return;
    this.save.emit(this.sendForm.value);
  }

  onBackdropClick() {
    if (!this.isLoading) {
      this.onClose();
    }
  }

  onClose() {
    this.close.emit();
  }
}
