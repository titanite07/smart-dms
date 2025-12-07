import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Folder {
    _id: string;
    name: string;
    parentFolder: string | null;
    owner: any;
    createdAt: string;
    updatedAt: string;
    isDeleted?: boolean;
    deletedAt?: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class FolderService {
    private apiUrl = 'http://localhost:5000/api/folders';

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

    createFolder(name: string, parentFolder: string | null): Observable<Folder> {
        return this.http.post<Folder>(this.apiUrl, { name, parentFolder }, {
            headers: this.getHeaders()
        });
    }

    getFolderContents(folderId: string): Observable<any> {
        const id = folderId || 'root';
        return this.http.get<any>(`${this.apiUrl}/${id}`, {
            headers: this.getHeaders()
        });
    }

    deleteFolder(folderId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${folderId}`, {
            headers: this.getHeaders()
        });
    }

    getTrash(): Observable<Folder[]> {
        return this.http.get<Folder[]>(`${this.apiUrl}/trash`, {
            headers: this.getHeaders()
        });
    }

    restoreFolder(folderId: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${folderId}/restore`, {}, {
            headers: this.getHeaders()
        });
    }

    permanentDeleteFolder(folderId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${folderId}/permanent`, {
            headers: this.getHeaders()
        });
    }

    moveFolder(folderId: string, parentFolder: string | null): Observable<Folder> {
        return this.http.put<Folder>(`${this.apiUrl}/${folderId}/move`,
            { parentFolder },
            { headers: this.getHeaders() }
        );
    }
}
