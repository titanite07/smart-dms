import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  features = [
    {
      title: 'Secure Storage',
      description: 'Enterprise-grade security with AES-256 encryption, JWT authentication, and role-based access control.',
      icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
      gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
    },
    {
      title: 'Version Control',
      description: 'Never lose track of changes. Automatic version history with instant rollback to any previous state.',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
    },
    {
      title: 'Smart Sharing',
      description: 'Share documents instantly with granular permissions. Generate public links with password protection.',
      icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
      gradient: 'linear-gradient(135deg, #EC4899, #BE185D)'
    },
    {
      title: 'Real-time Comments',
      description: 'Collaborate with your team through threaded comments and @mentions on any document.',
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      gradient: 'linear-gradient(135deg, #10B981, #047857)'
    },
    {
      title: 'Activity Tracking',
      description: 'Complete audit trail of all actions. Know who did what and when with detailed activity logs.',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      gradient: 'linear-gradient(135deg, #F59E0B, #D97706)'
    },
    {
      title: 'Admin Dashboard',
      description: 'Powerful admin controls with user management, storage quotas, and system-wide analytics.',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      gradient: 'linear-gradient(135deg, #6366F1, #4338CA)'
    }
  ];
  steps = [
    {
      title: 'Create Your Account',
      description: 'Sign up in seconds with your email. No credit card required to get started with our free tier.'
    },
    {
      title: 'Upload Your Documents',
      description: 'Drag and drop your files or folders. We support all major formats including PDF, Word, Excel, and images.'
    },
    {
      title: 'Collaborate & Share',
      description: 'Invite team members, set permissions, and start collaborating in real-time with version control.'
    }
  ];
}
