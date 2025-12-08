import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DocumentService, Document } from '../../services/document.service';
import { FolderService, Folder } from '../../services/folder.service';
import { AuthService } from '../../services/auth.service';
import { UploadModalComponent } from '../upload-modal/upload-modal.component';
import { DocumentListComponent } from '../document-list/document-list.component';
import { StorageBarComponent } from '../storage-bar/storage-bar.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, UploadModalComponent, DocumentListComponent, StorageBarComponent],
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
    @ViewChild(DocumentListComponent) documentList!: DocumentListComponent;

    documents: Document[] = [];
    folders: Folder[] = [];
    filteredDocuments: Document[] = [];
    searchQuery: string = '';
    currentView: 'all' | 'starred' | 'shared' | 'recent' | 'trash' = 'all';
    currentFolderId: string | null = null;
    breadcrumbs: any[] = [];
    showUploadModal = false;
    currentUser: any;
    loading = false;

    // Upload progress tracking
    isUploading = false;
    currentUploadingFile = '';
    uploadedCount = 0;
    totalUploadCount = 0;

    // Analytics
    analytics: any = null;
    showDuplicatesModal = false;
    duplicates: any[] = [];

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return;
        }

        if (!this.documentList) return;

        if (event.ctrlKey || event.metaKey) {
            const selectedItem = this.documentList.selectedItem;

            if (event.key === 'c' && selectedItem) {
                event.preventDefault();
                this.documentList.copyItem(selectedItem.type, selectedItem.id);
            } else if (event.key === 'x' && selectedItem) {
                event.preventDefault();
                this.documentList.cutItem(selectedItem.type, selectedItem.id);
            } else if (event.key === 'v' && this.documentList.clipboard) {
                event.preventDefault();
                this.documentList.pasteItem(this.currentFolderId);
            }
        }
    }

    constructor(
        private documentService: DocumentService,
        private folderService: FolderService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
        });
        this.initializeTheme();
        this.loadContent();
        this.loadAnalytics();
    }

    loadAnalytics(): void {
        this.documentService.getAnalytics().subscribe({
            next: (data) => {
                this.analytics = data;
            },
            error: (err) => console.error('Analytics error:', err)
        });
    }

    findDuplicates(): void {
        this.documentService.getDuplicates().subscribe({
            next: (data) => {
                this.duplicates = data;
                this.showDuplicatesModal = true;
            },
            error: (err) => console.error('Duplicates error:', err)
        });
    }

    closeDuplicatesModal(): void {
        this.showDuplicatesModal = false;
    }

    loadContent(): void {
        this.loading = true;

        if (this.currentView === 'all') {
            this.folderService.getFolderContents(this.currentFolderId || 'root').subscribe({
                next: (data) => {
                    this.documents = data.documents;
                    this.folders = data.folders || [];
                    this.breadcrumbs = data.breadcrumbs || [];
                    this.filterDocuments();
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Error loading folder contents:', err);
                    this.loading = false;
                }
            });
        } else if (this.currentView === 'trash') {
            this.documentService.getTrash().subscribe({
                next: (docs) => {
                    this.documents = docs;
                    this.filteredDocuments = docs;
                    this.folderService.getTrash().subscribe({
                        next: (folders) => {
                            this.folders = folders;
                            this.loading = false;
                        },
                        error: () => {
                            this.folders = [];
                            this.loading = false;
                        }
                    });
                },
                error: (err) => {
                    console.error('Error loading trash:', err);
                    this.loading = false;
                }
            });
        } else {
            this.documentService.getDocuments().subscribe({
                next: (docs) => {
                    this.documents = docs;
                    this.folders = [];
                    this.filterDocuments();
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Error loading documents:', err);
                    this.loading = false;
                }
            });
        }
    }

    setView(view: 'all' | 'starred' | 'shared' | 'recent' | 'trash'): void {
        this.currentView = view;
        this.currentFolderId = null;
        this.loadContent();
    }

    onNavigateToFolder(folderId: string): void {
        this.currentFolderId = folderId;
        this.loadContent();
    }

    onNavigateUp(folderId: string | null): void {
        this.currentFolderId = folderId;
        this.loadContent();
    }

    filterDocuments(): void {
        let filtered = this.documents;

        if (this.currentView === 'shared') {
            filtered = filtered.filter(doc => doc.owner._id !== this.currentUser._id);
        } else if (this.currentView === 'starred') {
            filtered = filtered.filter(doc => doc.isStarred);
        } else if (this.currentView === 'recent') {
            filtered = filtered.filter(doc => {
                return doc.accessLog?.some((log: any) => log.viewedBy?.toString() === this.currentUser._id?.toString());
            }).sort((a, b) => {
                const getLastView = (doc: Document) => {
                    const logs = doc.accessLog?.filter((log: any) => log.viewedBy?.toString() === this.currentUser._id?.toString()) || [];
                    if (logs.length === 0) return 0;
                    return new Date(logs[logs.length - 1].viewedAt).getTime();
                };
                return getLastView(b) - getLastView(a);
            });
        }

        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(doc =>
                doc.title.toLowerCase().includes(query) ||
                doc.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        this.filteredDocuments = filtered;
    }

    onSearch(): void {
        this.filterDocuments();
    }

    openUploadModal(): void {
        this.showUploadModal = true;
    }

    closeUploadModal(): void {
        this.showUploadModal = false;
    }

    onUploadSuccess(): void {
        this.closeUploadModal();
        this.loadContent();
    }

    createFolder(): void {
        const name = prompt('Enter folder name:');
        if (name && name.trim()) {
            this.folderService.createFolder(name.trim(), this.currentFolderId).subscribe({
                next: () => {
                    this.loadContent();
                },
                error: (err) => {
                    console.error('Error creating folder:', err);
                    alert('Failed to create folder');
                }
            });
        }
    }

    getCurrentFolderName(): string {
        if (!this.breadcrumbs || this.breadcrumbs.length === 0) return 'Home';
        return this.breadcrumbs[this.breadcrumbs.length - 1].name;
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    isDarkMode = false;

    initializeTheme(): void {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            this.isDarkMode = true;
            document.documentElement.classList.add('dark');
        } else {
            this.isDarkMode = false;
            document.documentElement.classList.remove('dark');
        }
    }

    toggleTheme(): void {
        this.isDarkMode = !this.isDarkMode;
        if (this.isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }

    isDragging = false;
    draggedFiles: File[] = [];

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        const items = event.dataTransfer?.items;
        if (items && items.length > 0) {
            this.processDroppedItems(items);
        } else {
            const files = event.dataTransfer?.files;
            if (files && files.length > 0) {
                this.draggedFiles = Array.from(files);
                this.openUploadModal();
            }
        }
    }

    async processDroppedItems(items: DataTransferItemList): Promise<void> {
        const entries: FileSystemEntry[] = [];

        for (let i = 0; i < items.length; i++) {
            const entry = items[i].webkitGetAsEntry();
            if (entry) {
                entries.push(entry);
            }
        }

        const hasFolder = entries.some(e => e.isDirectory);

        if (hasFolder) {
            // Count total files first
            this.totalUploadCount = await this.countFilesInEntries(entries);
            this.uploadedCount = 0;
            this.isUploading = true;

            await this.processEntriesWithFolders(entries, this.currentFolderId);

            this.isUploading = false;
            this.loadContent();
        } else {
            const files = await this.getFilesFromEntries(entries);
            if (files.length > 0) {
                this.draggedFiles = files;
                this.openUploadModal();
            }
        }
    }

    async processEntriesWithFolders(entries: FileSystemEntry[], parentFolderId: string | null): Promise<void> {
        for (const entry of entries) {
            try {
                if (entry.isDirectory) {
                    const dirEntry = entry as FileSystemDirectoryEntry;
                    const newFolder = await this.folderService.createFolder(entry.name, parentFolderId).toPromise();

                    if (newFolder) {
                        const subEntries = await this.readDirectory(dirEntry);
                        await this.processEntriesWithFolders(subEntries, newFolder._id);
                    }
                } else if (entry.isFile) {
                    const fileEntry = entry as FileSystemFileEntry;
                    const file = await this.getFileFromEntry(fileEntry);
                    if (file) {
                        this.currentUploadingFile = file.name;
                        const tags = this.documentService.generateTags(file);
                        // Retry up to 3 times on failure
                        let retries = 3;
                        while (retries > 0) {
                            try {
                                await this.documentService.uploadDocument(file, file.name, tags, parentFolderId).toPromise();
                                this.uploadedCount++;
                                break; // Success, exit retry loop
                            } catch (uploadError) {
                                retries--;
                                if (retries === 0) {
                                    console.error(`Failed to upload ${file.name} after 3 attempts:`, uploadError);
                                } else {
                                    // Wait 500ms before retry
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`Error processing entry ${entry.name}:`, error);
                // Continue with next entry instead of stopping
            }
        }
    }

    readDirectory(dirEntry: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
        return new Promise((resolve) => {
            const reader = dirEntry.createReader();
            const entries: FileSystemEntry[] = [];

            const readEntries = () => {
                reader.readEntries((results) => {
                    if (results.length === 0) {
                        resolve(entries);
                    } else {
                        entries.push(...results);
                        readEntries();
                    }
                });
            };
            readEntries();
        });
    }

    getFileFromEntry(fileEntry: FileSystemFileEntry): Promise<File | null> {
        return new Promise((resolve) => {
            fileEntry.file(
                (file) => resolve(file),
                () => resolve(null)
            );
        });
    }

    async getFilesFromEntries(entries: FileSystemEntry[]): Promise<File[]> {
        const files: File[] = [];
        for (const entry of entries) {
            if (entry.isFile) {
                const file = await this.getFileFromEntry(entry as FileSystemFileEntry);
                if (file) files.push(file);
            }
        }
        return files;
    }

    async countFilesInEntries(entries: FileSystemEntry[]): Promise<number> {
        let count = 0;
        for (const entry of entries) {
            if (entry.isDirectory) {
                const dirEntry = entry as FileSystemDirectoryEntry;
                const subEntries = await this.readDirectory(dirEntry);
                count += await this.countFilesInEntries(subEntries);
            } else if (entry.isFile) {
                count++;
            }
        }
        return count;
    }
}
