import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherIconComponent } from '../feather-icon/feather-icon.component';
import { WalletService, Wallet } from '../../../core/services/wallet.service';

type RequestType = 'link' | 'qr' | 'direct';

@Component({
  selector: 'app-request-money-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FeatherIconComponent],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Request Money</h3>
          <button class="close-btn" (click)="close()">
            <app-feather-icon name="x" size="20px"></app-feather-icon>
          </button>
        </div>

        <div class="modal-body">
          <!-- Request Type Selector -->
          <div class="method-selector">
            <button 
              class="method-btn" 
              [class.active]="requestType === 'link'"
              (click)="setRequestType('link')">
              <app-feather-icon name="link" size="18px"></app-feather-icon>
              <span>Payment Link</span>
            </button>
            <button 
              class="method-btn" 
              [class.active]="requestType === 'qr'"
              (click)="setRequestType('qr')">
              <app-feather-icon name="maximize" size="18px"></app-feather-icon>
              <span>QR Code</span>
            </button>
            <button 
              class="method-btn" 
              [class.active]="requestType === 'direct'"
              (click)="setRequestType('direct')">
              <app-feather-icon name="send" size="18px"></app-feather-icon>
              <span>Send Direct</span>
            </button>
          </div>

          <!-- Generated Link Result -->
          <div class="result-box" *ngIf="generatedLink && !generatedQR">
            <div class="result-header">
              <app-feather-icon name="link" size="18px"></app-feather-icon>
              <span>Share this payment link:</span>
              <button class="close-result" (click)="clearResult()">
                <app-feather-icon name="x" size="16px"></app-feather-icon>
              </button>
            </div>
            <div class="result-content">
              <span class="link-text">{{ generatedLink }}</span>
              <div class="result-actions">
                <button class="action-btn" (click)="copyLink()">
                  <app-feather-icon name="copy" size="16px"></app-feather-icon>
                </button>
                <button class="action-btn" (click)="shareLink()">
                  <app-feather-icon name="share-2" size="16px"></app-feather-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Generated QR Result -->
          <div class="result-box qr-result" *ngIf="generatedQR">
            <div class="result-header">
              <app-feather-icon name="maximize" size="18px"></app-feather-icon>
              <span>Show this QR code:</span>
              <button class="close-result" (click)="clearResult()">
                <app-feather-icon name="x" size="16px"></app-feather-icon>
              </button>
            </div>
            <div class="qr-content">
              <img [src]="qrCodeUrl" alt="QR Code" class="qr-image">
              <span class="link-text small">{{ generatedLink }}</span>
            </div>
          </div>

          <!-- Form -->
          <form [formGroup]="requestForm" (ngSubmit)="onSubmit()" *ngIf="!generatedLink && !generatedQR">
            <!-- To Wallet -->
            <div class="form-group">
              <label>To Wallet</label>
              <select formControlName="walletId" class="form-control">
                <option value="">Select wallet</option>
                <option *ngFor="let wallet of wallets" [value]="wallet.id">
                  {{ wallet.name }} ({{ formatCurrency(wallet.balance) }})
                </option>
              </select>
            </div>

            <!-- Recipient (for direct) -->
            <div class="form-group" *ngIf="requestType === 'direct'">
              <label>Recipient</label>
              <div class="input-with-icon">
                <app-feather-icon name="user" size="16px"></app-feather-icon>
                <input 
                  type="text" 
                  formControlName="recipient" 
                  placeholder="Phone number or email"
                  class="form-control">
              </div>
              <div class="error-message" *ngIf="requestForm.get('recipient')?.touched && requestForm.get('recipient')?.errors?.['required']">
                Recipient is required
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
              <div class="error-message" *ngIf="requestForm.get('amount')?.touched && requestForm.get('amount')?.errors?.['required']">
                Amount is required for direct requests
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
                  placeholder="Add a note (optional)"
                  class="form-control">
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="close()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="isLoading">
                <span *ngIf="isLoading">Processing...</span>
                <span *ngIf="!isLoading">{{ getSubmitLabel() }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./request-money-modal.component.scss']
})
export class RequestMoneyModalComponent implements OnInit {
  @Output() modalClosed = new EventEmitter<void>();
  @Output() requestCreated = new EventEmitter<any>();

  requestForm: FormGroup;
  wallets: Wallet[] = [];
  requestType: RequestType = 'direct';
  isLoading = false;
  generatedLink: string | null = null;
  generatedQR: string | null = null;

  get qrCodeUrl(): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.generatedLink || '')}`;
  }

  constructor(
    private fb: FormBuilder,
    private walletService: WalletService
  ) {
    this.requestForm = this.fb.group({
      walletId: ['', Validators.required],
      recipient: [''],
      amount: [''],
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
        this.requestForm.patchValue({ walletId: defaultWallet.id });
      }
    });
  }

  setRequestType(type: RequestType) {
    this.requestType = type;
    this.clearResult();
  }

  clearResult() {
    this.generatedLink = null;
    this.generatedQR = null;
  }

  getSubmitLabel(): string {
    switch (this.requestType) {
      case 'link': return 'Generate Link';
      case 'qr': return 'Show QR Code';
      case 'direct': return 'Send Request';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  copyLink() {
    if (this.generatedLink) {
      navigator.clipboard.writeText(this.generatedLink);
      // Could add toast notification here
    }
  }

  shareLink() {
    if (this.generatedLink && navigator.share) {
      navigator.share({
        title: 'Payment Request',
        text: 'Please pay using this link',
        url: this.generatedLink
      });
    }
  }

  onSubmit() {
    this.isLoading = true;

    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;

      if (this.requestType === 'direct') {
        this.requestCreated.emit(this.requestForm.value);
        this.close();
      } else if (this.requestType === 'link') {
        this.generatedLink = 'https://pay.ifinance.rw/request/' + Date.now();
      } else if (this.requestType === 'qr') {
        this.generatedQR = 'QR_CODE_DATA';
        this.generatedLink = 'https://pay.ifinance.rw/request/' + Date.now();
      }
    }, 1000);
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

