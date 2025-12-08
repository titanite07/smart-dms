import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdvancedService, ActivityLog } from '../../services/advanced.service';
@Component({
    selector: 'app-activity-log',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './activity-log.component.html'
})
export class ActivityLogComponent implements OnInit {
    activities: ActivityLog[] = [];
    loading: boolean = true;
    page: number = 1;
    totalPages: number = 1;
    stats: any = null;
    constructor(private advancedService: AdvancedService) { }
    ngOnInit(): void {
        this.loadActivities();
        this.loadStats();
    }
    loadActivities(): void {
        this.loading = true;
        this.advancedService.getActivityLog(this.page, 30).subscribe({
            next: (data) => {
                this.activities = data.activities;
                this.totalPages = data.pagination.pages;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load activities:', err);
                this.loading = false;
            }
        });
    }
    loadStats(): void {
        this.advancedService.getActivityStats().subscribe({
            next: (data) => {
                this.stats = data;
            },
            error: (err) => console.error('Failed to load stats:', err)
        });
    }
    nextPage(): void {
        if (this.page < this.totalPages) {
            this.page++;
            this.loadActivities();
        }
    }
    prevPage(): void {
        if (this.page > 1) {
            this.page--;
            this.loadActivities();
        }
    }
    getActionIcon(action: string): string {
        const icons: { [key: string]: string } = {
            'upload': 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-8-8l-4 4m0 0l4 4m-4-4h12',
            'download': 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
            'delete': 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
            'restore': 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
            'share': 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
            'view': 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
            'star': 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
            'comment_add': 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
            'login': 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
            'folder_create': 'M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z'
        };
        return icons[action] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
    getActionColor(action: string): string {
        const colors: { [key: string]: string } = {
            'upload': 'text-green-500 bg-green-100 dark:bg-green-900/20',
            'download': 'text-blue-500 bg-blue-100 dark:bg-blue-900/20',
            'delete': 'text-red-500 bg-red-100 dark:bg-red-900/20',
            'permanent_delete': 'text-red-600 bg-red-100 dark:bg-red-900/20',
            'restore': 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20',
            'share': 'text-purple-500 bg-purple-100 dark:bg-purple-900/20',
            'view': 'text-gray-500 bg-gray-100 dark:bg-gray-900/20',
            'star': 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20',
            'comment_add': 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/20',
            'login': 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/20',
            'folder_create': 'text-amber-500 bg-amber-100 dark:bg-amber-900/20'
        };
        return colors[action] || 'text-zinc-500 bg-zinc-100 dark:bg-zinc-900/20';
    }
    formatAction(action: string): string {
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    getRelativeTime(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }
}
