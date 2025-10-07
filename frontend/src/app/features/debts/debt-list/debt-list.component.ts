import { Component, effect, signal } from '@angular/core';
import { Apollo, gql, QueryRef } from 'apollo-angular';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  RouterLink,
  Router,
  NavigationEnd,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ShellComponent } from '../../../layout/shell/shell.component';
import { ExportService } from '../../../core/services/export.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

type DebtStatus = 'PENDING' | 'PAID';

const LIST_DEBTS = gql`
  query Debts($status: DebtStatus) {
    debts(status: $status) {
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
      createdAt
    }
  }
`;

@Component({
  standalone: true,
  selector: 'app-debt-list',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonToggleModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ShellComponent,
  ],
  templateUrl: './debt-list.component.html',
  styleUrls: ['./debt-list.component.css'],
})
export class DebtListComponent {
  exporting = signal<'csv' | 'json' | null>(null);
  status = signal<DebtStatus | null>(null);
  debts = signal<any[]>([]);
  private ref!: QueryRef<any, any>;

  constructor(
    private apollo: Apollo,
    private route: ActivatedRoute,
    private router: Router,
    private exporter: ExportService
  ) {
    const initial = this.route.snapshot.data['debtStatus'] as
      | DebtStatus
      | undefined;
    this.status.set(initial ?? null);

    this.ref = this.apollo.watchQuery({
      query: LIST_DEBTS,
      variables: { status: this.status() },
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
    });

    this.ref.valueChanges.subscribe((r: any) =>
      this.debts.set(r.data?.debts ?? [])
    );

    effect(() => {
      this.ref.refetch({ status: this.status() });
    });

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        startWith(null),
        map(
          () => this.route.snapshot.data['debtStatus'] as DebtStatus | undefined
        )
      )
      .subscribe((s) => this.status.set(s ?? null));
  }

  setStatus(v: '' | DebtStatus) {
    this.status.set(v ? v : null);
  }

  exportCsv() {
    this.exporting.set('csv');
    this.exporter.downloadDebts('csv', this.currentParams());
    setTimeout(() => this.exporting.set(null), 400);
  }

  exportJson() {
    this.exporting.set('json');
    this.exporter.downloadDebts('json', this.currentParams());
    setTimeout(() => this.exporting.set(null), 400);
  }

  private currentParams() {
    const s = this.status();
    return s ? { status: s } : {};
  }
}
