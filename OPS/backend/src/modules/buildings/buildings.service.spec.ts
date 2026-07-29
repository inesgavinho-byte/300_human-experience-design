import { Test, TestingModule } from '@nestjs/testing';
import { BuildingsService } from './buildings.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

describe('BuildingsService', () => {
  let service: BuildingsService;

  const mockPrisma = {
    buildings: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuildingsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BuildingsService>(BuildingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a building', async () => {
    const dto = { name: 'Test Building', projectId: '1' };
    mockPrisma.buildings.create.mockResolvedValue({
      id: '1',
      ...dto,
      created_at: new Date(),
      updated_at: new Date(),
    });
    expect(await service.create(dto as any)).toBeDefined();
  });
});
