// src/app/pages/auth/login.component.ts
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(loginInput: { email: $email, password: $password }) {
      accessToken
      user {
        id
        email
        name
      }
    }
  }
`;
const REGISTER = gql`
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(
      registerInput: { name: $name, email: $email, password: $password }
    ) {
      accessToken
      user {
        id
        email
        name
      }
    }
  }
`;

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  hidePwdLogin = signal(true);
  hidePwdRegister = signal(true);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  registerForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor(private apollo: Apollo, private router: Router) {}

  doLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.apollo
      .mutate({ mutation: LOGIN, variables: this.loginForm.value })
      .subscribe({
        next: (res: any) => {
          localStorage.setItem('token', res?.data?.login?.accessToken);
          localStorage.setItem('user', JSON.stringify(res?.data?.login?.user));
          this.router.navigateByUrl('/deudas');
        },
        error: (e) => {
          this.snack.open('No fue posible iniciar sesión', 'Cerrar', {
            duration: 3000,
          });
          this.loading.set(false);
        },
      });
  }

  doRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.apollo
      .mutate({ mutation: REGISTER, variables: this.registerForm.value })
      .subscribe({
        next: (res: any) => {
          localStorage.setItem('token', res?.data?.register?.accessToken);
          localStorage.setItem(
            'user',
            JSON.stringify(res?.data?.register?.user)
          );
          this.router.navigateByUrl('/deudas');
        },
        error: () => {
          this.snack.open('No fue posible crear la cuenta', 'Cerrar', {
            duration: 3000,
          });
          this.loading.set(false);
        },
      });
  }
}
