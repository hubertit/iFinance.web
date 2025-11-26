import { Component, EventEmitter, Output, Input, OnInit, OnChanges } from '@angular/core';
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
    <!-- Modal -->
    <div class="modal fade" [class.show]="isVisible" [style.display]="isVisible ? 'block' : 'none'" 
         tabindex="-1" role="dialog" [attr.aria-hidden]="!isVisible">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <!-- Modal Header -->
          <div class="modal-header">
            <h5 class="modal-title">Request Money</h5>
            <button type="button" class="btn-close-custom" (click)="onClose()" aria-label="Close">
              <app-feather-icon name="x" size="18px"></app-feather-icon>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <!-- Request Type Selector -->
            <div class="method-selector mb-3">
              <button 
                type="button"
                class="method-btn" 
                [class.active]="requestType === 'link'"
                (click)="setRequestType('link')">
                <app-feather-icon name="link" size="18px"></app-feather-icon>
                <span>Payment Link</span>
              </button>
              <button 
                type="button"
                class="method-btn" 
                [class.active]="requestType === 'qr'"
                (click)="setRequestType('qr')">
                <app-feather-icon name="maximize" size="18px"></app-feather-icon>
                <span>QR Code</span>
              </button>
              <button 
                type="button"
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
                <button type="button" class="close-result" (click)="clearResult()">
                  <app-feather-icon name="x" size="16px"></app-feather-icon>
                </button>
              </div>
              <div class="result-content">
                <span class="link-text">{{ generatedLink }}</span>
                <div class="result-actions">
                  <button type="button" class="action-btn" (click)="copyLink()">
                    <app-feather-icon name="copy" size="16px"></app-feather-icon>
                  </button>
                  <button type="button" class="action-btn" (click)="shareLink()">
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
                <button type="button" class="close-result" (click)="clearResult()">
                  <app-feather-icon name="x" size="16px"></app-feather-icon>
                </button>
              </div>
              <div class="qr-content">
                <img [src]="qrCodeUrl" alt="QR Code" class="qr-image">
                <span class="link-text small">{{ generatedLink }}</span>
              </div>
            </div>

            <!-- Form -->
            <form [formGroup]="requestForm" (ngSubmit)="onSubmit()" *ngIf="!generatedLink && !generatedQR" novalidate>
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
                  [class.is-invalid]="requestForm.get('walletId')?.touched && requestForm.get('walletId')?.invalid">
                  <option value="">Select wallet</option>
                  <option *ngFor="let wallet of wallets" [value]="wallet.id">
                    {{ wallet.name }} ({{ formatCurrency(wallet.balance) }})
                  </option>
                </select>
              </div>

              <!-- Recipient (for direct) -->
              <div class="mb-3" *ngIf="requestType === 'direct'">
                <label for="recipient" class="form-label required">
                  <app-feather-icon name="user" size="16px" class="me-1"></app-feather-icon>
                  Recipient
                </label>
                <input 
                  type="text"
                  id="recipient" 
                  formControlName="recipient" 
                  placeholder="Phone number or email"
                  class="form-control"
                  [class.is-invalid]="requestForm.get('recipient')?.touched && requestForm.get('recipient')?.invalid">
                <div *ngIf="requestForm.get('recipient')?.touched && requestForm.get('recipient')?.errors?.['required']" class="invalid-feedback">
                  Recipient is required
                </div>
              </div>

              <!-- Amount -->
              <div class="mb-3">
                <label for="amount" class="form-label">
                  <app-feather-icon name="dollar-sign" size="16px" class="me-1"></app-feather-icon>
                  Amount
                </label>
                <input 
                  type="number"
                  id="amount" 
                  formControlName="amount" 
                  placeholder="Enter amount"
                  class="form-control"
                  [class.is-invalid]="requestForm.get('amount')?.touched && requestForm.get('amount')?.invalid">
                <div *ngIf="requestForm.get('amount')?.touched && requestForm.get('amount')?.errors?.['required']" class="invalid-feedback">
                  Amount is required for direct requests
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
                  placeholder="Add a note (optional)"
                  class="form-control">
              </div>
            </form>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer" *ngIf="!generatedLink && !generatedQR">
            <button type="button" class="btn btn-secondary" (click)="onClose()" [disabled]="isLoading">
              Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              (click)="onSubmit()"
              [disabled]="isLoading">
              <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
              {{ isLoading ? 'Processing...' : getSubmitLabel() }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div class="modal-backdrop fade" [class.show]="isVisible" *ngIf="isVisible" (click)="onBackdropClick()"></div>
  `,
  styleUrls: ['./request-money-modal.component.scss']
})
export class RequestMoneyModalComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() isLoading = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  requestForm: FormGroup;
  wallets: Wallet[] = [];
  requestType: RequestType = 'direct';
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

  ngOnChanges() {
    if (this.isVisible) {
      this.resetForm();
    }
  }

  private resetForm() {
    this.requestForm.reset();
    this.requestType = 'direct';
    this.clearResult();
    if (this.wallets.length > 0) {
      const defaultWallet = this.wallets.find(w => w.isDefault) || this.wallets[0];
      this.requestForm.patchValue({ walletId: defaultWallet.id });
    }
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
    if (this.requestType === 'direct') {
      this.save.emit(this.requestForm.value);
    } else if (this.requestType === 'link') {
      this.generatedLink = 'https://pay.ifinance.rw/request/' + Date.now();
    } else if (this.requestType === 'qr') {
      this.generatedQR = 'QR_CODE_DATA';
      this.generatedLink = 'https://pay.ifinance.rw/request/' + Date.now();
    }
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
