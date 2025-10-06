import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatherIconComponent } from '../../shared/components/feather-icon/feather-icon.component';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [CommonModule, FeatherIconComponent],
  template: `
    <div class="collections-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Collections</h1>
          <p class="page-description">Manage milk collections from suppliers</p>
        </div>
      </div>
      
      <div class="coming-soon">
        <div class="coming-soon-content">
          <app-feather-icon name="package" size="64px" class="coming-soon-icon"></app-feather-icon>
          <h2>Collections</h2>
          <p>This feature is coming soon. You'll be able to manage milk collections from your suppliers.</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./collections.component.scss']
})
export class CollectionsComponent {}
