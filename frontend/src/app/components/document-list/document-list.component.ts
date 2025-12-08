import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Document, DocumentService } from '../../services/document.service';
import { FolderService, Folder } from '../../services/folder.service';
import { PreviewModalComponent } from '../preview-modal/preview-modal.component';
import { VersionHistoryComponent } from '../version-history/version-history.component';
import { CommentsComponent } from '../comments/comments.component';
import { PublicLinkModalComponent } from '../public-link-modal/public-link-modal.component';
@Component({
    selector: 'app-document-list',
    standalone: true,
    imports: [CommonModule, FormsModule, PreviewModalComponent, VersionHistoryComponent, CommentsComponent, PublicLinkModalComponent],
    templateUrl: './document-list.component.html'
})
export class DocumentListComponent {
    @Input() documents: Document[] = [];
    @Input() folders: Folder[] = [];
    @Input() currentUserId: string = '';
    @Input() isTrashView: boolean = false;
    @Output() refresh = new EventEmitter<void>();
    @Output() navigateToFolder = new EventEmitter<string>();
    showVersionModal = false;
    showShareModal = false;
    showPreviewModal = false;
    showCommentsPanel = false;
    showPublicLinkModal = false;
    selectedDocument: Document | null = null;
    versions: any = null;
    shareEmail = '';
    sharePermission = 'view';
    uploadingVersion = false;
    sharing = false;
    error = '';
    selectionMode = false;
    selectedItems: Set<string> = new Set();
    selectAll = false;
    constructor(
        private documentService: DocumentService,
        private folderService: FolderService
    ) { }
    isOwner(doc: Document | Folder): boolean {
        const ownerId = (doc as any).owner?._id || (doc as any).owner;
        return ownerId === this.currentUserId;
    }
    canEdit(doc: Document): boolean {
        if (this.isOwner(doc)) return true;
        return doc.sharedWith?.some(share =>
            share.user._id === this.currentUserId && share.permission === 'edit'
        ) || false;
    }
    onFolderClick(folderId: string): void {
        this.navigateToFolder.emit(folderId);
    }
    deleteItem(item: Document | Folder, type: 'document' | 'folder'): void {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
        if (type === 'document') {
            this.documentService.deleteDocument(item._id).subscribe({
                next: () => this.refresh.emit(),
                error: (err) => alert('Failed to delete document')
            });
        } else {
            this.folderService.deleteFolder(item._id).subscribe({
                next: () => this.refresh.emit(),
                error: (err) => alert('Failed to delete folder')
            });
        }
    }
    restoreDocument(doc: Document): void {
        this.documentService.restoreDocument(doc._id).subscribe({
            next: () => {
                this.refresh.emit();
            },
            error: (err) => {
                console.error('Restore failed:', err);
                alert('Failed to restore document');
            }
        });
    }
    permanentDeleteDocument(doc: Document): void {
        if (!confirm('This will PERMANENTLY delete the document. This action cannot be undone. Continue?')) return;
        this.documentService.permanentDelete(doc._id).subscribe({
            next: () => {
                this.refresh.emit();
            },
            error: (err) => {
                console.error('Permanent delete failed:', err);
                alert('Failed to permanently delete document');
            }
        });
    }
    openCommentsPanel(doc: Document): void {
        this.selectedDocument = doc;
        this.showCommentsPanel = true;
    }
    closeCommentsPanel(): void {
        this.showCommentsPanel = false;
    }
    openPublicLinkModal(doc: Document): void {
        this.selectedDocument = doc;
        this.showPublicLinkModal = true;
    }
    closePublicLinkModal(): void {
        this.showPublicLinkModal = false;
    }
    restoreFolder(folder: Folder): void {
        this.folderService.restoreFolder(folder._id).subscribe({
            next: () => {
                this.refresh.emit();
            },
            error: (err) => {
                console.error('Restore folder failed:', err);
                alert('Failed to restore folder');
            }
        });
    }
    permanentDeleteFolder(folder: Folder): void {
        if (!confirm('This will PERMANENTLY delete the folder and all its contents. This action cannot be undone. Continue?')) return;
        this.folderService.permanentDeleteFolder(folder._id).subscribe({
            next: () => {
                this.refresh.emit();
            },
            error: (err) => {
                console.error('Permanent delete folder failed:', err);
                alert('Failed to permanently delete folder');
            }
        });
    }
    toggleSelectionMode(): void {
        this.selectionMode = !this.selectionMode;
        if (!this.selectionMode) {
            this.selectedItems.clear();
            this.selectAll = false;
        }
    }
    toggleSelectAll(): void {
        this.selectAll = !this.selectAll;
        if (this.selectAll) {
            this.documents.forEach(doc => this.selectedItems.add(doc._id));
            this.folders.forEach(folder => this.selectedItems.add(folder._id));
        } else {
            this.selectedItems.clear();
        }
    }
    toggleItemSelection(id: string): void {
        if (this.selectedItems.has(id)) {
            this.selectedItems.delete(id);
        } else {
            this.selectedItems.add(id);
        }
        this.updateSelectAllState();
    }
    updateSelectAllState(): void {
        const totalItems = this.documents.length + this.folders.length;
        this.selectAll = this.selectedItems.size === totalItems && totalItems > 0;
    }
    isItemSelected(id: string): boolean {
        return this.selectedItems.has(id);
    }
    deleteAllSelected(): void {
        if (this.selectedItems.size === 0) return;
        const message = this.isTrashView
            ? `Permanently delete ${this.selectedItems.size} item(s)? This cannot be undone.`
            : `Delete ${this.selectedItems.size} item(s)?`;
        if (!confirm(message)) return;
        const deleteObservables: any[] = [];
        this.selectedItems.forEach(id => {
            const doc = this.documents.find(d => d._id === id);
            const folder = this.folders.find(f => f._id === id);
            if (doc) {
                const obs = this.isTrashView
                    ? this.documentService.permanentDelete(id)
                    : this.documentService.deleteDocument(id);
                deleteObservables.push(obs);
            }
            if (folder) {
                const obs = this.isTrashView
                    ? this.folderService.permanentDeleteFolder(id)
                    : this.folderService.deleteFolder(id);
                deleteObservables.push(obs);
            }
        });
        if (deleteObservables.length === 0) return;
        let completed = 0;
        let failed = 0;
        deleteObservables.forEach(obs => {
            obs.subscribe({
                next: () => {
                    completed++;
                    if (completed + failed === deleteObservables.length) {
                        this.selectedItems.clear();
                        this.selectAll = false;
                        this.selectionMode = false;
                        this.refresh.emit();
                        if (failed > 0) {
                            alert(`${failed} item(s) failed to delete`);
                        }
                    }
                },
                error: (err: any) => {
                    console.error('Delete failed:', err);
                    failed++;
                    if (completed + failed === deleteObservables.length) {
                        this.selectedItems.clear();
                        this.selectAll = false;
                        this.selectionMode = false;
                        this.refresh.emit();
                        if (failed > 0) {
                            alert(`${failed} item(s) failed to delete`);
                        }
                    }
                }
            });
        });
    }
    deleteAllInTrash(): void {
        const totalItems = this.documents.length + this.folders.length;
        if (totalItems === 0) return;
        if (!confirm(`Permanently delete ALL ${totalItems} item(s) in trash? This cannot be undone.`)) return;
        const deleteObservables: any[] = [];
        this.documents.forEach(doc => {
            deleteObservables.push(this.documentService.permanentDelete(doc._id));
        });
        this.folders.forEach(folder => {
            deleteObservables.push(this.folderService.permanentDeleteFolder(folder._id));
        });
        if (deleteObservables.length === 0) return;
        let completed = 0;
        let failed = 0;
        deleteObservables.forEach(obs => {
            obs.subscribe({
                next: () => {
                    completed++;
                    if (completed + failed === deleteObservables.length) {
                        this.refresh.emit();
                        if (failed > 0) {
                            alert(`${failed} item(s) failed to delete`);
                        }
                    }
                },
                error: (err: any) => {
                    console.error('Delete failed:', err);
                    failed++;
                    if (completed + failed === deleteObservables.length) {
                        this.refresh.emit();
                        if (failed > 0) {
                            alert(`${failed} item(s) failed to delete`);
                        }
                    }
                }
            });
        });
    }
    draggedDocId: string | null = null;
    draggedFolderId: string | null = null;
    draggedType: 'document' | 'folder' | null = null;
    clipboard: { type: 'document' | 'folder', id: string, action: 'copy' | 'cut' } | null = null;
    selectedItem: { type: 'document' | 'folder', id: string } | null = null;
    onDocDragStart(event: DragEvent, doc: Document): void {
        this.draggedDocId = doc._id;
        this.draggedFolderId = null;
        this.draggedType = 'document';
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', doc._id);
            event.dataTransfer.setData('application/x-dms-type', 'document');
        }
    }
    onFolderDragStart(event: DragEvent, folder: Folder): void {
        this.draggedFolderId = folder._id;
        this.draggedDocId = null;
        this.draggedType = 'folder';
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', folder._id);
            event.dataTransfer.setData('application/x-dms-type', 'folder');
        }
    }
    onFolderDragOver(event: DragEvent): void {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }
    onFolderDrop(event: DragEvent, targetFolder: Folder): void {
        event.preventDefault();
        if (this.draggedDocId && this.draggedType === 'document') {
            this.documentService.moveDocument(this.draggedDocId, targetFolder._id).subscribe({
                next: () => {
                    this.refresh.emit();
                    this.clearDragState();
                },
                error: (err) => {
                    console.error('Move failed', err);
                    alert('Failed to move document');
                    this.clearDragState();
                }
            });
        }
        if (this.draggedFolderId && this.draggedType === 'folder') {
            if (this.draggedFolderId === targetFolder._id) {
                alert('Cannot move folder into itself');
                this.clearDragState();
                return;
            }
            this.folderService.moveFolder(this.draggedFolderId, targetFolder._id).subscribe({
                next: () => {
                    this.refresh.emit();
                    this.clearDragState();
                },
                error: (err) => {
                    console.error('Move folder failed', err);
                    alert('Failed to move folder');
                    this.clearDragState();
                }
            });
        }
    }
    clearDragState(): void {
        this.draggedDocId = null;
        this.draggedFolderId = null;
        this.draggedType = null;
    }
    selectItem(type: 'document' | 'folder', id: string): void {
        this.selectedItem = { type, id };
    }
    copyItem(type: 'document' | 'folder', id: string): void {
        this.clipboard = { type, id, action: 'copy' };
    }
    cutItem(type: 'document' | 'folder', id: string): void {
        this.clipboard = { type, id, action: 'cut' };
    }
    pasteItem(targetFolderId: string | null): void {
        if (!this.clipboard) {
            alert('Nothing in clipboard to paste');
            return;
        }
        const { type, id, action } = this.clipboard;
        if (type === 'document') {
            if (action === 'cut') {
                this.documentService.moveDocument(id, targetFolderId).subscribe({
                    next: () => {
                        this.clipboard = null;
                        this.refresh.emit();
                    },
                    error: (err) => {
                        console.error('Paste (move) failed', err);
                        alert('Failed to move document');
                    }
                });
            } else {
                alert('Copy operation for documents is not yet implemented. Use Cut (Ctrl+X) instead.');
            }
        } else if (type === 'folder') {
            if (action === 'cut') {
                this.folderService.moveFolder(id, targetFolderId).subscribe({
                    next: () => {
                        this.clipboard = null;
                        this.refresh.emit();
                    },
                    error: (err) => {
                        console.error('Paste (move folder) failed', err);
                        alert('Failed to move folder');
                    }
                });
            } else {
                alert('Copy operation for folders is not yet implemented. Use Cut (Ctrl+X) instead.');
            }
        }
    }
    downloadDocument(doc: Document): void {
        const url = this.documentService.downloadFile(doc._id);
        window.open(url, '_blank');
    }
    onToggleStar(doc: Document): void {
        this.documentService.toggleStar(doc._id).subscribe({
            next: (response) => {
                doc.isStarred = response.isStarred;
                this.refresh.emit();
            },
            error: (err) => {
                console.error('Error toggling star:', err);
            }
        });
    }
    openVersionModal(doc: Document): void {
        this.selectedDocument = doc;
        this.showVersionModal = true;
        this.loadVersions(doc._id);
    }
    loadVersions(docId: string): void {
        this.documentService.getVersions(docId).subscribe({
            next: (data) => {
                this.versions = data;
            },
            error: (err) => {
                console.error('Error loading versions:', err);
            }
        });
    }
    downloadVersion(versionNumber: number): void {
        if (this.selectedDocument) {
            const url = this.documentService.downloadFile(this.selectedDocument._id, versionNumber);
            window.open(url, '_blank');
        }
    }
    deleteVersion(versionId: string): void {
        if (!confirm('Are you sure you want to delete this version?') || !this.selectedDocument) return;
        this.documentService.deleteVersion(this.selectedDocument._id, versionId).subscribe({
            next: (data) => {
                if (this.versions) {
                    this.versions.versions = data.versions;
                }
            },
            error: (err) => {
                console.error('Error deleting version:', err);
                alert('Failed to delete version');
            }
        });
    }
    onVersionFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file && this.selectedDocument) {
            this.uploadingVersion = true;
            this.documentService.uploadVersion(this.selectedDocument._id, file).subscribe({
                next: () => {
                    this.uploadingVersion = false;
                    this.closeVersionModal();
                    this.refresh.emit();
                },
                error: (err) => {
                    this.error = err.error.message || 'Version upload failed';
                    this.uploadingVersion = false;
                }
            });
        }
    }
    closeVersionModal(): void {
        this.showVersionModal = false;
        this.selectedDocument = null;
        this.versions = null;
        this.error = '';
    }
    openShareModal(doc: Document): void {
        this.selectedDocument = doc;
        this.showShareModal = true;
        this.shareEmail = '';
        this.sharePermission = 'view';
    }
    shareDocument(): void {
        if (this.selectedDocument && this.shareEmail) {
            this.sharing = true;
            this.error = '';
            this.documentService.shareDocument(this.selectedDocument._id, this.shareEmail, this.sharePermission).subscribe({
                next: () => {
                    this.sharing = false;
                    this.closeShareModal();
                    this.refresh.emit();
                },
                error: (err) => {
                    this.error = err.error.message || 'Sharing failed';
                    this.sharing = false;
                }
            });
        }
    }
    closeShareModal(): void {
        this.showShareModal = false;
        this.selectedDocument = null;
        this.shareEmail = '';
        this.error = '';
    }
    openPreviewModal(doc: Document): void {
        this.selectedDocument = doc;
        this.showPreviewModal = true;
    }
    closePreviewModal(): void {
        this.showPreviewModal = false;
        this.selectedDocument = null;
    }
}
