import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

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
    private apiUrl = 'http://localhost:5000/api/documents';

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
}
