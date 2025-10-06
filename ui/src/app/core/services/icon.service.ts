import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class IconService {
  private iconCache = new Map<string, SafeHtml>();

  constructor(private sanitizer: DomSanitizer) {}

  async loadIcon(name: string): Promise<SafeHtml> {
    if (this.iconCache.has(name)) {
      return this.iconCache.get(name)!;
    }

    try {
      const response = await fetch(`/assets/icons/feather/${name}.svg`);
      const svgText = await response.text();
      
      // Create a temporary div to parse the SVG
      const div = document.createElement('div');
      div.innerHTML = svgText;
      const svg = div.querySelector('svg');
      
      if (svg) {
        // Add necessary attributes for proper rendering
        svg.setAttribute('fill', 'currentColor');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        
        const sanitizedSvg = this.sanitizer.bypassSecurityTrustHtml(svg.outerHTML);
        this.iconCache.set(name, sanitizedSvg);
        return sanitizedSvg;
      }
      
      throw new Error('Invalid SVG content');
    } catch (error) {
      console.error(`Error loading icon: ${name}`, error);
      return this.sanitizer.bypassSecurityTrustHtml('');
    }
  }
}
