import { Component, EventEmitter, Output, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherIconComponent } from '../feather-icon/feather-icon.component';
import { WalletService, Wallet } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-withdraw-modal',
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
            <h5 class="modal-title">Withdraw</h5>
            <button type="button" class="btn-close-custom" (click)="onClose()" aria-label="Close">
              <app-feather-icon name="x" size="18px"></app-feather-icon>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <form [formGroup]="withdrawForm" (ngSubmit)="onSubmit()" novalidate>
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
                  [class.is-invalid]="withdrawForm.get('walletId')?.touched && withdrawForm.get('walletId')?.invalid">
                  <option value="">Select wallet</option>
                  <option *ngFor="let wallet of wallets" [value]="wallet.id">
                    {{ wallet.name }} ({{ formatCurrency(wallet.balance) }})
                  </option>
                </select>
                <div *ngIf="withdrawForm.get('walletId')?.touched && withdrawForm.get('walletId')?.errors?.['required']" class="invalid-feedback">
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
                  [class.is-invalid]="withdrawForm.get('amount')?.touched && withdrawForm.get('amount')?.invalid">
                <div *ngIf="withdrawForm.get('amount')?.touched && withdrawForm.get('amount')?.errors?.['required']" class="invalid-feedback">
                  Amount is required
                </div>
                <div *ngIf="withdrawForm.get('amount')?.touched && withdrawForm.get('amount')?.errors?.['min']" class="invalid-feedback">
                  Amount must be greater than 0
                </div>
              </div>

              <!-- Destination Type -->
              <div class="mb-3">
                <label for="destinationType" class="form-label">
                  <app-feather-icon name="navigation" size="16px" class="me-1"></app-feather-icon>
                  Destination
                </label>
                <select 
                  id="destinationType"
                  formControlName="destinationType" 
                  class="form-select" 
                  (change)="onDestinationChange()">
                  <option value="bank">Bank Account</option>
                  <option value="momo">Mobile Money</option>
                </select>
              </div>

              <!-- Bank Fields -->
              <ng-container *ngIf="withdrawForm.get('destinationType')?.value === 'bank'">
                <div class="mb-3">
                  <label for="bankName" class="form-label required">
                    <app-feather-icon name="home" size="16px" class="me-1"></app-feather-icon>
                    Bank Name
                  </label>
                  <select 
                    id="bankName"
                    formControlName="bankName" 
                    class="form-select"
                    [class.is-invalid]="withdrawForm.get('bankName')?.touched && withdrawForm.get('bankName')?.invalid">
                    <option value="">Select bank</option>
                    <option *ngFor="let bank of banks" [value]="bank">{{ bank }}</option>
                  </select>
                  <div *ngIf="withdrawForm.get('bankName')?.touched && withdrawForm.get('bankName')?.errors?.['required']" class="invalid-feedback">
                    Please select a bank
                  </div>
                </div>

                <div class="mb-3">
                  <label for="accountNumber" class="form-label required">
                    <app-feather-icon name="hash" size="16px" class="me-1"></app-feather-icon>
                    Account Number
                  </label>
                  <input 
                    type="text"
                    id="accountNumber" 
                    formControlName="accountNumber" 
                    placeholder="Enter bank account number"
                    class="form-control"
                    [class.is-invalid]="withdrawForm.get('accountNumber')?.touched && withdrawForm.get('accountNumber')?.invalid">
                  <div *ngIf="withdrawForm.get('accountNumber')?.touched && withdrawForm.get('accountNumber')?.errors?.['required']" class="invalid-feedback">
                    Account number is required
                  </div>
                </div>
              </ng-container>

              <!-- Mobile Money Fields -->
              <ng-container *ngIf="withdrawForm.get('destinationType')?.value === 'momo'">
                <div class="mb-3">
                  <label for="momoProvider" class="form-label">
                    <app-feather-icon name="smartphone" size="16px" class="me-1"></app-feather-icon>
                    Provider
                  </label>
                  <select id="momoProvider" formControlName="momoProvider" class="form-select">
                    <option value="MTN">MTN Mobile Money</option>
                    <option value="Airtel">Airtel Money</option>
                  </select>
                </div>

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
                    [class.is-invalid]="withdrawForm.get('phoneNumber')?.touched && withdrawForm.get('phoneNumber')?.invalid">
                  <div *ngIf="withdrawForm.get('phoneNumber')?.touched && withdrawForm.get('phoneNumber')?.errors?.['required']" class="invalid-feedback">
                    Phone number is required
                  </div>
                </div>
              </ng-container>
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
              [disabled]="isLoading || withdrawForm.invalid">
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
  styleUrls: ['./withdraw-modal.component.scss']
})
export class WithdrawModalComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() isLoading = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  withdrawForm: FormGroup;
  wallets: Wallet[] = [];

  banks = [
    'Bank of Kigali',
    'Equity Bank',
    'I&M Bank',
    'Cogebanque',
    'Access Bank'
  ];

  constructor(
    private fb: FormBuilder,
    private walletService: WalletService
  ) {
    this.withdrawForm = this.fb.group({
      walletId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      destinationType: ['bank'],
      bankName: [''],
      accountNumber: [''],
      momoProvider: ['MTN'],
      phoneNumber: ['']
    });
  }

  ngOnInit() {
    this.loadWallets();
    this.onDestinationChange();
  }

  ngOnChanges() {
    if (this.isVisible) {
      this.resetForm();
    }
  }

  private resetForm() {
    this.withdrawForm.reset({
      destinationType: 'bank',
      momoProvider: 'MTN'
    });
    this.onDestinationChange();
    if (this.wallets.length > 0) {
      const defaultWallet = this.wallets.find(w => w.isDefault) || this.wallets[0];
      this.withdrawForm.patchValue({ walletId: defaultWallet.id });
    }
  }

  loadWallets() {
    this.walletService.wallets$.subscribe(wallets => {
      this.wallets = wallets;
      if (wallets.length > 0) {
        const defaultWallet = wallets.find(w => w.isDefault) || wallets[0];
        this.withdrawForm.patchValue({ walletId: defaultWallet.id });
      }
    });
  }

  onDestinationChange() {
    const destType = this.withdrawForm.get('destinationType')?.value;
    
    if (destType === 'bank') {
      this.withdrawForm.get('bankName')?.setValidators([Validators.required]);
      this.withdrawForm.get('accountNumber')?.setValidators([Validators.required]);
      this.withdrawForm.get('phoneNumber')?.clearValidators();
    } else {
      this.withdrawForm.get('bankName')?.clearValidators();
      this.withdrawForm.get('accountNumber')?.clearValidators();
      this.withdrawForm.get('phoneNumber')?.setValidators([Validators.required]);
    }

    this.withdrawForm.get('bankName')?.updateValueAndValidity();
    this.withdrawForm.get('accountNumber')?.updateValueAndValidity();
    this.withdrawForm.get('phoneNumber')?.updateValueAndValidity();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  onSubmit() {
    if (this.withdrawForm.invalid) return;
    this.save.emit(this.withdrawForm.value);
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
