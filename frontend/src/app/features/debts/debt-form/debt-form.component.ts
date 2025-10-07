import { Component, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ShellComponent } from '../../../layout/shell/shell.component';

const CREATE_DEBT = gql`
  mutation CreateDebt($createDebtInput: CreateDebtInput!) {
    createDebt(createDebtInput: $createDebtInput) {
      id
      description
      amount
      status
      debtor {
        name
        email
      }
      creditor {
        name
        email
      }
    }
  }
`;

@Component({
  standalone: true,
  selector: 'app-debt-form',
  imports: [
    CommonModule,
    ShellComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
  ],
  templateUrl: './debt-form.component.html',
  styleUrls: ['./debt-form.component.css'],
})
export class DebtFormComponent {
  private fb = inject(FormBuilder);
  private apollo = inject(Apollo);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  loading = signal(false);

  form = this.fb.group({
    description: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    creditorId: ['', Validators.required],
  });

  private getDebtorId(): string | null {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const u = JSON.parse(raw);
      return u?.id ?? null;
    } catch {
      return null;
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const debtorId = this.getDebtorId();
    if (!debtorId) {
      this.snack.open('No se encontró el usuario actual', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const { description, amount, creditorId } = this.form.value;
    const createDebtInput = {
      description: (description ?? '').trim(),
      amount: Number(amount ?? 0),
      debtorId,
      creditorId: creditorId!,
    };

    this.loading.set(true);
    this.apollo
      .mutate({
        mutation: CREATE_DEBT,
        variables: { createDebtInput },
      })
      .subscribe({
        next: (r: any) => {
          const id = r?.data?.createDebt?.id;
          this.snack.open('Deuda creada', 'OK', { duration: 2000 });
          this.loading.set(false);
          if (id) this.router.navigate(['/deudas', id]);
        },
        error: () => {
          this.snack.open('No fue posible crear la deuda', 'Cerrar', {
            duration: 3000,
          });
          this.loading.set(false);
        },
      });
  }
}
