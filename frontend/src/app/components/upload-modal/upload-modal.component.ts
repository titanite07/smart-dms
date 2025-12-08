import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document.service';
@Component({
    selector: 'app-upload-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './upload-modal.component.html'
})
export class UploadModalComponent implements OnInit {
    @Output() close = new EventEmitter<void>();
    @Output() uploadSuccess = new EventEmitter<void>();
    @Input() currentFolderId: string | null = null;
    @Input() currentFolderName: string = 'Home';
    @Input() files: File[] = [];
    title = '';
    tags = '';
    selectedFiles: File[] = [];
    uploading = false;
    error = '';
    isDragDrop = false;
    private stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
        'those', 'it', 'its', 'file', 'document', 'copy', 'new', 'final', 'v1', 'v2'
    ]);
    constructor(private documentService: DocumentService) { }
    ngOnInit(): void {
        if (this.files && this.files.length > 0) {
            this.selectedFiles = this.files;
            this.isDragDrop = true;
            if (this.selectedFiles.length === 1) {
                this.title = this.selectedFiles[0].name;
                this.tags = this.documentService.generateTags(this.selectedFiles[0]);
            } else {
                this.title = `${this.selectedFiles.length} files selected`;
                this.tags = this.generateTagsFromMultipleFiles(this.selectedFiles);
            }
        }
    }
    generateTagsFromMultipleFiles(files: File[]): string {
        const allTags: Set<string> = new Set();
        files.forEach(file => {
            const fileTags = this.documentService.generateTags(file).split(', ');
            fileTags.forEach(t => allTags.add(t));
        });
        return Array.from(allTags).slice(0, 6).join(', ');
    }
    onFileSelected(event: any): void {
        const files: FileList = event.target.files;
        if (files && files.length > 0) {
            this.selectedFiles = Array.from(files);
            if (this.selectedFiles.length === 1) {
                if (!this.title) this.title = this.selectedFiles[0].name;
                this.tags = this.documentService.generateTags(this.selectedFiles[0]);
            } else {
                this.title = `${this.selectedFiles.length} files selected`;
                this.tags = this.generateTagsFromMultipleFiles(this.selectedFiles);
            }
            this.error = '';
        }
    }
    onTitleChange(): void {
        if (this.selectedFiles.length === 1) {
            this.tags = this.documentService.generateTags(this.selectedFiles[0], this.title);
        }
    }
    onSubmit(): void {
        if (this.selectedFiles.length === 0) {
            this.error = 'Please select at least one file';
            return;
        }
        this.uploading = true;
        this.error = '';
        let completed = 0;
        let errors = 0;
        const uploadNext = (index: number) => {
            if (index >= this.selectedFiles.length) {
                this.uploading = false;
                if (errors === 0) {
                    this.uploadSuccess.emit();
                } else {
                    this.error = `Uploaded ${completed} files, but ${errors} failed.`;
                    this.uploadSuccess.emit();
                }
                return;
            }
            const file = this.selectedFiles[index];
            const docTitle = this.selectedFiles.length > 1 ? file.name : this.title;
            const docTags = this.selectedFiles.length > 1 ? this.documentService.generateTags(file) : this.tags;
            const folderId = (this.currentFolderId === 'null' || this.currentFolderId === 'root') ? null : this.currentFolderId;
            this.documentService.uploadDocument(file, docTitle, docTags, folderId).subscribe({
                next: () => {
                    completed++;
                    uploadNext(index + 1);
                },
                error: (err) => {
                    console.error(`Failed to upload ${file.name}`, err);
                    errors++;
                    uploadNext(index + 1);
                }
            });
        };
        uploadNext(0);
    }
    closeModal(): void {
        this.close.emit();
    }
}
