import { Field, ObjectType, InputType } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field()
  id!: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field()
  isAnonymous!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  lastLoginAt!: Date;

  @Field({ nullable: true })
  metadata?: Record<string, any>;
}

@ObjectType()
export class AuthPayload {
  @Field()
  sessionToken!: string;

  @Field({ nullable: true })
  deviceToken?: string;

  @Field()
  user!: User;
}

@ObjectType()
export class GuestPayload {
  @Field()
  sessionToken!: string;

  @Field()
  user!: User;
}

@InputType()
export class LoginInput {
  @Field()
  email!: string;
}

@InputType()
export class VerifyLinkInput {
  @Field()
  token!: string;
}

@InputType()
export class DeviceLoginInput {
  @Field()
  deviceToken!: string;
}

@InputType()
export class GuestUpgradeInput {
  @Field()
  email!: string;
}

@InputType()
export class ContextCheckInput {
  @Field()
  fingerprint!: string;
} 