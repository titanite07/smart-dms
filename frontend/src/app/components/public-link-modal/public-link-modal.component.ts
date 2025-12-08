import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdvancedService, PublicLink } from '../../services/advanced.service';
import { Document } from '../../services/document.service';
@Component({
    selector: 'app-public-link-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './public-link-modal.component.html'
})
export class PublicLinkModalComponent {
    @Input() document: Document | null = null;
    @Output() close = new EventEmitter<void>();
    permission: string = 'view';
    expiresIn: number | null = null;
    password: string = '';
    usePassword: boolean = false;
    useExpiry: boolean = false;
    generatedLink: PublicLink | null = null;
    loading: boolean = false;
    error: string = '';
    copied: boolean = false;
    constructor(private advancedService: AdvancedService) { }
    generateLink(): void {
        if (!this.document) return;
        this.loading = true;
        this.error = '';
        const expiry = this.useExpiry && this.expiresIn ? this.expiresIn : undefined;
        const pass = this.usePassword && this.password ? this.password : undefined;
        this.advancedService.createPublicLink(
            this.document._id,
            this.permission,
            expiry,
            pass
        ).subscribe({
            next: (link) => {
                this.generatedLink = link;
                this.loading = false;
            },
            error: (err) => {
                this.error = err.error?.message || 'Failed to create link';
                this.loading = false;
            }
        });
    }
    revokeLink(): void {
        if (!this.document || !confirm('Revoke this public link? Anyone with the link will no longer have access.')) return;
        this.loading = true;
        this.advancedService.revokePublicLink(this.document._id).subscribe({
            next: () => {
                this.generatedLink = null;
                this.loading = false;
            },
            error: (err) => {
                this.error = err.error?.message || 'Failed to revoke link';
                this.loading = false;
            }
        });
    }
    copyLink(): void {
        if (this.generatedLink) {
            navigator.clipboard.writeText(this.generatedLink.link);
            this.copied = true;
            setTimeout(() => this.copied = false, 2000);
        }
    }
    closeModal(): void {
        this.close.emit();
    }
}
