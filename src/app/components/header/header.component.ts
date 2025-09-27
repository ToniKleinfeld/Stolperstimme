import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">
          <span class="title-icon" aria-hidden="true">🗣️</span>
          Stolperstimme
        </h1>
        <p class="app-subtitle">
          Digitale Erinnerungen an Stolpersteine
        </p>
      </div>
    </header>
  `,
  styleUrl: './header.component.scss'
})
export class HeaderComponent {}
