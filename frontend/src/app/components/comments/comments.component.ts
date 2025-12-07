import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdvancedService, Comment } from '../../services/advanced.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-comments',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './comments.component.html'
})
export class CommentsComponent implements OnInit, OnChanges {
    @Input() documentId: string = '';
    @Input() isVisible: boolean = false;

    comments: Comment[] = [];
    newComment: string = '';
    replyTo: Comment | null = null;
    editingComment: Comment | null = null;
    editContent: string = '';
    loading: boolean = false;
    submitting: boolean = false;
    currentUserId: string = '';

    constructor(
        private advancedService: AdvancedService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(user => {
            this.currentUserId = user?._id || '';
        });
    }

    ngOnChanges(): void {
        if (this.documentId && this.isVisible) {
            this.loadComments();
        }
    }

    loadComments(): void {
        this.loading = true;
        this.advancedService.getComments(this.documentId).subscribe({
            next: (comments) => {
                this.comments = comments;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load comments:', err);
                this.loading = false;
            }
        });
    }

    submitComment(): void {
        if (!this.newComment.trim()) return;

        this.submitting = true;
        const parentId = this.replyTo?._id;

        this.advancedService.addComment(this.documentId, this.newComment, parentId).subscribe({
            next: () => {
                this.newComment = '';
                this.replyTo = null;
                this.loadComments();
                this.submitting = false;
            },
            error: (err) => {
                console.error('Failed to add comment:', err);
                this.submitting = false;
            }
        });
    }

    startReply(comment: Comment): void {
        this.replyTo = comment;
        this.editingComment = null;
    }

    cancelReply(): void {
        this.replyTo = null;
    }

    startEdit(comment: Comment): void {
        this.editingComment = comment;
        this.editContent = comment.content;
        this.replyTo = null;
    }

    cancelEdit(): void {
        this.editingComment = null;
        this.editContent = '';
    }

    saveEdit(): void {
        if (!this.editingComment || !this.editContent.trim()) return;

        this.advancedService.updateComment(this.editingComment._id, this.editContent).subscribe({
            next: () => {
                this.editingComment = null;
                this.editContent = '';
                this.loadComments();
            },
            error: (err) => console.error('Failed to update comment:', err)
        });
    }

    deleteComment(comment: Comment): void {
        if (!confirm('Delete this comment?')) return;

        this.advancedService.deleteComment(comment._id).subscribe({
            next: () => this.loadComments(),
            error: (err) => console.error('Failed to delete comment:', err)
        });
    }

    getInitials(name: string): string {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
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

    isOwner(comment: Comment): boolean {
        return comment.user._id === this.currentUserId;
    }
}
