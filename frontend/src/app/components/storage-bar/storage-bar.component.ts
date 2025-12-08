import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdvancedService, StorageUsage } from '../../services/advanced.service';
@Component({
    selector: 'app-storage-bar',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div *ngIf="storage" class="p-4 bg-zinc-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-zinc-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                    </svg>
                    <span class="text-sm font-medium text-zinc-700 dark:text-slate-300">Storage</span>
                </div>
                <span class="text-xs text-zinc-500 dark:text-slate-400">{{ storage.usagePercent }}% used</span>
            </div>
            <div class="w-full h-2 bg-zinc-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                    [style.width.%]="storage.usagePercent"
                    [class.bg-gradient-to-r]="true"
                    [class.from-green-400]="getUsagePercent() < 70"
                    [class.to-emerald-500]="getUsagePercent() < 70"
                    [class.from-amber-400]="getUsagePercent() >= 70 && getUsagePercent() < 90"
                    [class.to-orange-500]="getUsagePercent() >= 70 && getUsagePercent() < 90"
                    [class.from-red-400]="getUsagePercent() >= 90"
                    [class.to-red-600]="getUsagePercent() >= 90">
                </div>
            </div>
            <div class="flex justify-between mt-2 text-xs text-zinc-500 dark:text-slate-400">
                <span>{{ formatBytes(storage.used) }} of {{ formatBytes(storage.quota) }}</span>
                <span>{{ storage.documentCount }} files</span>
            </div>
        </div>
    `
})
export class StorageBarComponent implements OnInit {
    storage: StorageUsage | null = null;
    constructor(private advancedService: AdvancedService) { }
    ngOnInit(): void {
        this.loadStorage();
    }
    loadStorage(): void {
        this.advancedService.getStorageUsage().subscribe({
            next: (data) => {
                this.storage = data;
            },
            error: (err) => console.error('Failed to load storage:', err)
        });
    }
    getUsagePercent(): number {
        return parseFloat(this.storage?.usagePercent || '0');
    }
    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
