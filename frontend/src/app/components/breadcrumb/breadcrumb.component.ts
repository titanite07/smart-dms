import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
export interface BreadcrumbItem {
  label: string;
  folderId: string | null;
}
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="flex items-center space-x-2 text-sm mb-4 px-1">
      <button 
        *ngFor="let item of breadcrumbs; let last = last"
        (click)="navigate(item.folderId)"
        [class.text-gray-400]="!last"
        [class.hover:text-gray-200]="!last"
        [class.text-white]="last"
        [class.font-semibold]="last"
        class="flex items-center gap-2 transition-colors">
        <svg *ngIf="item.folderId === null" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
        </svg>
        {{ item.label }}
        <svg *ngIf="!last" class="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button>
    </nav>
  `
})
export class BreadcrumbComponent {
  @Input() breadcrumbs: BreadcrumbItem[] = [];
  @Output() navigate = new EventEmitter<string | null>();
}
