import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherIconComponent } from '../feather-icon/feather-icon.component';
import { WalletService, Wallet } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-view-statements-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FeatherIconComponent],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-container">
        <div class="modal-header">
          <h3>View Statements</h3>
          <button class="close-btn" (click)="close()">
            <app-feather-icon name="x" size="20px"></app-feather-icon>
          </button>
        </div>

        <div class="modal-body">
          <form [formGroup]="statementForm" (ngSubmit)="onSubmit()">
            <!-- Wallet Selection -->
            <div class="form-group">
              <label>Select Wallet</label>
              <select formControlName="walletId" class="form-control">
                <option value="">All Wallets</option>
                <option *ngFor="let wallet of wallets" [value]="wallet.id">
                  {{ wallet.name }}
                </option>
              </select>
            </div>

            <!-- Date Range -->
            <div class="form-group">
              <label>Period</label>
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
              <div class="form-group">
                <label>From Date</label>
                <input 
                  type="date" 
                  formControlName="fromDate" 
                  class="form-control date-input">
              </div>
              <div class="form-group">
                <label>To Date</label>
                <input 
                  type="date" 
                  formControlName="toDate" 
                  class="form-control date-input">
              </div>
            </div>

            <!-- Format Selection -->
            <div class="form-group">
              <label>Export Format</label>
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

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="close()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="isLoading">
                <app-feather-icon name="download" size="16px" *ngIf="!isLoading"></app-feather-icon>
                <span *ngIf="isLoading">Generating...</span>
                <span *ngIf="!isLoading">Download Statement</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./view-statements-modal.component.scss']
})
export class ViewStatementsModalComponent implements OnInit {
  @Output() modalClosed = new EventEmitter<void>();
  @Output() statementGenerated = new EventEmitter<any>();

  statementForm: FormGroup;
  wallets: Wallet[] = [];
  isLoading = false;
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

  loadWallets() {
    this.walletService.wallets$.subscribe(wallets => {
      this.wallets = wallets;
    });
  }

  setDefaultDates() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    this.statementForm.patchValue({
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
    this.isLoading = true;

    // Simulate API call / file generation
    setTimeout(() => {
      this.isLoading = false;
      this.statementGenerated.emit({
        ...this.statementForm.value,
        format: this.selectedFormat,
        period: this.selectedPeriod
      });
      // In real implementation, this would trigger a file download
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

