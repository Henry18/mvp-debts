import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { DebtsService } from './debts.service';
import { Debt, DebtStatus } from './entities/debt.entity';
import { CreateDebtInput } from './dto/create-debt.input';
import { UpdateDebtInput } from './dto/update-debt.input';
import { DebtsFilterArgs } from './dto/debts-filter.args';
import { DebtSummary } from './dto/debt-summary.type';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Debt)
@UseGuards(JwtAuthGuard)
export class DebtsResolver {
  constructor(private readonly debtsService: DebtsService) {}

  @Mutation(() => Debt, { description: 'Crear una nueva deuda' })
  createDebt(@Args('createDebtInput') createDebtInput: CreateDebtInput) {
    return this.debtsService.create(createDebtInput);
  }

  @Query(() => [Debt], {
    name: 'debts',
    description: 'Listar todas las deudas con filtros opcionales',
  })
  findAll(@Args() filter?: DebtsFilterArgs) {
    return this.debtsService.findAll(filter);
  }

  @Query(() => Debt, {
    name: 'debt',
    description: 'Obtener una deuda por ID',
  })
  findOne(@Args('id') id: string) {
    return this.debtsService.findOne(id);
  }

  @Query(() => [Debt], {
    name: 'myDebts',
    description:
      'Obtener todas las deudas del usuario actual (como deudor o acreedor)',
  })
  findMyDebts(
    @CurrentUser() user: User,
    @Args('status', { nullable: true, type: () => DebtStatus })
    status?: DebtStatus,
  ) {
    return this.debtsService.findByUser(user.id, status);
  }

  @Query(() => [Debt], {
    name: 'debtsIOwes',
    description: 'Deudas donde el usuario actual es el deudor',
  })
  async findDebtsIOwes(
    @CurrentUser() user: User,
    @Args('status', { nullable: true, type: () => DebtStatus })
    status?: DebtStatus,
  ) {
    const filter: DebtsFilterArgs = {
      debtorId: user.id,
      status,
    };
    return this.debtsService.findAll(filter);
  }

  @Query(() => [Debt], {
    name: 'debtsOwedToMe',
    description: 'Deudas donde el usuario actual es el acreedor',
  })
  async findDebtsOwedToMe(
    @CurrentUser() user: User,
    @Args('status', { nullable: true, type: () => DebtStatus })
    status?: DebtStatus,
  ) {
    const filter: DebtsFilterArgs = {
      creditorId: user.id,
      status,
    };
    return this.debtsService.findAll(filter);
  }

  @Query(() => DebtSummary, {
    name: 'debtSummary',
    description: 'Obtener resumen de deudas del usuario actual',
  })
  getSummary(@CurrentUser() user: User) {
    return this.debtsService.getSummary(user.id);
  }

  @Mutation(() => Debt, { description: 'Actualizar una deuda' })
  updateDebt(@Args('updateDebtInput') updateDebtInput: UpdateDebtInput) {
    return this.debtsService.update(updateDebtInput.id, updateDebtInput);
  }

  @Mutation(() => Debt, { description: 'Marcar una deuda como pagada' })
  markDebtAsPaid(@Args('id') id: string) {
    return this.debtsService.markAsPaid(id);
  }

  @Mutation(() => Boolean, { description: 'Eliminar una deuda' })
  removeDebt(@Args('id') id: string) {
    return this.debtsService.remove(id);
  }
}
