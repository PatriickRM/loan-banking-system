import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notification } from '../models/loan.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/notifications`;

  // Reactive unread count for the bell icon
  private readonly _unreadCount = signal(0);
  readonly unreadCount = this._unreadCount.asReadonly();

  private readonly _notifications = signal<Notification[]>([]);
  readonly notifications = this._notifications.asReadonly();

  getNotificationsByUser(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.base}/user/${userId}`).pipe(
      tap((notifs) => {
        this._notifications.set(notifs);
        // Count SENT notifications from last 7 days as "unread" (no read field in backend)
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const recent = notifs.filter(
          (n) => n.status === 'SENT' && new Date(n.createdAt) > cutoff
        );
        this._unreadCount.set(recent.length);
      })
    );
  }

  getAllNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.base);
  }

  // Clear the unread badge locally
  markAllRead(): void {
    this._unreadCount.set(0);
  }
}