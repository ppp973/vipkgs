import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
// Fix: Use modern import path for catchError
import { catchError } from 'rxjs';
import { Course, Subject, Lesson } from '../types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Fix: Add explicit HttpClient type to resolve an issue where it was inferred as 'unknown'.
  private http: HttpClient = inject(HttpClient);
  private PROXY_URL = "https://api.codetabs.com/v1/proxy/?quest=";
  private TARGET_API = "https://kgs-main-api-scamer.vercel.app";

  private fetchData<T>(endpoint: string): Observable<T | null> {
    const url = this.PROXY_URL + this.TARGET_API + endpoint;
    return this.http.get<T>(url).pipe(
      catchError(err => {
        console.error(`Failed to fetch ${endpoint}`, err);
        return of(null);
      })
    );
  }

  getCourses(): Observable<{courses: Course[]} | null> {
    return this.fetchData<{courses: Course[]}>('/get-courses');
  }

  getSubjects(courseId: number): Observable<Subject[] | null> {
    return this.fetchData<Subject[]>(`/subjects/${courseId}.0`);
  }

  getLessons(subjectId: number): Observable<Lesson[] | null> {
    return this.fetchData<Lesson[]>(`/lessons/${subjectId}.0`);
  }
}
