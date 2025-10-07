import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ShellComponent } from '../../../layout/shell/shell.component';

type Person = { name?: string; email?: string };
type Debt = {
  id: string;
  description: string;
  amount: number;
  status: 'PENDING' | 'PAID';
  debtor: Person;
  creditor: Person;
  createdAt: string;
};

const GET_DEBT = gql`
  query Debt($id: String!) {
    debt(id: $id) {
      id
      description
      amount
      status
      createdAt
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

const PAY_DEBT = gql`
  mutation PayDebt($id: String!) {
    payDebt(id: $id) {
      id
      status
    }
  }
`;

@Component({
  standalone: true,
  selector: 'app-debt-detail',
  imports: [
    CommonModule,
    ShellComponent,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './debt-detail.component.html',
  styleUrls: ['./debt-detail.component.css'],
})
export class DebtDetailComponent {
  private route = inject(ActivatedRoute);
  private apollo = inject(Apollo);
  private snack = inject(MatSnackBar);

  debt = signal<Debt | null>(null);
  loading = signal(true);
  paying = signal(false);

  private id = this.route.snapshot.paramMap.get('id') ?? '';

  ngOnInit() {
    this.load();
  }

  load() {
    if (!this.id) return;
    this.loading.set(true);
    this.apollo
      .query<{ debt: Debt }>({
        query: GET_DEBT,
        variables: { id: this.id },
        fetchPolicy: 'network-only',
      })
      .subscribe({
        next: (r) => {
          this.debt.set(r.data.debt);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snack.open('No se pudo cargar la deuda', 'Cerrar', {
            duration: 3000,
          });
        },
      });
  }

  markPaid() {
    if (!this.debt() || this.debt()!.status === 'PAID') return;
    this.paying.set(true);
    this.apollo
      .mutate({
        mutation: PAY_DEBT,
        variables: { id: this.debt()!.id },
      })
      .subscribe({
        next: () => {
          this.snack.open('Deuda marcada como pagada', 'OK', {
            duration: 2000,
          });
          this.load();
        },
        error: () => {
          this.snack.open('No se pudo actualizar', 'Cerrar', {
            duration: 3000,
          });
          this.paying.set(false);
        },
      });
  }
}
