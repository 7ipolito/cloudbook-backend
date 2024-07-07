import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Request as RequestDecorator,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { Response, Request } from 'express';
import { CognitoAuthGuard } from './guards/cognito.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RequestNewPasswordDto } from './dto/request-new-password.dto';
import { User } from './type/user.type';
import { Roles } from './guards/roleGuard/roles.decorator';
import { Role } from './type/role.enum';
import { RolesGuard } from './guards/roleGuard/roles.guard';
import { ChangeEmailDto } from './dto/change-email.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { VerifyUserDto } from './dto/verify-user.dto';
import { GoogleOauthGuard } from './guards/google.guard';
import { SessionUserDTO } from './type/session-user.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @HttpCode(200)
  async registerUser(@Body() dto: RegisterUserDto): Promise<CognitoUser> {
    return await this.authService.registerUser(dto);
  }

  @Post('verify')
  @HttpCode(200)
  async verifyUser(@Body() dto: VerifyUserDto): Promise<void> {
    return await this.authService.verifyUser(dto);
  }

  @Post('login')
  @HttpCode(200)
  async authenticateUser(
    @Body() dto: AuthenticateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<User> {
    const session = await this.authService.authenticateUser(dto);
    res.cookie('refresh_token', session.getRefreshToken().getToken(), {
      httpOnly: true,
      maxAge: 3600 * 1000 * 48, // 2 days
      path: '/',
      secure: true,
      sameSite: 'none',
    });
    res.cookie('access_token', session.getAccessToken().getJwtToken(), {
      httpOnly: true,
      maxAge: 3600 * 1000, // 1 hour in milliseconds
      path: '/',
      secure: true,
      sameSite: 'none',
    });
    return await this.authService.getCustomer(session);
  }

  @Post('refresh-token')
  @HttpCode(200)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    let token = null;
    if (req && req.cookies) {
      token = req.cookies['refresh_token'];
    }
    const accessToken = await this.authService.refreshToken(token);
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: 3600 * 1000, // 1 hour
      path: '/',
      secure: true,
      sameSite: 'none',
    });
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(CognitoAuthGuard, RolesGuard)
  @Roles([Role.CUSTOMER])
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user['username']);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: RequestNewPasswordDto): Promise<void> {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify/forgot-password')
  @HttpCode(200)
  async verifyForgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.verifyForgotPassword(dto);
  }

  @Post('change-email')
  @HttpCode(200)
  @UseGuards(CognitoAuthGuard, RolesGuard)
  @Roles([Role.MERCHANT])
  async changeEmail(
    @Body() dto: ChangeEmailDto,
    @Req() req: Request,
  ): Promise<void> {
    return this.authService.updateUserEmail(
      req.user['username'],
      dto.newEmail,
      dto.existingEmail,
    );
  }

  @Post('verify-email/:oldEmail/:verificationCode')
  @UseGuards(CognitoAuthGuard, RolesGuard)
  @Roles([Role.MERCHANT])
  async verifyEmailVerificationCode(
    @Param('verificationCode') verificationCode: string,
    @Param('oldEmail') oldEmail: string,
    @Req() req: Request,
  ) {
    return this.authService.verifyEmailVerificationCode(
      req.user['username'],
      oldEmail,
      verificationCode,
      req.cookies['access_token'],
    );
  }

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleAuth(): Promise<void> {}

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleLoginCallback(
    @RequestDecorator() req: any,
    @Res() res: Response,
  ): Promise<any> {
    const session = await this.authService.googleLogin(req.user);
    res.cookie('refresh_token', session.getRefreshToken().getToken(), {
      httpOnly: true,
      maxAge: 3600 * 1000 * 48, // 2 days
      path: '/',
      secure: true,
      sameSite: 'none',
    });
    res.cookie('access_token', session.getAccessToken().getJwtToken(), {
      httpOnly: true,
      maxAge: 3600 * 1000, // 1 hour in milliseconds
      path: '/',
      secure: true,
      sameSite: 'none',
    });

    res.redirect(
      process.env.REDIRECT_URL +
        `?access_token=${req.user._accessToken}&email=${req.user.email}`,
    );
    return session;
  }

  @Post('login/google')
  async googleLogin(@Body() session: SessionUserDTO): Promise<User> {
    return await this.authService.getUserByToken(session);
  }
}
