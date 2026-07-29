import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../shared/utils/supabase.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = { sign: jest.fn(() => 'token') };
  const mockConfigService = { get: jest.fn() };
  const mockSupabaseService = { verifyToken: jest.fn() };
  const mockPrisma = {
    profiles: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should login user', async () => {
    mockSupabaseService.verifyToken.mockResolvedValue({ id: '1', email: 'test@test.com' });
    mockPrisma.profiles.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com', role: 'viewer', full_name: 'Test' });
    
    const result = await service.login({ accessToken: 'token' });
    expect(result).toBeDefined();
    expect(result.accessToken).toBe('token');
  });
});
