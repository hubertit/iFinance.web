import { Component, Input, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalogClockComponent } from '../analog-clock/analog-clock.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AnalogClockComponent],
  template: `
    <div class="auth-page">
      <!-- Left side - Auth Form -->
      <div class="auth-section">
        <div class="auth-container">
          <div class="logo-container">
            <img src="assets/img/logo.png" alt="iFinance Logo" class="logo">
          </div>
          <h1>{{ title }}</h1>
          
          <div class="auth-links" *ngIf="showAuthLinks">
            <span>{{ authLinkText }}</span>
            <a [routerLink]="authLinkRoute">{{ authLinkLabel }}</a>
          </div>

          <!-- Content projection for form -->
          <ng-container [ngTemplateOutlet]="formTemplate"></ng-container>

          <div class="footer-text">
            <p>© {{ currentYear }} iFinance</p>
            <p>A comprehensive dairy farming management system</p>
            <p>Developed for Rwandan Dairy Farmers</p>
          </div>
        </div>
      </div>

      <!-- Right side - Background with Clock -->
      <div class="background-section">
        <app-analog-clock></app-analog-clock>
      </div>
    </div>
  `,
  styleUrls: ['./auth-layout.component.scss']
})
export class AuthLayoutComponent {
  @Input() title: string = '';
  @Input() showAuthLinks: boolean = true;
  @Input() authLinkText: string = '';
  @Input() authLinkLabel: string = '';
  @Input() authLinkRoute: string = '';
  
  @ContentChild('formTemplate') formTemplate!: TemplateRef<any>;
  
  currentYear = new Date().getFullYear();
}
