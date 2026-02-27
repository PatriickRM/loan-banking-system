import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';


export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isApiRequest = req.url.startsWith(environment.apiUrl);
  const isPublicRoute = PUBLIC_ROUTES.some((route) => req.url.includes(route));

  let outgoingReq = req;

  if (isApiRequest && !isPublicRoute) {
    const token = authService.getToken();
    if (token) {
      outgoingReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }

  return next(outgoingReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
      }
      if (error.status === 403) {

        authService.redirectToDashboard();
      }
      return throwError(() => error);
    })
  );
};


const PUBLIC_ROUTES: string[] = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify',
  '/api/auth/resend-verification',
  '/actuator/',
];