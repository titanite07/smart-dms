import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-public-view',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './public-view.component.html'
})
export class PublicViewComponent implements OnInit {
    document: any = null;
    loading = true;
    error = '';
    token = '';

    constructor(
        private route: ActivatedRoute,
        private http: HttpClient
    ) { }

    ngOnInit(): void {
        this.token = this.route.snapshot.paramMap.get('token') || '';
        if (this.token) {
            this.loadDocument();
        } else {
            this.error = 'Invalid link';
            this.loading = false;
        }
    }

    loadDocument(): void {
        this.http.get(`${environment.apiUrl}/documents/public/${this.token}`).subscribe({
            next: (doc: any) => {
                this.document = doc;
                this.loading = false;
            },
            error: (err) => {
                this.error = err.error?.message || 'Document not found or link expired';
                this.loading = false;
            }
        });
    }

    downloadDocument(): void {
        window.open(`${environment.apiUrl}/documents/public/${this.token}/download`, '_blank');
    }

    viewDocument(): void {
        window.open(`${environment.apiUrl}/documents/public/${this.token}/download?inline=true`, '_blank');
    }

    getFileIcon(): string {
        if (!this.document?.currentPath) return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';

        const ext = this.document.currentPath.split('.').pop()?.toLowerCase();
        if (['pdf'].includes(ext)) return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
        if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z';
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    }

    formatFileSize(bytes: number): string {
        if (!bytes) return 'Unknown size';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
}
