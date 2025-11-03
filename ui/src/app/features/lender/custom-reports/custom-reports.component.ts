import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';

@Component({
  selector: 'app-custom-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, FeatherIconComponent],
  template: `
    <div class="custom-reports">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Custom Reports</h1>
          <p class="page-description">Build custom reports with your own parameters</p>
        </div>
      </div>

      <div class="report-builder">
        <!-- Builder Form -->
        <div class="builder-section">
          <div class="section-header">
            <h3>Report Builder</h3>
            <p class="section-description">Configure your custom report</p>
          </div>

          <form [formGroup]="reportForm" class="builder-form">
            <div class="form-group">
              <label for="reportName">Report Name <span class="required">*</span></label>
              <input 
                type="text" 
                id="reportName" 
                formControlName="name"
                placeholder="Enter report name"
              />
            </div>

            <div class="form-group">
              <label for="reportDescription">Description</label>
              <textarea 
                id="reportDescription" 
                formControlName="description"
                rows="3"
                placeholder="Enter report description..."
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="reportFormat">Format <span class="required">*</span></label>
                <select id="reportFormat" formControlName="format">
                  <option value="">Select format</option>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              <div class="form-group">
                <label for="dateRange">Date Range</label>
                <select id="dateRange" formControlName="dateRange">
                  <option value="custom">Custom Range</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>

            <div class="form-row" *ngIf="reportForm.get('dateRange')?.value === 'custom'">
              <div class="form-group">
                <label for="dateFrom">From Date</label>
                <input 
                  type="date" 
                  id="dateFrom" 
                  formControlName="dateFrom"
                />
              </div>

              <div class="form-group">
                <label for="dateTo">To Date</label>
                <input 
                  type="date" 
                  id="dateTo" 
                  formControlName="dateTo"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Data Sections</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="includeLoans" />
                  Loan Data
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="includeBorrowers" />
                  Borrower Information
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="includePayments" />
                  Payment History
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="includeFinancials" />
                  Financial Summary
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="includeAnalytics" />
                  Analytics & Metrics
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>Filters</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="filterByStatus" />
                  Filter by Loan Status
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="filterByProduct" />
                  Filter by Loan Product
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="filterByRisk" />
                  Filter by Risk Level
                </label>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="resetForm()">Reset</button>
              <button type="button" class="btn-secondary" (click)="previewReport()">
                <app-feather-icon name="eye" size="16px"></app-feather-icon>
                Preview
              </button>
              <button type="submit" class="btn-primary" [disabled]="reportForm.invalid" (click)="generateReport()">
                <app-feather-icon name="file-text" size="16px"></app-feather-icon>
                Generate Report
              </button>
            </div>
          </form>
        </div>

        <!-- Saved Templates -->
        <div class="templates-section">
          <div class="section-header">
            <h3>Saved Templates</h3>
          </div>

          <div class="templates-list">
            <div class="template-item" *ngFor="let template of savedTemplates" (click)="loadTemplate(template)">
              <div class="template-icon">
                <app-feather-icon name="file-text" size="20px"></app-feather-icon>
              </div>
              <div class="template-content">
                <h4>{{ template.name }}</h4>
                <p>{{ template.description || 'No description' }}</p>
                <div class="template-meta">
                  <span>{{ template.format.toUpperCase() }}</span>
                  <span>•</span>
                  <span>{{ formatDate(template.createdAt) }}</span>
                </div>
              </div>
              <div class="template-actions">
                <button class="btn-icon" (click)="deleteTemplate(template, $event)">
                  <app-feather-icon name="trash-2" size="16px"></app-feather-icon>
                </button>
              </div>
            </div>

            <div class="empty-templates" *ngIf="savedTemplates.length === 0">
              <app-feather-icon name="file-text" size="32px"></app-feather-icon>
              <p>No saved templates</p>
              <p class="hint">Create and save report templates for quick access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./custom-reports.component.scss']
})
export class CustomReportsComponent implements OnInit {
  reportForm: FormGroup;
  savedTemplates: Array<{
    id: string;
    name: string;
    description: string;
    format: string;
    createdAt: Date;
    config: any;
  }> = [];

  constructor(private fb: FormBuilder) {
    this.reportForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      format: ['', [Validators.required]],
      dateRange: ['month'],
      dateFrom: [''],
      dateTo: [''],
      includeLoans: [true],
      includeBorrowers: [false],
      includePayments: [false],
      includeFinancials: [false],
      includeAnalytics: [false],
      filterByStatus: [false],
      filterByProduct: [false],
      filterByRisk: [false]
    });
  }

  ngOnInit() {
    this.loadSavedTemplates();
  }

  generateReport() {
    if (this.reportForm.valid) {
      const formValue = this.reportForm.value;
      console.log('Generate custom report:', formValue);
      alert(`Generating ${formValue.name}...\nThis will download a ${formValue.format.toUpperCase()} file.`);
    }
  }

  previewReport() {
    if (this.reportForm.valid) {
      const formValue = this.reportForm.value;
      console.log('Preview report:', formValue);
      alert(`Preview for ${formValue.name}...\nThis feature will show a preview of the report.`);
    }
  }

  resetForm() {
    this.reportForm.reset();
    this.reportForm.patchValue({
      dateRange: 'month',
      includeLoans: true
    });
  }

  saveTemplate() {
    if (this.reportForm.valid) {
      const formValue = this.reportForm.value;
      const newTemplate = {
        id: `TEMPLATE-${Date.now()}`,
        name: formValue.name,
        description: formValue.description,
        format: formValue.format,
        createdAt: new Date(),
        config: formValue
      };
      this.savedTemplates.unshift(newTemplate);
      alert('Template saved successfully!');
    }
  }

  loadTemplate(template: any) {
    this.reportForm.patchValue(template.config);
  }

  deleteTemplate(template: any, event: Event) {
    event.stopPropagation();
    if (confirm(`Delete template ${template.name}?`)) {
      this.savedTemplates = this.savedTemplates.filter(t => t.id !== template.id);
    }
  }

  loadSavedTemplates() {
    // Mock saved templates
    this.savedTemplates = [
      {
        id: 'TEMPLATE-001',
        name: 'Monthly Loan Summary',
        description: 'Monthly loan portfolio summary',
        format: 'pdf',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        config: {
          name: 'Monthly Loan Summary',
          description: 'Monthly loan portfolio summary',
          format: 'pdf',
          dateRange: 'month',
          includeLoans: true,
          includeBorrowers: false,
          includePayments: false,
          includeFinancials: true,
          includeAnalytics: true
        }
      }
    ];
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }
}

