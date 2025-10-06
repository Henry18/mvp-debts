import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { DebtsService } from './debts.service';
import { DebtStatus } from './entities/debt.entity';

@Controller('debts')
@UseGuards(JwtAuthGuard)
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get('export/json')
  async exportJson(
    @CurrentUser() user: User,
    @Query('status') status?: DebtStatus,
    @Res() res?: Response,
  ) {
    const debts = await this.debtsService.findByUser(user.id, status);

    const exportData = debts.map((debt) => ({
      id: debt.id,
      descripcion: debt.description,
      monto: Number(debt.amount),
      estado: debt.status,
      deudor: {
        id: debt.debtor.id,
        nombre: debt.debtor.name,
        email: debt.debtor.email,
      },
      acreedor: {
        id: debt.creditor.id,
        nombre: debt.creditor.name,
        email: debt.creditor.email,
      },
      fechaCreacion: debt.createdAt,
      fechaPago: debt.paidAt || null,
    }));

    const fileName = `deudas_${user.id}_${Date.now()}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    return res.status(HttpStatus.OK).json(exportData);
  }

  @Get('export/csv')
  async exportCsv(
    @CurrentUser() user: User,
    @Query('status') status?: DebtStatus,
    @Res() res?: Response,
  ) {
    const debts = await this.debtsService.findByUser(user.id, status);

    const csvHeader = [
      'ID',
      'Descripción',
      'Monto',
      'Estado',
      'Deudor',
      'Email Deudor',
      'Acreedor',
      'Email Acreedor',
      'Fecha Creación',
      'Fecha Pago',
    ].join(',');

    const csvRows = debts.map((debt) => {
      return [
        debt.id,
        `"${debt.description.replace(/"/g, '""')}"`,
        debt.amount,
        debt.status,
        `"${debt.debtor.name}"`,
        debt.debtor.email,
        `"${debt.creditor.name}"`,
        debt.creditor.email,
        debt.createdAt.toISOString(),
        debt.paidAt ? debt.paidAt.toISOString() : '',
      ].join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');

    const fileName = `deudas_${user.id}_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    return res.status(HttpStatus.OK).send('\uFEFF' + csvContent);
  }

  @Get('export/summary')
  async exportSummary(@CurrentUser() user: User, @Res() res?: Response) {
    const summary = await this.debtsService.getSummary(user.id);
    const debtsIOwed = await this.debtsService.findAll({ debtorId: user.id });
    const debtsOwedToMe = await this.debtsService.findAll({
      creditorId: user.id,
    });

    const exportData = {
      usuario: {
        id: user.id,
        nombre: user.name,
        email: user.email,
      },
      resumen: {
        totalDeudas: summary.totalDebts,
        deudasPendientes: summary.pendingDebts,
        deudasPagadas: summary.paidDebts,
        montoTotal: summary.totalAmount,
        montoPendiente: summary.pendingAmount,
        montoPagado: summary.paidAmount,
      },
      deudasQueDebo: {
        total: debtsIOwed.length,
        pendientes: debtsIOwed.filter((d) => d.status === DebtStatus.PENDING)
          .length,
        montoPendiente: debtsIOwed
          .filter((d) => d.status === DebtStatus.PENDING)
          .reduce((sum, d) => sum + Number(d.amount), 0),
      },
      deudasQueMeDeben: {
        total: debtsOwedToMe.length,
        pendientes: debtsOwedToMe.filter((d) => d.status === DebtStatus.PENDING)
          .length,
        montoPendiente: debtsOwedToMe
          .filter((d) => d.status === DebtStatus.PENDING)
          .reduce((sum, d) => sum + Number(d.amount), 0),
      },
      fechaGeneracion: new Date().toISOString(),
    };

    const fileName = `resumen_deudas_${user.id}_${Date.now()}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    return res.status(HttpStatus.OK).json(exportData);
  }
}
