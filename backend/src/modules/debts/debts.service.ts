import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { Debt, DebtStatus } from './entities/debt.entity';
import { CreateDebtInput } from './dto/create-debt.input';
import { UpdateDebtInput } from './dto/update-debt.input';
import { DebtsFilterArgs } from './dto/debts-filter.args';
import { DebtSummary } from './dto/debt-summary.type';
import { UsersService } from '../users/users.service';

@Injectable()
export class DebtsService {
  constructor(
    @InjectRepository(Debt)
    private debtsRepository: Repository<Debt>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private usersService: UsersService,
  ) {}

  async create(createDebtInput: CreateDebtInput): Promise<Debt> {
    if (createDebtInput.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a 0');
    }

    await this.usersService.findOne(createDebtInput.debtorId);
    await this.usersService.findOne(createDebtInput.creditorId);

    if (createDebtInput.debtorId === createDebtInput.creditorId) {
      throw new BadRequestException(
        'El deudor y el acreedor no pueden ser la misma persona',
      );
    }

    const debt = this.debtsRepository.create(createDebtInput);
    const savedDebt = await this.debtsRepository.save(debt);

    const debtWithRelations = await this.debtsRepository.findOne({
      where: { id: savedDebt.id },
      relations: ['debtor', 'creditor'],
    });

    if (!debtWithRelations) {
      throw new NotFoundException('Error al recuperar la deuda creada');
    }
    await this.invalidateCache();

    return debtWithRelations;
  }

  async findAll(filter?: DebtsFilterArgs): Promise<Debt[]> {
    const cacheKey = `debts:all:${JSON.stringify(filter || {})}`;
    const cached = await this.cacheManager.get<Debt[]>(cacheKey);

    /*if (cached) {
      return cached;
    }*/

    const queryBuilder = this.debtsRepository.createQueryBuilder('debt');

    if (filter?.debtorId) {
      queryBuilder.andWhere('debt.debtorId = :debtorId', {
        debtorId: filter.debtorId,
      });
    }

    if (filter?.creditorId) {
      queryBuilder.andWhere('debt.creditorId = :creditorId', {
        creditorId: filter.creditorId,
      });
    }

    if (filter?.status) {
      queryBuilder.andWhere('debt.status = :status', {
        status: filter.status,
      });
    }

    queryBuilder
      .leftJoinAndSelect('debt.debtor', 'debtor')
      .leftJoinAndSelect('debt.creditor', 'creditor')
      .orderBy('debt.createdAt', 'DESC');

    const debts = await queryBuilder.getMany();

    await this.cacheManager.set(cacheKey, debts, 300000); // 5 minutos

    return debts;
  }

  async findOne(id: string): Promise<Debt> {
    const cacheKey = `debt:${id}`;
    const cached = await this.cacheManager.get<Debt>(cacheKey);

    if (cached) {
      return cached;
    }

    const debt = await this.debtsRepository.findOne({
      where: { id },
      relations: ['debtor', 'creditor'],
    });

    if (!debt) {
      throw new NotFoundException(`Deuda con ID ${id} no encontrada`);
    }

    // Verificar que las relaciones se cargaron
    if (!debt.debtor || !debt.creditor) {
      throw new NotFoundException(
        `Error al cargar las relaciones de la deuda ${id}`,
      );
    }

    await this.cacheManager.set(cacheKey, debt, 300000);

    return debt;
  }

  async findByUser(userId: string, status?: DebtStatus): Promise<Debt[]> {
    const filter: DebtsFilterArgs = {};

    // Buscar deudas donde el usuario es deudor O acreedor
    const queryBuilder = this.debtsRepository.createQueryBuilder('debt');

    queryBuilder.where(
      '(debt.debtorId = :userId OR debt.creditorId = :userId)',
      { userId },
    );

    if (status) {
      queryBuilder.andWhere('debt.status = :status', { status });
    }

    queryBuilder
      .leftJoinAndSelect('debt.debtor', 'debtor')
      .leftJoinAndSelect('debt.creditor', 'creditor')
      .orderBy('debt.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  async update(id: string, updateDebtInput: UpdateDebtInput): Promise<Debt> {
    const debt = await this.findOne(id);

    // Validación: Una deuda pagada no puede ser modificada
    if (debt.status === DebtStatus.PAID) {
      throw new BadRequestException('No se puede modificar una deuda pagada');
    }

    // Validación: El monto no puede ser negativo
    if (updateDebtInput.amount !== undefined && updateDebtInput.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a 0');
    }

    // Si se cambian usuarios, validar que existan
    if (updateDebtInput.debtorId) {
      await this.usersService.findOne(updateDebtInput.debtorId);
    }

    if (updateDebtInput.creditorId) {
      await this.usersService.findOne(updateDebtInput.creditorId);
    }

    Object.assign(debt, updateDebtInput);

    await this.debtsRepository.save(debt);

    const updatedDebt = await this.debtsRepository.findOne({
      where: { id },
      relations: ['debtor', 'creditor'],
    });

    if (!updatedDebt) {
      throw new NotFoundException('Error al recuperar la deuda creada');
    }
    await this.invalidateCache();

    return updatedDebt;
  }

  async markAsPaid(id: string): Promise<Debt> {
    const debt = await this.findOne(id);

    if (debt.status === DebtStatus.PAID) {
      throw new BadRequestException('Esta deuda ya está marcada como pagada');
    }

    debt.status = DebtStatus.PAID;
    debt.paidAt = new Date();

    await this.debtsRepository.save(debt);

    const updatedDebt = await this.debtsRepository.findOne({
      where: { id },
      relations: ['debtor', 'creditor'],
    });

    if (!updatedDebt) {
      throw new NotFoundException('Error al recuperar la deuda creada');
    }
    await this.invalidateCache();

    return updatedDebt;
  }

  async remove(id: string): Promise<boolean> {
    const debt = await this.findOne(id);

    // Opcional: No permitir eliminar deudas pagadas
    if (debt.status === DebtStatus.PAID) {
      throw new BadRequestException('No se puede eliminar una deuda pagada');
    }

    await this.debtsRepository.remove(debt);

    // Invalidar caché
    await this.invalidateCache();

    return true;
  }

  async getSummary(userId: string): Promise<DebtSummary> {
    const cacheKey = `debt-summary:${userId}`;
    const cached = await this.cacheManager.get<DebtSummary>(cacheKey);

    if (cached) {
      return cached;
    }

    const allDebts = await this.findByUser(userId);

    const summary: DebtSummary = {
      totalDebts: allDebts.length,
      pendingDebts: 0,
      paidDebts: 0,
      totalAmount: 0,
      pendingAmount: 0,
      paidAmount: 0,
    };

    allDebts.forEach((debt) => {
      const amount = Number(debt.amount);
      summary.totalAmount += amount;

      if (debt.status === DebtStatus.PENDING) {
        summary.pendingDebts++;
        summary.pendingAmount += amount;
      } else {
        summary.paidDebts++;
        summary.paidAmount += amount;
      }
    });

    await this.cacheManager.set(cacheKey, summary, 300000);

    return summary;
  }

  private async invalidateCache(): Promise<void> {
    const keys = ['debts:all', 'debt:', 'debt-summary:'];
    await this.cacheManager.reset();
  }
}
