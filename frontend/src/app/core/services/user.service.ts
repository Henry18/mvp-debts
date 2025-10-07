import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

export interface CurrentUser {
  id: string;
  name?: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  user = signal<CurrentUser | null>(null);

  constructor() {
    this.refreshFromStorage();

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('storage', (e) => {
        if (e.key === 'user' || e.key === 'token') this.refreshFromStorage();
      });
    }
  }

  refreshFromStorage() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const raw = localStorage.getItem('user');
      if (!raw) {
        this.user.set(null);
        return;
      }
      const u = JSON.parse(raw) as Partial<CurrentUser>;
      if (u && typeof u.id === 'string' && u.id.trim()) {
        this.user.set({ id: u.id, name: u.name, email: u.email });
      } else {
        this.user.set(null);
      }
    } catch {
      this.user.set(null);
    }
  }

  setUser(u: CurrentUser) {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('user', JSON.stringify(u));
    this.user.set(u);
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.user.set(null);
    this.router.navigateByUrl('/login');
  }
}
