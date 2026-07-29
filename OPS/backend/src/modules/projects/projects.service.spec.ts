import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  const mockPrisma = {
    projects: {
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
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a project', async () => {
      const dto = { name: 'Test Project', description: 'Desc' };
      const result = { id: '1', ...dto, created_at: new Date(), updated_at: new Date() };
      mockPrisma.projects.create.mockResolvedValue(result);

      expect(await service.create(dto as any)).toBeDefined();
      expect(mockPrisma.projects.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of projects', async () => {
      mockPrisma.projects.findMany.mockResolvedValue([]);
      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      const result = {
        id: '1',
        name: 'Test',
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockPrisma.projects.findUnique.mockResolvedValue(result);
      expect(await service.findOne('1')).toBeDefined();
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.projects.findUnique.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow();
    });
  });
});
