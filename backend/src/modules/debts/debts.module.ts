import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DebtsService } from './debts.service';
import { DebtsController } from './debts.controller';
import { DebtsResolver } from './debts.resolver';
import { Debt } from './entities/debt.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Debt]), UsersModule],
  controllers: [DebtsController],
  providers: [DebtsResolver, DebtsService],
  exports: [DebtsService],
})
export class DebtsModule {}
