import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdvancedService, AdminDashboard, AdminUser } from '../../services/advanced.service';
@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
    dashboard: AdminDashboard | null = null;
    users: AdminUser[] = [];
    loading: boolean = true;
    usersLoading: boolean = false;
    activeTab: string = 'overview';
    searchQuery: string = '';
    editingUser: AdminUser | null = null;
    page: number = 1;
    totalPages: number = 1;
    error: string = '';
    accessDenied: boolean = false;
    constructor(private advancedService: AdvancedService) { }
    ngOnInit(): void {
        this.loadDashboard();
        this.loadUsers();
    }
    loadDashboard(): void {
        this.advancedService.getAdminDashboard().subscribe({
            next: (data) => {
                this.dashboard = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load dashboard:', err);
                this.loading = false;
                if (err.status === 403) {
                    this.accessDenied = true;
                    this.error = 'You do not have admin access. Please contact a system administrator.';
                } else {
                    this.error = err.error?.message || 'Failed to load dashboard';
                }
            }
        });
    }
    loadUsers(): void {
        this.usersLoading = true;
        this.advancedService.getAllUsers(this.page, 20, this.searchQuery).subscribe({
            next: (data) => {
                this.users = data.users;
                this.totalPages = data.pagination.pages;
                this.usersLoading = false;
            },
            error: (err) => {
                console.error('Failed to load users:', err);
                this.usersLoading = false;
            }
        });
    }
    searchUsers(): void {
        this.page = 1;
        this.loadUsers();
    }
    toggleUserStatus(user: AdminUser): void {
        this.advancedService.updateUser(user._id, { isActive: !user.isActive }).subscribe({
            next: () => {
                user.isActive = !user.isActive;
            },
            error: (err) => console.error('Failed to update user:', err)
        });
    }
    updateUserRole(user: AdminUser, role: string): void {
        this.advancedService.updateUser(user._id, { role }).subscribe({
            next: () => {
                user.role = role;
            },
            error: (err) => console.error('Failed to update role:', err)
        });
    }
    updateQuota(user: AdminUser, quotaGB: number): void {
        const quotaBytes = quotaGB * 1024 * 1024 * 1024;
        this.advancedService.setUserQuota(user._id, quotaBytes).subscribe({
            next: () => {
                user.storageQuota = quotaBytes;
            },
            error: (err) => console.error('Failed to update quota:', err)
        });
    }
    deleteUser(user: AdminUser): void {
        if (!confirm(`Delete user "${user.name}"? This will remove all their documents and folders.`)) return;
        this.advancedService.deleteUser(user._id).subscribe({
            next: () => {
                this.users = this.users.filter(u => u._id !== user._id);
            },
            error: (err) => console.error('Failed to delete user:', err)
        });
    }
    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    getStoragePercent(user: AdminUser): number {
        if (!user.storageQuota) return 0;
        return (user.storageUsed / user.storageQuota) * 100;
    }
    getRelativeTime(dateString: string | undefined): string {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    }
}
