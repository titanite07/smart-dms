import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Document {
    _id: string;
    title: string;
    tags: string[];
    owner: any;
    currentPath: string;
    currentVersion: number;
    versions: any[];
    sharedWith: any[];
    parentFolder?: string;
    starredBy?: string[];
    isStarred?: boolean;
    accessLog?: any[];
    createdAt: string;
    updatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    private apiUrl = `${environment.apiUrl}/documents`;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    private getHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    private stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
        'those', 'it', 'its', 'file', 'document', 'copy', 'new', 'final', 'v1', 'v2'
    ]);

    generateTags(file: File, title?: string): string {
        const tags: Set<string> = new Set();
        const fileName = title || file.name;

        // Get file extension as tag
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext) {
            const typeMap: { [key: string]: string } = {
                'pdf': 'PDF', 'doc': 'Word', 'docx': 'Word', 'xls': 'Excel',
                'xlsx': 'Excel', 'ppt': 'PowerPoint', 'pptx': 'PowerPoint',
                'jpg': 'Image', 'jpeg': 'Image', 'png': 'Image', 'gif': 'Image',
                'mp4': 'Video', 'mov': 'Video', 'mp3': 'Audio',
                'txt': 'Text', 'csv': 'Data', 'zip': 'Archive', 'rar': 'Archive'
            };
            if (typeMap[ext]) tags.add(typeMap[ext]);
        }

        // Extract keywords from filename
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        const words = nameWithoutExt
            .replace(/[-_]/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(/\s+/)
            .map(w => w.toLowerCase().trim())
            .filter(w => w.length > 2 && !this.stopWords.has(w));

        words.slice(0, 5).forEach(word => {
            tags.add(word.charAt(0).toUpperCase() + word.slice(1));
        });

        return Array.from(tags).slice(0, 6).join(', ');
    }

    uploadDocument(file: File, title: string, tags: string, parentFolder?: string | null): Observable<Document> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('tags', tags);
        if (parentFolder) {
            formData.append('parentFolder', parentFolder);
        }

        return this.http.post<Document>(`${this.apiUrl}/upload`, formData, {
            headers: this.getHeaders()
        });
    }

    uploadVersion(documentId: string, file: File): Observable<Document> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<Document>(`${this.apiUrl}/${documentId}/version`, formData, {
            headers: this.getHeaders()
        });
    }

    getDocuments(): Observable<Document[]> {
        return this.http.get<Document[]>(this.apiUrl, {
            headers: this.getHeaders()
        });
    }

    searchDocuments(query: string): Observable<Document[]> {
        return this.http.get<Document[]>(`${this.apiUrl}/search?query=${query}`, {
            headers: this.getHeaders()
        });
    }

    shareDocument(documentId: string, email: string, permission: string): Observable<Document> {
        return this.http.post<Document>(`${this.apiUrl}/${documentId}/share`,
            { email, permission },
            { headers: this.getHeaders() }
        );
    }

    toggleStar(documentId: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${documentId}/star`, {}, {
            headers: this.getHeaders()
        });
    }

    getVersions(documentId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${documentId}/versions`, {
            headers: this.getHeaders()
        });
    }

    deleteDocument(documentId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${documentId}`, {
            headers: this.getHeaders()
        });
    }

    deleteVersion(documentId: string, versionId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${documentId}/versions/${versionId}`, {
            headers: this.getHeaders()
        });
    }

    moveDocument(documentId: string, parentFolder: string | null): Observable<Document> {
        return this.http.put<Document>(`${this.apiUrl}/${documentId}/move`,
            { parentFolder },
            { headers: this.getHeaders() }
        );
    }

    getTrash(): Observable<Document[]> {
        return this.http.get<Document[]>(`${this.apiUrl}/trash`, {
            headers: this.getHeaders()
        });
    }

    restoreDocument(documentId: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${documentId}/restore`, {}, {
            headers: this.getHeaders()
        });
    }

    permanentDelete(documentId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${documentId}/permanent`, {
            headers: this.getHeaders()
        });
    }

    downloadFile(documentId: string, version?: number): string {
        const token = this.authService.getToken();
        const versionParam = version ? `?version=${version}` : '';
        return `${this.apiUrl}/${documentId}/download${versionParam}`;
    }

    // New Features - Quick Wins
    getDuplicates(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/duplicates`, {
            headers: this.getHeaders()
        });
    }

    bulkDelete(documentIds: string[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/bulk-delete`,
            { documentIds },
            { headers: this.getHeaders() }
        );
    }

    bulkMove(documentIds: string[], targetFolderId: string | null): Observable<any> {
        return this.http.post(`${this.apiUrl}/bulk-move`,
            { documentIds, targetFolderId },
            { headers: this.getHeaders() }
        );
    }

    getAnalytics(): Observable<any> {
        return this.http.get(`${this.apiUrl}/analytics`, {
            headers: this.getHeaders()
        });
    }
}
