import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Document, DocumentService } from '../../services/document.service';
interface Version {
    _id: string;
    versionNumber: number;
    filename: string;
    uploadedAt: string;
    size?: number;
}
interface VersionData {
    current: Version;
    versions: Version[];
}
@Component({
    selector: 'app-version-history',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './version-history.component.html'
})
export class VersionHistoryComponent implements OnInit, OnChanges {
    @Input() document: Document | null = null;
    @Input() isOwner: boolean = false;
    @Output() close = new EventEmitter<void>();
    @Output() refresh = new EventEmitter<void>();
    versions: VersionData | null = null;
    allVersions: Version[] = [];
    loading = true;
    uploadingVersion = false;
    error = '';
    animationStarted = false;
    constructor(private documentService: DocumentService) { }
    ngOnInit(): void {
        this.loadVersions();
    }
    ngOnChanges(): void {
        if (this.document) {
            this.loadVersions();
        }
    }
    loadVersions(): void {
        if (!this.document) return;
        this.loading = true;
        this.animationStarted = false;
        this.documentService.getVersions(this.document._id).subscribe({
            next: (data) => {
                this.versions = data;
                this.allVersions = this.combineVersions(data);
                this.loading = false;
                setTimeout(() => {
                    this.animationStarted = true;
                }, 100);
            },
            error: (err) => {
                console.error('Error loading versions:', err);
                this.loading = false;
            }
        });
    }
    combineVersions(data: VersionData): Version[] {
        const all: Version[] = [];
        if (data.current) {
            all.push(data.current);
        }
        if (data.versions && data.versions.length > 0) {
            all.push(...data.versions.slice().reverse());
        }
        return all;
    }
    getAnimationDelay(index: number): string {
        return `${index * 150}ms`;
    }
    getNodeColor(index: number, total: number): string {
        if (index === 0) return 'from-emerald-400 to-green-500';
        const colors = [
            'from-blue-400 to-indigo-500',
            'from-purple-400 to-violet-500',
            'from-pink-400 to-rose-500',
            'from-amber-400 to-orange-500',
            'from-cyan-400 to-teal-500'
        ];
        return colors[(index - 1) % colors.length];
    }
    getCommitHash(): string {
        const chars = '0123456789abcdef';
        let hash = '';
        for (let i = 0; i < 7; i++) {
            hash += chars[Math.floor(Math.random() * chars.length)];
        }
        return hash;
    }
    formatFileSize(bytes: number | undefined): string {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
    getRelativeTime(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        if (diffSecs < 60) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    }
    downloadVersion(versionNumber: number): void {
        if (this.document) {
            const url = this.documentService.downloadFile(this.document._id, versionNumber);
            window.open(url, '_blank');
        }
    }
    deleteVersion(versionId: string): void {
        if (!confirm('Are you sure you want to delete this version?') || !this.document) return;
        this.documentService.deleteVersion(this.document._id, versionId).subscribe({
            next: () => {
                this.loadVersions();
                this.refresh.emit();
            },
            error: (err) => {
                console.error('Error deleting version:', err);
                alert('Failed to delete version');
            }
        });
    }
    onVersionFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file && this.document) {
            this.uploadingVersion = true;
            this.error = '';
            this.documentService.uploadVersion(this.document._id, file).subscribe({
                next: () => {
                    this.uploadingVersion = false;
                    this.loadVersions();
                    this.refresh.emit();
                },
                error: (err) => {
                    this.uploadingVersion = false;
                    this.error = err.error?.message || 'Failed to upload version';
                }
            });
        }
    }
    closeModal(): void {
        this.close.emit();
    }
}
