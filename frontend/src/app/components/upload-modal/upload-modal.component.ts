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

    constructor(private documentService: DocumentService) { }

    ngOnInit(): void {
        if (this.files && this.files.length > 0) {
            this.selectedFiles = this.files;
            this.isDragDrop = true;

            if (this.selectedFiles.length === 1) {
                this.title = this.selectedFiles[0].name;
            } else {
                this.title = `${this.selectedFiles.length} files selected`;
            }
        }
    }

    onFileSelected(event: any): void {
        const files: FileList = event.target.files;
        if (files && files.length > 0) {
            this.selectedFiles = Array.from(files);
            if (!this.title && this.selectedFiles.length === 1) {
                this.title = this.selectedFiles[0].name;
            } else if (this.selectedFiles.length > 1) {
                this.title = `${this.selectedFiles.length} files selected`;
            }
            this.error = '';
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
            const folderId = (this.currentFolderId === 'null' || this.currentFolderId === 'root') ? null : this.currentFolderId;

            this.documentService.uploadDocument(file, docTitle, this.tags, folderId).subscribe({
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
