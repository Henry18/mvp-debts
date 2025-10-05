import { InputType, Field, Float } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsUUID,
  MinLength,
} from 'class-validator';

@InputType()
export class CreateDebtInput {
  @Field()
  @IsNotEmpty({ message: 'La descripción es requerida' })
  @MinLength(3, { message: 'La descripción debe tener al menos 3 caracteres' })
  description: string;

  @Field(() => Float)
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto debe ser positivo' })
  amount: number;

  @Field()
  @IsUUID('4', { message: 'El ID del deudor debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El deudor es requerido' })
  debtorId: string;

  @Field()
  @IsUUID('4', { message: 'El ID del acreedor debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El acreedor es requerido' })
  creditorId: string;
}
