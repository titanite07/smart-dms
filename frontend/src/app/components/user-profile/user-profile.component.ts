import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit {
  user: any = null;
  isLoading = true;
  activeTab: 'profile' | 'security' | 'danger' = 'profile';
  profileForm = {
    name: '',
    email: ''
  };
  securityForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  deleteForm = {
    password: '',
    confirmText: ''
  };
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  showDeletePassword = false;
  isUpdating = false;
  isDeleting = false;
  updateMessage = '';
  updateError = '';
  deleteError = '';
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }
  ngOnInit(): void {
    this.loadProfile();
  }
  loadProfile(): void {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.user = profile;
        this.profileForm.name = profile.name;
        this.profileForm.email = profile.email;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.isLoading = false;
      }
    });
  }
  setTab(tab: 'profile' | 'security' | 'danger'): void {
    this.activeTab = tab;
    this.clearMessages();
  }
  clearMessages(): void {
    this.updateMessage = '';
    this.updateError = '';
    this.deleteError = '';
  }
  updateProfile(): void {
    this.clearMessages();
    this.isUpdating = true;
    const updateData: any = {};
    if (this.profileForm.name !== this.user.name) {
      updateData.name = this.profileForm.name;
    }
    if (this.profileForm.email !== this.user.email) {
      updateData.email = this.profileForm.email;
    }
    if (Object.keys(updateData).length === 0) {
      this.updateError = 'No changes to save';
      this.isUpdating = false;
      return;
    }
    this.authService.updateProfile(updateData).subscribe({
      next: (response) => {
        this.user = { ...this.user, ...response };
        this.updateMessage = 'Profile updated successfully!';
        this.isUpdating = false;
      },
      error: (error) => {
        this.updateError = error.error?.message || 'Failed to update profile';
        this.isUpdating = false;
      }
    });
  }
  updatePassword(): void {
    this.clearMessages();
    if (this.securityForm.newPassword !== this.securityForm.confirmPassword) {
      this.updateError = 'New passwords do not match';
      return;
    }
    if (!this.securityForm.currentPassword || !this.securityForm.newPassword) {
      this.updateError = 'Please fill in all password fields';
      return;
    }
    this.isUpdating = true;
    this.authService.updateProfile({
      currentPassword: this.securityForm.currentPassword,
      newPassword: this.securityForm.newPassword
    }).subscribe({
      next: () => {
        this.updateMessage = 'Password updated successfully!';
        this.securityForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.isUpdating = false;
      },
      error: (error) => {
        this.updateError = error.error?.message || 'Failed to update password';
        this.isUpdating = false;
      }
    });
  }
  deleteAccount(): void {
    if (this.deleteForm.confirmText !== 'DELETE') {
      this.deleteError = 'Please type DELETE to confirm';
      return;
    }
    this.isDeleting = true;
    this.deleteError = '';
    this.authService.deleteAccount(this.deleteForm.password).subscribe({
      next: () => {
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.deleteError = error.error?.message || 'Failed to delete account';
        this.isDeleting = false;
      }
    });
  }
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
  getInitials(): string {
    if (!this.user?.name) return '?';
    return this.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
