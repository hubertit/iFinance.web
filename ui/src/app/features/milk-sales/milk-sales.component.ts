import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatherIconComponent } from '../../shared/components/feather-icon/feather-icon.component';

@Component({
  selector: 'app-milk-sales',
  standalone: true,
  imports: [CommonModule, FeatherIconComponent],
  template: `
    <div class="milk-sales-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Milk Sales</h1>
          <p class="page-description">Track and manage milk sales to customers</p>
        </div>
      </div>
      
      <div class="coming-soon">
        <div class="coming-soon-content">
          <app-feather-icon name="shopping-cart" size="64px" class="coming-soon-icon"></app-feather-icon>
          <h2>Milk Sales</h2>
          <p>This feature is coming soon. You'll be able to track and manage milk sales to your customers.</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./milk-sales.component.scss']
})
export class MilkSalesComponent {}
