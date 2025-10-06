import { Component, Input, OnInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconService } from '../../../core/services/icon.service';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-feather-icon',
  standalone: true,
  imports: [CommonModule],
  template: `<span [innerHTML]="iconHtml"></span>`,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1em;
      height: 1em;
      font-size: inherit;
      color: inherit;
      vertical-align: middle;
    }
    
    span {
      display: inline-flex;
      width: 100%;
      height: 100%;
    }

    :host ::ng-deep svg {
      width: 100%;
      height: 100%;
    }
  `]
})
export class FeatherIconComponent implements OnInit {
  @Input() name!: string;
  @Input() size?: string;

  iconHtml: SafeHtml = '';

  constructor(
    private elementRef: ElementRef,
    private iconService: IconService
  ) {}

  async ngOnInit() {
    if (this.size) {
      const element = this.elementRef.nativeElement;
      element.style.fontSize = this.size;
    }

    this.iconHtml = await this.iconService.loadIcon(this.name);
  }
}