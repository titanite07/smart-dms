import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Comment {
    _id: string;
    document: string;
    user: { _id: string; name: string; email: string };
    content: string;
    parentComment?: string;
    mentions?: { _id: string; name: string; email: string }[];
    isEdited: boolean;
    editedAt?: string;
    createdAt: string;
    updatedAt: string;
    replies?: Comment[];
}

export interface ActivityLog {
    _id: string;
    user: { _id: string; name: string; email: string };
    action: string;
    resourceType: string;
    resourceId?: string;
    resourceName?: string;
    details?: any;
    createdAt: string;
}

export interface StorageUsage {
    used: number;
    quota: number;
    usagePercent: string;
    remaining: number;
    documentCount: number;
}

export interface PublicLink {
    message: string;
    link: string;
    token: string;
    permission: string;
    expiresAt?: string;
    hasPassword: boolean;
}

export interface AdminDashboard {
    stats: {
        totalUsers: number;
        activeUsers: number;
        totalDocuments: number;
        totalFolders: number;
        trashedDocuments: number;
        totalStorage: number;
        totalQuota: number;
        totalUsed: number;
    };
    recentActivity: ActivityLog[];
    usersByMonth: { _id: string; count: number }[];
}

export interface AdminUser {
    _id: string;
    name: string;
    email: string;
    role: string;
    company?: string;
    storageUsed: number;
    storageQuota: number;
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
    documentCount?: number;
    folderCount?: number;
}

@Injectable({
    providedIn: 'root'
})
export class AdvancedService {
    private apiUrl = 'http://localhost:5000/api';

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


    getComments(documentId: string): Observable<Comment[]> {
        return this.http.get<Comment[]>(`${this.apiUrl}/comments/${documentId}`, {
            headers: this.getHeaders()
        });
    }

    addComment(documentId: string, content: string, parentCommentId?: string): Observable<Comment> {
        return this.http.post<Comment>(`${this.apiUrl}/comments/${documentId}`,
            { content, parentCommentId },
            { headers: this.getHeaders() }
        );
    }

    updateComment(commentId: string, content: string): Observable<Comment> {
        return this.http.put<Comment>(`${this.apiUrl}/comments/${commentId}`,
            { content },
            { headers: this.getHeaders() }
        );
    }

    deleteComment(commentId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/comments/${commentId}`, {
            headers: this.getHeaders()
        });
    }

    getCommentCount(documentId: string): Observable<{ count: number }> {
        return this.http.get<{ count: number }>(`${this.apiUrl}/comments/${documentId}/count`, {
            headers: this.getHeaders()
        });
    }


    getActivityLog(page: number = 1, limit: number = 50): Observable<{ activities: ActivityLog[]; pagination: any }> {
        return this.http.get<any>(`${this.apiUrl}/activity?page=${page}&limit=${limit}`, {
            headers: this.getHeaders()
        });
    }

    getActivityStats(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/activity/stats`, {
            headers: this.getHeaders()
        });
    }


    getStorageUsage(): Observable<StorageUsage> {
        return this.http.get<StorageUsage>(`${this.apiUrl}/documents/storage`, {
            headers: this.getHeaders()
        });
    }


    createPublicLink(documentId: string, permission: string = 'view', expiresIn?: number, password?: string): Observable<PublicLink> {
        return this.http.post<PublicLink>(`${this.apiUrl}/documents/${documentId}/public-link`,
            { permission, expiresIn, password },
            { headers: this.getHeaders() }
        );
    }

    revokePublicLink(documentId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/documents/${documentId}/public-link`, {
            headers: this.getHeaders()
        });
    }


    getAdminDashboard(): Observable<AdminDashboard> {
        return this.http.get<AdminDashboard>(`${this.apiUrl}/admin/dashboard`, {
            headers: this.getHeaders()
        });
    }

    getAllUsers(page: number = 1, limit: number = 20, search?: string): Observable<{ users: AdminUser[]; pagination: any }> {
        let url = `${this.apiUrl}/admin/users?page=${page}&limit=${limit}`;
        if (search) url += `&search=${search}`;
        return this.http.get<any>(url, { headers: this.getHeaders() });
    }

    updateUser(userId: string, data: Partial<AdminUser>): Observable<any> {
        return this.http.put(`${this.apiUrl}/admin/users/${userId}`, data, {
            headers: this.getHeaders()
        });
    }

    deleteUser(userId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/admin/users/${userId}`, {
            headers: this.getHeaders()
        });
    }

    setUserQuota(userId: string, quota: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/admin/users/${userId}/quota`, { quota }, {
            headers: this.getHeaders()
        });
    }

    getStorageReport(): Observable<any> {
        return this.http.get(`${this.apiUrl}/admin/storage`, {
            headers: this.getHeaders()
        });
    }
}
