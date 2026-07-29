import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../shared/utils/supabase.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private supabaseService: SupabaseService,
    private prisma: PrismaService,
  ) {}

  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    try {
      const user = await this.supabaseService.verifyToken(loginDto.accessToken);
      if (!user) {
        throw new UnauthorizedException('Invalid Supabase token');
      }

      // Get or create profile
      let profile = await this.prisma.profiles.findUnique({
        where: { id: user.id },
      });

      if (!profile) {
        profile = await this.prisma.profiles.create({
          data: {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name,
            role: 'viewer',
          },
        });
      }

      const payload = {
        sub: profile.id,
        email: profile.email,
        role: profile.role,
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        accessToken,
        refreshToken: loginDto.accessToken,
        user: {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          role: profile.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException(`Authentication failed: ${error.message}`);
    }
  }

  async refresh(refreshToken: string): Promise<TokenResponseDto> {
    try {
      const user = await this.supabaseService.verifyToken(refreshToken);
      const profile = await this.prisma.profiles.findUnique({
        where: { id: user.id },
      });

      if (!profile) {
        throw new UnauthorizedException('User not found');
      }

      const payload = {
        sub: profile.id,
        email: profile.email,
        role: profile.role,
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        accessToken,
        refreshToken,
        user: {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          role: profile.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException(`Refresh failed: ${error.message}`);
    }
  }
}
