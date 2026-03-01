import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CustomerSummary {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  country: string;
  monthlyIncome: number;
  workExperienceYears: number;
  occupation: string;
  employerName: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/customers`;

  getByDni(dni: string): Observable<CustomerSummary> {
    return this.http.get<CustomerSummary>(`${this.base}/dni/${dni}`);
  }

  getById(id: number): Observable<CustomerSummary> {
    return this.http.get<CustomerSummary>(`${this.base}/${id}`);
  }

  getAll(): Observable<CustomerSummary[]> {
    return this.http.get<CustomerSummary[]>(this.base);
  }
}
