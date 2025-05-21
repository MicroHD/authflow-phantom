import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { AuthFlowService } from '../services/authflow.service';
import { ContextEngine } from '../utils/context';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  User,
  AuthPayload,
  GuestPayload,
  LoginInput,
  VerifyLinkInput,
  DeviceLoginInput,
  GuestUpgradeInput,
  ContextCheckInput,
} from './types';

@Resolver()
export class AuthResolver {
  constructor(private readonly authFlow: AuthFlowService) {}

  @Mutation(() => Boolean)
  async requestLoginLink(@Args('input') input: LoginInput, @Context() context: any) {
    const phantomContext = ContextEngine.getRequestContext(context.req);
    await this.authFlow.initiateLogin(input.email, phantomContext);
    return true;
  }

  @Mutation(() => AuthPayload)
  async verifyPhantomLink(@Args('input') input: VerifyLinkInput, @Context() context: any) {
    const phantomContext = ContextEngine.getRequestContext(context.req);
    return await this.authFlow.validateLogin(input.token, phantomContext);
  }

  @Mutation(() => AuthPayload)
  async loginWithDeviceToken(@Args('input') input: DeviceLoginInput, @Context() context: any) {
    const phantomContext = ContextEngine.getRequestContext(context.req);
    return await this.authFlow.validateDeviceLogin(input.deviceToken, phantomContext);
  }

  @Mutation(() => GuestPayload)
  async createGuestSession(@Context() context: any) {
    const phantomContext = ContextEngine.getRequestContext(context.req);
    return await this.authFlow.createGuestSession(phantomContext);
  }

  @Mutation(() => AuthPayload)
  @UseGuards(JwtAuthGuard)
  async upgradeGuestAccount(
    @Args('input') input: GuestUpgradeInput,
    @Context() context: any
  ) {
    const phantomContext = ContextEngine.getRequestContext(context.req);
    return await this.authFlow.upgradeGuestAccount(
      context.req.user.userId,
      input.email,
      phantomContext
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async logout(@Context() context: any) {
    await this.authFlow.logout(context.req.user.userId);
    return true;
  }

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async me(@Context() context: any) {
    return await this.authFlow.getCurrentUser(context.req.user.userId);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async checkContext(
    @Args('input') input: ContextCheckInput,
    @Context() context: any
  ) {
    const phantomContext = ContextEngine.getRequestContext(context.req);
    return await this.authFlow.verifyContext(phantomContext, input.fingerprint);
  }

  @Mutation(() => AuthPayload)
  @UseGuards(JwtAuthGuard)
  async refreshSession(@Context() context: any) {
    return await this.authFlow.refreshSession(context.req.user.userId);
  }
} 