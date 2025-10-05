import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class DebtSummary {
  @Field(() => Int)
  totalDebts: number;

  @Field(() => Int)
  pendingDebts: number;

  @Field(() => Int)
  paidDebts: number;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => Float)
  pendingAmount: number;

  @Field(() => Float)
  paidAmount: number;
}
