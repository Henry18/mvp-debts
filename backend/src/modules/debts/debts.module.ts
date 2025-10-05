import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DebtsService } from './debts.service';
import { DebtsResolver } from './debts.resolver';
import { Debt } from './entities/debt.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Debt]), UsersModule],
  providers: [DebtsResolver, DebtsService],
  exports: [DebtsService],
})
export class DebtsModule {}
