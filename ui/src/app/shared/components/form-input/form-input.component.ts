import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-form-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <div class="input-wrapper">
        <i [class]="iconClass" *ngIf="iconClass"></i>
        
        <!-- Input field -->
        <input 
          *ngIf="type !== 'select'"
          [type]="inputType" 
          [placeholder]="placeholder"
          [value]="value"
          [disabled]="disabled"
          [class.is-invalid]="isInvalid"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (focus)="onFocus()">
          
        <!-- Select field -->
        <select 
          *ngIf="type === 'select'"
          [value]="value"
          [disabled]="disabled"
          [class.is-invalid]="isInvalid"
          (change)="onSelectChange($event)"
          (blur)="onBlur()"
          (focus)="onFocus()">
          <option value="">{{ placeholder }}</option>
          <option *ngFor="let option of options" [value]="option.value">
            {{ option.label }}
          </option>
        </select>
        
        <button 
          type="button" 
          class="password-toggle" 
          *ngIf="showPasswordToggle && type !== 'select'"
          (click)="togglePassword()">
          <i class="fas" [class.fa-eye]="!showPassword" [class.fa-eye-slash]="showPassword"></i>
        </button>
      </div>
      <div class="invalid-feedback" *ngIf="isInvalid && errorMessage">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styleUrls: ['./form-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormInputComponent),
      multi: true
    }
  ]
})
export class FormInputComponent implements ControlValueAccessor {
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() iconClass: string = '';
  @Input() errorMessage: string = '';
  @Input() isInvalid: boolean = false;
  @Input() disabled: boolean = false;
  @Input() showPasswordToggle: boolean = false;
  @Input() options: {value: string, label: string}[] = [];

  @Output() inputChange = new EventEmitter<string>();
  @Output() focusEvent = new EventEmitter<void>();
  @Output() blurEvent = new EventEmitter<void>();

  value: string = '';
  showPassword: boolean = false;
  inputType: string = this.type;

  private onChange = (value: string) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.inputType = this.type;
  }

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.inputChange.emit(this.value);
  }

  onSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.onChange(this.value);
    this.inputChange.emit(this.value);
  }

  onFocus() {
    this.focusEvent.emit();
  }

  onBlur() {
    this.onTouched();
    this.blurEvent.emit();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.inputType = this.showPassword ? 'text' : 'password';
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
