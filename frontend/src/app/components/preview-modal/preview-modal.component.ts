import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Document } from '../../services/document.service';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-preview-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" (click)="close.emit()">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 class="text-xl font-bold text-gray-800 truncate">{{ document?.title }}</h2>
          <div class="flex items-center gap-4">
             <button (click)="download()" class="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Download
             </button>
             <button (click)="close.emit()" class="text-gray-500 hover:text-gray-700 transition">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
             </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 bg-gray-100 flex items-center justify-center relative">
          <div *ngIf="loading" class="absolute inset-0 flex items-center justify-center bg-white z-10">
             <div class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          </div>

          <iframe 
            *ngIf="fileUrl" 
            [src]="fileUrl" 
            class="w-full h-full border-0"
            (load)="onIframeLoad()">
          </iframe>
          
          <div *ngIf="error" class="text-red-500 px-4 text-center">
            {{ error }}
          </div>
        </div>
      </div>
    </div>
  `
})
export class PreviewModalComponent implements OnChanges {
    @Input() document: Document | null = null;
    @Output() close = new EventEmitter<void>();

    fileUrl: SafeResourceUrl | null = null;
    loading = false;
    error = '';

    constructor(
        private http: HttpClient,
        private sanitizer: DomSanitizer,
        private authService: AuthService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['document'] && this.document) {
            this.loadFile();
        }
    }

    loadFile() {
        if (!this.document) return;

        this.loading = true;
        this.error = '';
        this.fileUrl = null;

        const token = this.authService.getToken();
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        const url = `${environment.apiUrl}/documents/${this.document._id}/download?inline=true`;

        this.http.get(url, { headers, responseType: 'blob' }).subscribe({
            next: (blob) => {
                const objectUrl = URL.createObjectURL(blob);
                this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);

            },
            error: (err) => {
                console.error('Error loading preview:', err);
                this.error = 'Failed to load document preview.';
                this.loading = false;
            }
        });
    }

    onIframeLoad() {
        this.loading = false;
    }

    download() {
        if (!this.document) return;
        const token = this.authService.getToken();
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        const downloadUrl = `${environment.apiUrl}/documents/${this.document._id}/download`;

        this.http.get(downloadUrl, { headers, responseType: 'blob' }).subscribe({
            next: (blob) => {
                const a = window.document.createElement('a');
                const objectUrl = URL.createObjectURL(blob);
                a.href = objectUrl;
                a.download = this.document?.title || 'document';
                a.click();
                URL.revokeObjectURL(objectUrl);
            }
        });
    }
}
