import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherIconComponent } from '../feather-icon/feather-icon.component';
import { WalletService, Wallet } from '../../../core/services/wallet.service';

type WithdrawDestination = 'bank' | 'momo';

@Component({
  selector: 'app-withdraw-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FeatherIconComponent],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Withdraw</h3>
          <button class="close-btn" (click)="close()">
            <app-feather-icon name="x" size="20px"></app-feather-icon>
          </button>
        </div>

        <div class="modal-body">
          <form [formGroup]="withdrawForm" (ngSubmit)="onSubmit()">
            <!-- From Wallet -->
            <div class="form-group">
              <label>From Wallet</label>
              <select formControlName="walletId" class="form-control">
                <option value="">Select wallet</option>
                <option *ngFor="let wallet of wallets" [value]="wallet.id">
                  {{ wallet.name }} ({{ formatCurrency(wallet.balance) }})
                </option>
              </select>
              <div class="error-message" *ngIf="withdrawForm.get('walletId')?.touched && withdrawForm.get('walletId')?.errors?.['required']">
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
              <div class="error-message" *ngIf="withdrawForm.get('amount')?.touched && withdrawForm.get('amount')?.errors?.['required']">
                Amount is required
              </div>
              <div class="error-message" *ngIf="withdrawForm.get('amount')?.touched && withdrawForm.get('amount')?.errors?.['min']">
                Amount must be greater than 0
              </div>
            </div>

            <!-- Destination Type -->
            <div class="form-group">
              <label>Destination</label>
              <select formControlName="destinationType" class="form-control" (change)="onDestinationChange()">
                <option value="bank">Bank Account</option>
                <option value="momo">Mobile Money</option>
              </select>
            </div>

            <!-- Bank Fields -->
            <ng-container *ngIf="withdrawForm.get('destinationType')?.value === 'bank'">
              <div class="form-group">
                <label>Bank Name</label>
                <select formControlName="bankName" class="form-control">
                  <option value="">Select bank</option>
                  <option *ngFor="let bank of banks" [value]="bank">{{ bank }}</option>
                </select>
                <div class="error-message" *ngIf="withdrawForm.get('bankName')?.touched && withdrawForm.get('bankName')?.errors?.['required']">
                  Please select a bank
                </div>
              </div>

              <div class="form-group">
                <label>Account Number</label>
                <div class="input-with-icon">
                  <app-feather-icon name="hash" size="16px"></app-feather-icon>
                  <input 
                    type="text" 
                    formControlName="accountNumber" 
                    placeholder="Enter bank account number"
                    class="form-control">
                </div>
                <div class="error-message" *ngIf="withdrawForm.get('accountNumber')?.touched && withdrawForm.get('accountNumber')?.errors?.['required']">
                  Account number is required
                </div>
              </div>
            </ng-container>

            <!-- Mobile Money Fields -->
            <ng-container *ngIf="withdrawForm.get('destinationType')?.value === 'momo'">
              <div class="form-group">
                <label>Provider</label>
                <select formControlName="momoProvider" class="form-control">
                  <option value="MTN">MTN Mobile Money</option>
                  <option value="Airtel">Airtel Money</option>
                </select>
              </div>

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
                <div class="error-message" *ngIf="withdrawForm.get('phoneNumber')?.touched && withdrawForm.get('phoneNumber')?.errors?.['required']">
                  Phone number is required
                </div>
              </div>
            </ng-container>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="close()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="isLoading || withdrawForm.invalid">
                <span *ngIf="isLoading">Processing...</span>
                <span *ngIf="!isLoading">Submit</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./withdraw-modal.component.scss']
})
export class WithdrawModalComponent implements OnInit {
  @Output() modalClosed = new EventEmitter<void>();
  @Output() withdrawCompleted = new EventEmitter<any>();

  withdrawForm: FormGroup;
  wallets: Wallet[] = [];
  isLoading = false;

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

    this.isLoading = true;

    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.withdrawCompleted.emit(this.withdrawForm.value);
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

