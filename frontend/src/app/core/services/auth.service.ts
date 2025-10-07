import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
} from '../models/user.model';
import { Router } from '@angular/router';

const LOGIN_MUTATION = gql`
  mutation Login($loginInput: LoginInput!) {
    login(loginInput: $loginInput) {
      accessToken
      user {
        id
        email
        name
        phone
        isActive
        createdAt
      }
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($registerInput: CreateUserInput!) {
    register(registerInput: $registerInput) {
      accessToken
      user {
        id
        email
        name
        phone
        isActive
        createdAt
      }
    }
  }
`;

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
      phone
      isActive
      createdAt
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private apollo: Apollo, private router: Router) {
    this.loadCurrentUser();
  }

  login(input: LoginInput): Observable<AuthResponse> {
    return this.apollo
      .mutate<{ login: AuthResponse }>({
        mutation: LOGIN_MUTATION,
        variables: { loginInput: input },
      })
      .pipe(
        map((result) => result.data!.login),
        tap((response) => {
          this.setSession(response);
        })
      );
  }

  register(input: RegisterInput): Observable<AuthResponse> {
    return this.apollo
      .mutate<{ register: AuthResponse }>({
        mutation: REGISTER_MUTATION,
        variables: { registerInput: input },
      })
      .pipe(
        map((result) => result.data!.register),
        tap((response) => {
          this.setSession(response);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.apollo.client.clearStore();
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private setSession(authResponse: AuthResponse): void {
    localStorage.setItem('token', authResponse.accessToken);
    this.currentUserSubject.next(authResponse.user);
  }

  private loadCurrentUser(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.apollo
      .query<{ me: User }>({
        query: ME_QUERY,
      })
      .subscribe({
        next: (result) => {
          this.currentUserSubject.next(result.data.me);
        },
        error: () => {
          this.logout();
        },
      });
  }
}
