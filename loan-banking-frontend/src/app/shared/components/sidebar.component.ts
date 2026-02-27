import { Component, inject, input, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export interface NavItem {
  icon: string;
  label: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <span class="logo-icon">⬡</span>
        <div>
          <div class="logo-title">LBS</div>
          <div class="logo-sub mono">{{ roleLabel() }}</div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        @for (item of navItems(); track item.route + item.label) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            class="nav-item"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- User info + logout -->
      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar">{{ avatarChar() }}</div>
          <div class="user-info">
            <div class="user-name">{{ auth.user()?.username }}</div>
            <div class="user-role mono">{{ auth.user()?.roles?.[0] ?? '' }}</div>
          </div>
        </div>
        <button class="logout-btn" (click)="auth.logout()" title="Cerrar sesión">
          <span>⏻</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      display: flex;
      flex-direction: column;
      background: var(--bg-surface);
      border-right: 1px solid var(--border-dim);
      height: 100vh;
      position: sticky;
      top: 0;
      width: 220px;
      flex-shrink: 0;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 20px;
      border-bottom: 1px solid var(--border-dim);
    }

    .logo-icon {
      font-size: 22px;
      color: var(--accent-bright);
      filter: drop-shadow(0 0 8px var(--accent-glow));
      flex-shrink: 0;
    }

    .logo-title { font-weight: 700; font-size: 15px; letter-spacing: 0.08em; color: var(--text-primary); }
    .logo-sub { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted); }

    .sidebar-nav {
      flex: 1;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 12px;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      transition: all var(--t-fast);
      border: 1px solid transparent;
    }

    .nav-item:hover {
      background: var(--bg-elevated);
      color: var(--text-secondary);
    }

    .nav-item.active {
      background: var(--accent-dim);
      color: var(--accent-bright);
      border-color: rgba(59,130,246,0.2);
    }

    .nav-icon { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--border-dim);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-card { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--accent-dim);
      border: 1px solid rgba(59,130,246,0.25);
      color: var(--accent-bright);
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-info { min-width: 0; }

    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); }

    .logout-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--t-fast);
      flex-shrink: 0;
    }

    .logout-btn:hover {
      background: var(--danger-dim);
      border-color: rgba(239,68,68,0.3);
      color: var(--danger);
    }
  `],
})
export class SidebarComponent {
  readonly auth = inject(AuthService);

  readonly navItems = input.required<NavItem[]>();
  readonly roleLabel = input<string>('');

  readonly avatarChar = computed(() =>
    (this.auth.user()?.username?.[0] ?? '?').toUpperCase()
  );
}