import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-base-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="base-form">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">{{ title }}</h5>
          <ng-content select="[header-actions]"></ng-content>
        </div>
        
        <div class="card-body">
          <ng-content></ng-content>
        </div>

        <div class="card-footer bg-white d-flex justify-content-end gap-2">
          <button 
            *ngIf="showCancel" 
            type="button" 
            class="btn btn-danger-outline" 
            (click)="cancel()">
            {{ cancelText }}
          </button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            [disabled]="form.invalid || isSubmitting">
            <span 
              *ngIf="isSubmitting" 
              class="spinner-border spinner-border-sm me-2" 
              role="status">
            </span>
            {{ submitText }}
          </button>
        </div>
      </div>
    </form>
  `,
  styles: [`
    .base-form {
      width: 100%;
    }

    .gap-2 {
      gap: 0.5rem;
    }

    .btn-danger-outline {
      background: transparent;
      color: #dc3545;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: #dc3545;
        color: white;
      }

      &:active:not(:disabled) {
        transform: none;
      }

      &:focus {
        outline: none;
      }
    }
  `]
})
export class BaseFormComponent {
  @Input() form!: FormGroup;
  @Input() title = 'Form';
  @Input() submitText = 'Submit';
  @Input() cancelText = 'Cancel';
  @Input() showCancel = true;
  @Input() isSubmitting = false;

  @Output() onCancel = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<void>();

  submit(): void {
    if (this.form.valid) {
      this.onSubmit.emit();
    }
  }

  cancel(): void {
    this.onCancel.emit();
  }
}
