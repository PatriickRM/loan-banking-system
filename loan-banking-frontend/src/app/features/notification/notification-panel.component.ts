import { Component, inject, signal, output, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { Notification, NotificationType } from '../../core/models/loan.models';

@Component({
  selector: 'app-notification-panel',
  imports: [DatePipe],
  template: `
    <div class="notif-backdrop" (click)="closed.emit()">
      <div class="notif-panel" (click)="$event.stopPropagation()">

        <div class="notif-header">
          <div class="notif-title-row">
            <h3 class="notif-title">Notificaciones</h3>
            @if (unreadCount() > 0) {
              <span class="notif-count mono">{{ unreadCount() }}</span>
            }
          </div>
          <button class="close-btn" (click)="closed.emit()">✕</button>
        </div>

        <!-- Filter tabs -->
        <div class="filter-tabs">
          <button class="tab" [class.active]="filter() === 'all'" (click)="filter.set('all')">Todas</button>
          <button class="tab" [class.active]="filter() === 'loans'" (click)="filter.set('loans')">Préstamos</button>
          <button class="tab" [class.active]="filter() === 'payments'" (click)="filter.set('payments')">Pagos</button>
        </div>

        <div class="notif-list">
          @if (loading()) {
            @for (i of [1,2,3,4]; track i) {
              <div class="notif-skeleton">
                <div class="sk-icon"></div>
                <div class="sk-content">
                  <div class="sk-line sk-line-short"></div>
                  <div class="sk-line sk-line-long"></div>
                  <div class="sk-line sk-line-xs"></div>
                </div>
              </div>
            }
          } @else if (filtered().length === 0) {
            <div class="empty-notifs">
              <div class="empty-icon">◎</div>
              <p>Sin notificaciones</p>
            </div>
          } @else {
            @for (notif of filtered(); track notif.id) {
              <div class="notif-item" [class.failed]="notif.status === 'FAILED'">
                <div class="notif-icon" [class]="iconClass(notif.type)">
                  {{ notifIcon(notif.type) }}
                </div>
                <div class="notif-content">
                  <div class="notif-subject">{{ notifTitle(notif.type) }}</div>
                  <div class="notif-meta mono">
                    <span class="notif-date">{{ notif.sentDate ?? notif.createdAt | date:'dd MMM · HH:mm' }}</span>
                    <span class="notif-status" [class]="'ns-' + notif.status.toLowerCase()">
                      {{ notif.status }}
                    </span>
                  </div>
                  @if (notif.metadata) {
                    <div class="notif-detail">
                      {{ notifDetail(notif.type, notif.metadata) }}
                    </div>
                  }
                </div>
              </div>
            }
          }
        </div>

        <div class="notif-footer">
          <button class="mark-all-btn" (click)="markAllRead()">Marcar todas como leídas</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notif-backdrop {
      position: fixed;
      inset: 0;
      z-index: 200;
    }

    .notif-panel {
      position: absolute;
      top: 64px;
      right: 24px;
      width: 380px;
      max-height: 520px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0,0,0,0.5);
      animation: dropIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-12px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 20px 14px;
      border-bottom: 1px solid var(--border-dim);
    }

    .notif-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .notif-title { font-size: 15px; font-weight: 700; }

    .notif-count {
      background: var(--accent);
      color: #fff;
      font-size: 11px;
      padding: 1px 7px;
      border-radius: 100px;
      min-width: 20px;
      text-align: center;
    }

    .close-btn {
      background: none;
      border: 1px solid var(--border-dim);
      color: var(--text-muted);
      border-radius: var(--radius-sm);
      width: 28px;
      height: 28px;
      cursor: pointer;
      font-size: 12px;
      transition: all var(--t-fast);
    }
    .close-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }

    /* Tabs */
    .filter-tabs {
      display: flex;
      gap: 4px;
      padding: 10px 20px;
      border-bottom: 1px solid var(--border-dim);
    }

    .tab {
      padding: 4px 12px;
      border-radius: 100px;
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 11px;
      cursor: pointer;
      transition: all var(--t-fast);
    }

    .tab.active {
      background: var(--accent-dim);
      border-color: rgba(59,130,246,0.25);
      color: var(--accent-bright);
    }

    /* List */
    .notif-list {
      flex: 1;
      overflow-y: auto;
    }

    .notif-item {
      display: flex;
      gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border-dim);
      transition: background var(--t-fast);
      cursor: default;
    }

    .notif-item:hover { background: var(--bg-elevated); }
    .notif-item.failed { opacity: 0.5; }

    .notif-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }

    .icon-loan     { background: var(--accent-dim); }
    .icon-success  { background: var(--success-dim); }
    .icon-danger   { background: var(--danger-dim); }
    .icon-warning  { background: var(--warning-dim); }
    .icon-info     { background: rgba(148,163,184,0.1); }

    .notif-content { flex: 1; min-width: 0; }
    .notif-subject { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }

    .notif-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 11px;
      margin-bottom: 4px;
    }

    .notif-date { color: var(--text-muted); }

    .notif-status {
      padding: 1px 6px;
      border-radius: 100px;
      font-size: 10px;
      letter-spacing: 0.06em;
    }

    .ns-sent    { background: var(--success-dim); color: var(--success); }
    .ns-failed  { background: var(--danger-dim); color: var(--danger); }
    .ns-pending { background: var(--warning-dim); color: var(--warning); }
    .ns-retry   { background: var(--warning-dim); color: var(--warning); }

    .notif-detail {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Skeleton */
    .notif-skeleton {
      display: flex;
      gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border-dim);
    }

    .sk-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      animation: shimmer 1.2s infinite;
      flex-shrink: 0;
    }

    .sk-content { flex: 1; display: flex; flex-direction: column; gap: 6px; justify-content: center; }

    .sk-line {
      height: 10px;
      border-radius: 4px;
      background: var(--bg-elevated);
      animation: shimmer 1.2s infinite;
    }

    .sk-line-short { width: 40%; }
    .sk-line-long  { width: 75%; }
    .sk-line-xs    { width: 28%; height: 8px; }

    @keyframes shimmer {
      0%, 100% { opacity: 0.4; }
      50%       { opacity: 0.8; }
    }

    /* Empty */
    .empty-notifs {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 48px 20px;
      color: var(--text-muted);
      font-size: 14px;
    }

    .empty-icon { font-size: 28px; opacity: 0.3; }

    /* Footer */
    .notif-footer {
      padding: 12px 20px;
      border-top: 1px solid var(--border-dim);
    }

    .mark-all-btn {
      background: none;
      border: none;
      color: var(--accent-bright);
      font-family: var(--font-mono);
      font-size: 11px;
      cursor: pointer;
      padding: 0;
      transition: opacity var(--t-fast);
    }

    .mark-all-btn:hover { opacity: 0.7; }
  `],
})
export class NotificationPanelComponent implements OnInit {
  private readonly notifService = inject(NotificationService);
  private readonly authService = inject(AuthService);

  readonly closed = output<void>();

  readonly loading = signal(true);
  readonly filter = signal<'all' | 'loans' | 'payments'>('all');
  readonly unreadCount = this.notifService.unreadCount;

  private allNotifications = signal<Notification[]>([]);

  filtered() {
    const f = this.filter();
    const all = this.allNotifications();
    if (f === 'loans') {
      return all.filter((n) =>
        ['LOAN_APPLICATION_RECEIVED', 'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_DISBURSED'].includes(n.type)
      );
    }
    if (f === 'payments') {
      return all.filter((n) =>
        ['PAYMENT_RECEIVED', 'PAYMENT_REMINDER', 'PAYMENT_OVERDUE'].includes(n.type)
      );
    }
    return all;
  }

  ngOnInit(): void {
    const user = this.authService.user();
    if (!user?.customerId) {
      this.loading.set(false);
      return;
    }

    this.notifService.getNotificationsByUser(user.customerId).subscribe({
      next: (notifs) => {
        this.allNotifications.set(notifs.slice().reverse()); // newest first
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  markAllRead(): void {
    this.notifService.markAllRead();
  }

  notifIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      LOAN_APPLICATION_RECEIVED: '📋',
      LOAN_APPROVED: '✅',
      LOAN_REJECTED: '❌',
      LOAN_DISBURSED: '💰',
      PAYMENT_RECEIVED: '✓',
      PAYMENT_REMINDER: '⏰',
      PAYMENT_OVERDUE: '⚠',
      EVALUATION_COMPLETED: '◈',
    };
    return icons[type] ?? '◦';
  }

  iconClass(type: NotificationType): string {
    if (['LOAN_APPROVED', 'PAYMENT_RECEIVED'].includes(type)) return 'notif-icon icon-success';
    if (['LOAN_REJECTED', 'PAYMENT_OVERDUE'].includes(type)) return 'notif-icon icon-danger';
    if (['PAYMENT_REMINDER'].includes(type)) return 'notif-icon icon-warning';
    if (['LOAN_DISBURSED', 'EVALUATION_COMPLETED'].includes(type)) return 'notif-icon icon-loan';
    return 'notif-icon icon-info';
  }

  notifTitle(type: NotificationType): string {
    const titles: Record<NotificationType, string> = {
      LOAN_APPLICATION_RECEIVED: 'Solicitud recibida',
      LOAN_APPROVED: 'Préstamo aprobado',
      LOAN_REJECTED: 'Solicitud rechazada',
      LOAN_DISBURSED: 'Préstamo desembolsado',
      PAYMENT_RECEIVED: 'Pago recibido',
      PAYMENT_REMINDER: 'Recordatorio de pago',
      PAYMENT_OVERDUE: 'Pago vencido',
      EVALUATION_COMPLETED: 'Evaluación completada',
    };
    return titles[type] ?? type;
  }

  notifDetail(type: NotificationType, meta: Record<string, unknown>): string {
    if (type === 'LOAN_APPLICATION_RECEIVED') return `Préstamo #${meta['loanId']} · S/ ${meta['amount']}`;
    if (type === 'LOAN_APPROVED') return `Monto aprobado: S/ ${meta['approvedAmount']}`;
    if (type === 'LOAN_REJECTED') return `Motivo: ${meta['rejectionReason']}`;
    if (type === 'LOAN_DISBURSED') return `S/ ${meta['totalAmount']} · ${meta['termMonths']} meses`;
    if (type === 'PAYMENT_RECEIVED') return `S/ ${meta['amount']} · Cuota #${meta['installmentNumber']}`;
    if (type === 'PAYMENT_OVERDUE') return `Cuota #${meta['installmentNumber']} · ${meta['daysOverdue']} días de atraso`;
    return '';
  }
}