import { Component, EventEmitter, Output, OnInit } from '@angular/core';
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
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Send Money</h3>
          <button class="close-btn" (click)="close()">
            <app-feather-icon name="x" size="20px"></app-feather-icon>
          </button>
        </div>

        <div class="modal-body">
          <!-- Method Selector -->
          <div class="method-selector">
            <button 
              class="method-btn" 
              [class.active]="payMethod === 'reference'"
              (click)="setPayMethod('reference')">
              <app-feather-icon name="hash" size="18px"></app-feather-icon>
              <span>Reference</span>
            </button>
            <button 
              class="method-btn" 
              [class.active]="payMethod === 'qr'"
              (click)="setPayMethod('qr')">
              <app-feather-icon name="maximize" size="18px"></app-feather-icon>
              <span>Scan QR</span>
            </button>
            <button 
              class="method-btn" 
              [class.active]="payMethod === 'contact'"
              (click)="setPayMethod('contact')">
              <app-feather-icon name="user" size="18px"></app-feather-icon>
              <span>Contact</span>
            </button>
          </div>

          <form [formGroup]="sendForm" (ngSubmit)="onSubmit()">
            <!-- From Wallet -->
            <div class="form-group">
              <label>From Wallet</label>
              <select formControlName="walletId" class="form-control">
                <option value="">Select wallet</option>
                <option *ngFor="let wallet of wallets" [value]="wallet.id">
                  {{ wallet.name }} ({{ formatCurrency(wallet.balance) }})
                </option>
              </select>
              <div class="error-message" *ngIf="sendForm.get('walletId')?.touched && sendForm.get('walletId')?.errors?.['required']">
                Please select a wallet
              </div>
            </div>

            <!-- Reference Input -->
            <div class="form-group" *ngIf="payMethod === 'reference'">
              <label>Reference Code</label>
              <div class="input-with-icon">
                <app-feather-icon name="hash" size="16px"></app-feather-icon>
                <input 
                  type="text" 
                  formControlName="reference" 
                  placeholder="Enter reference code"
                  class="form-control">
              </div>
            </div>

            <!-- QR Code Input -->
            <div class="form-group" *ngIf="payMethod === 'qr'">
              <label>Scan QR Code</label>
              <div class="qr-input-group">
                <div class="input-with-icon flex-1">
                  <app-feather-icon name="maximize" size="16px"></app-feather-icon>
                  <input 
                    type="text" 
                    formControlName="reference" 
                    placeholder="Scanned reference will appear here"
                    class="form-control"
                    readonly>
                </div>
                <button type="button" class="scan-btn" (click)="scanQR()">
                  <app-feather-icon name="camera" size="18px"></app-feather-icon>
                </button>
              </div>
            </div>

            <!-- Contact Input -->
            <div class="form-group" *ngIf="payMethod === 'contact'">
              <label>Recipient Phone Number</label>
              <div class="input-with-icon">
                <app-feather-icon name="phone" size="16px"></app-feather-icon>
                <input 
                  type="tel" 
                  formControlName="phoneNumber" 
                  placeholder="e.g., 0788123456"
                  class="form-control">
              </div>
              <div class="error-message" *ngIf="sendForm.get('phoneNumber')?.touched && sendForm.get('phoneNumber')?.errors?.['required']">
                Phone number is required
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
              <div class="error-message" *ngIf="sendForm.get('amount')?.touched && sendForm.get('amount')?.errors?.['required']">
                Amount is required
              </div>
              <div class="error-message" *ngIf="sendForm.get('amount')?.touched && sendForm.get('amount')?.errors?.['min']">
                Amount must be greater than 0
              </div>
            </div>

            <!-- Note -->
            <div class="form-group">
              <label>Note (optional)</label>
              <div class="input-with-icon">
                <app-feather-icon name="edit-3" size="16px"></app-feather-icon>
                <input 
                  type="text" 
                  formControlName="note" 
                  placeholder="Add a note"
                  class="form-control">
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="close()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="isLoading || sendForm.invalid">
                <span *ngIf="isLoading">Processing...</span>
                <span *ngIf="!isLoading">Send Money</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./send-money-modal.component.scss']
})
export class SendMoneyModalComponent implements OnInit {
  @Output() modalClosed = new EventEmitter<void>();
  @Output() moneySent = new EventEmitter<any>();

  sendForm: FormGroup;
  wallets: Wallet[] = [];
  payMethod: PayMethod = 'reference';
  isLoading = false;

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
    // Simulate QR scan
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
    if (this.sendForm.invalid) return;

    this.isLoading = true;
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.moneySent.emit(this.sendForm.value);
      this.close();
    }, 1500);
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

