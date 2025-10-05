import { ArgsType, Field } from '@nestjs/graphql';
import { IsOptional, IsUUID, IsEnum } from 'class-validator';
import { DebtStatus } from '../entities/debt.entity';

@ArgsType()
export class DebtsFilterArgs {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID('4')
  debtorId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID('4')
  creditorId?: string;

  @Field(() => DebtStatus, { nullable: true })
  @IsOptional()
  @IsEnum(DebtStatus)
  status?: DebtStatus;
}
