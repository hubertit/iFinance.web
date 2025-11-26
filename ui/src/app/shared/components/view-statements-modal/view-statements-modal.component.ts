import { Component, EventEmitter, Output, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FeatherIconComponent } from '../feather-icon/feather-icon.component';
import { WalletService, Wallet } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-view-statements-modal',
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
            <h5 class="modal-title">View Statements</h5>
            <button type="button" class="btn-close-custom" (click)="onClose()" aria-label="Close">
              <app-feather-icon name="x" size="18px"></app-feather-icon>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <form [formGroup]="statementForm" (ngSubmit)="onSubmit()" novalidate>
              <!-- Wallet Selection -->
              <div class="mb-3">
                <label for="walletId" class="form-label">
                  <app-feather-icon name="credit-card" size="16px" class="me-1"></app-feather-icon>
                  Select Wallet
                </label>
                <select id="walletId" formControlName="walletId" class="form-select">
                  <option value="">All Wallets</option>
                  <option *ngFor="let wallet of wallets" [value]="wallet.id">
                    {{ wallet.name }}
                  </option>
                </select>
              </div>

              <!-- Date Range -->
              <div class="mb-3">
                <label class="form-label">
                  <app-feather-icon name="calendar" size="16px" class="me-1"></app-feather-icon>
                  Period
                </label>
                <div class="period-options">
                  <button 
                    type="button" 
                    class="period-btn" 
                    [class.active]="selectedPeriod === '7d'"
                    (click)="selectPeriod('7d')">
                    Last 7 Days
                  </button>
                  <button 
                    type="button" 
                    class="period-btn" 
                    [class.active]="selectedPeriod === '30d'"
                    (click)="selectPeriod('30d')">
                    Last 30 Days
                  </button>
                  <button 
                    type="button" 
                    class="period-btn" 
                    [class.active]="selectedPeriod === '90d'"
                    (click)="selectPeriod('90d')">
                    Last 90 Days
                  </button>
                  <button 
                    type="button" 
                    class="period-btn" 
                    [class.active]="selectedPeriod === 'custom'"
                    (click)="selectPeriod('custom')">
                    Custom
                  </button>
                </div>
              </div>

              <!-- Custom Date Range -->
              <div class="date-range" *ngIf="selectedPeriod === 'custom'">
                <div class="mb-3">
                  <label for="fromDate" class="form-label">From Date</label>
                  <input 
                    type="date"
                    id="fromDate" 
                    formControlName="fromDate" 
                    class="form-control">
                </div>
                <div class="mb-3">
                  <label for="toDate" class="form-label">To Date</label>
                  <input 
                    type="date"
                    id="toDate" 
                    formControlName="toDate" 
                    class="form-control">
                </div>
              </div>

              <!-- Format Selection -->
              <div class="mb-3">
                <label class="form-label">
                  <app-feather-icon name="file" size="16px" class="me-1"></app-feather-icon>
                  Export Format
                </label>
                <div class="format-options">
                  <button 
                    type="button" 
                    class="format-btn" 
                    [class.active]="selectedFormat === 'pdf'"
                    (click)="selectedFormat = 'pdf'">
                    <app-feather-icon name="file-text" size="20px"></app-feather-icon>
                    <span>PDF</span>
                  </button>
                  <button 
                    type="button" 
                    class="format-btn" 
                    [class.active]="selectedFormat === 'excel'"
                    (click)="selectedFormat = 'excel'">
                    <app-feather-icon name="grid" size="20px"></app-feather-icon>
                    <span>Excel</span>
                  </button>
                  <button 
                    type="button" 
                    class="format-btn" 
                    [class.active]="selectedFormat === 'csv'"
                    (click)="selectedFormat = 'csv'">
                    <app-feather-icon name="file" size="20px"></app-feather-icon>
                    <span>CSV</span>
                  </button>
                </div>
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
              [disabled]="isLoading">
              <app-feather-icon name="download" size="16px" *ngIf="!isLoading" class="me-1"></app-feather-icon>
              <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
              {{ isLoading ? 'Generating...' : 'Download Statement' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div class="modal-backdrop fade" [class.show]="isVisible" *ngIf="isVisible" (click)="onBackdropClick()"></div>
  `,
  styleUrls: ['./view-statements-modal.component.scss']
})
export class ViewStatementsModalComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() isLoading = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  statementForm: FormGroup;
  wallets: Wallet[] = [];
  selectedPeriod = '30d';
  selectedFormat = 'pdf';

  constructor(
    private fb: FormBuilder,
    private walletService: WalletService
  ) {
    this.statementForm = this.fb.group({
      walletId: [''],
      fromDate: [''],
      toDate: ['']
    });
  }

  ngOnInit() {
    this.loadWallets();
    this.setDefaultDates();
  }

  ngOnChanges() {
    if (this.isVisible) {
      this.resetForm();
    }
  }

  private resetForm() {
    this.selectedPeriod = '30d';
    this.selectedFormat = 'pdf';
    this.setDefaultDates();
  }

  loadWallets() {
    this.walletService.wallets$.subscribe(wallets => {
      this.wallets = wallets;
    });
  }

  setDefaultDates() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    this.statementForm.patchValue({
      walletId: '',
      fromDate: thirtyDaysAgo.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0]
    });
  }

  selectPeriod(period: string) {
    this.selectedPeriod = period;
    const today = new Date();
    let fromDate: Date;

    switch (period) {
      case '7d':
        fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        fromDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        return;
    }

    this.statementForm.patchValue({
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0]
    });
  }

  onSubmit() {
    this.save.emit({
      ...this.statementForm.value,
      format: this.selectedFormat,
      period: this.selectedPeriod
    });
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
