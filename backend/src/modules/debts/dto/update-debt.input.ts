import { InputType, Field, Float, PartialType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { CreateDebtInput } from './create-debt.input';

@InputType()
export class UpdateDebtInput extends PartialType(CreateDebtInput) {
  @Field()
  @IsUUID('4', { message: 'El ID debe ser un UUID válido' })
  @IsNotEmpty()
  id: string;
}
