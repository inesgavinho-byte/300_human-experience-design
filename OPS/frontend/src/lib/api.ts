import type {
  Project,
  Building,
  Floor,
  Room,
  Requirement,
  Prescription,
  EquipmentLibraryItem,
  EngineeringRule,
  AiLocalServer,
  AiLearnedPattern,
  Proposal,
} from '@/types';
import {
  mockProjects,
  mockBuildings,
  mockFloors,
  mockRooms,
  mockRequirements,
  mockPrescriptions,
  mockEquipmentLibrary,
  mockEngineeringRules,
  mockAiServers,
  mockAiPatterns,
  mockProposals,
} from './mock-data';

const MOCK_DELAY = 500;

function mockPromise<T>(data: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), MOCK_DELAY);
  });
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchWithAuth<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = undefined;
    }
    throw new ApiError(
      (data as { message?: string })?.message || `HTTP ${response.status}`,
      response.status,
      data
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ─── Mock API (returns data after 500ms) ───

// Projects
export const getProjects = () => mockPromise<Project[]>(mockProjects);
export const getProject = (id: string) => {
  const project = mockProjects.find((p) => p.id === id);
  if (!project) return Promise.reject(new ApiError('Not found', 404));
  return mockPromise(project);
};
export const createProject = (data: Partial<Project>) =>
  mockPromise<Project>({ ...mockProjects[0], ...data, id: `p${Date.now()}` } as Project);
export const updateProject = (id: string, data: Partial<Project>) => {
  const project = mockProjects.find((p) => p.id === id);
  if (!project) return Promise.reject(new ApiError('Not found', 404));
  return mockPromise<Project>({ ...project, ...data });
};
export const deleteProject = (_id: string) => mockPromise<void>(undefined);

// Buildings
export const getBuildings = (projectId: string) =>
  mockPromise(mockBuildings.filter((b) => b.project_id === projectId));
export const getBuilding = (id: string) => {
  const building = mockBuildings.find((b) => b.id === id);
  if (!building) return Promise.reject(new ApiError('Not found', 404));
  return mockPromise(building);
};

// Floors
export const getFloors = (buildingId: string) =>
  mockPromise(mockFloors.filter((f) => f.building_id === buildingId));

// Rooms
export const getRooms = (floorId: string) =>
  mockPromise(mockRooms.filter((r) => r.floor_id === floorId));
export const getRoom = (id: string) => {
  const room = mockRooms.find((r) => r.id === id);
  if (!room) return Promise.reject(new ApiError('Not found', 404));
  return mockPromise(room);
};

// Requirements
export const getRequirements = (projectId: string) =>
  mockPromise(mockRequirements.filter((r) => r.project_id === projectId));

// Prescriptions
export const getPrescriptions = (projectId: string) =>
  mockPromise(mockPrescriptions.filter((p) => p.project_id === projectId));
export const updatePrescriptionStatus = (id: string, status: Prescription['status']) => {
  const pres = mockPrescriptions.find((p) => p.id === id);
  if (!pres) return Promise.reject(new ApiError('Not found', 404));
  return mockPromise<Prescription>({ ...pres, status });
};

// Equipment Library
export const getEquipmentLibrary = () => mockPromise(mockEquipmentLibrary);
export const getEquipmentItem = (id: string) => {
  const item = mockEquipmentLibrary.find((i) => i.id === id);
  if (!item) return Promise.reject(new ApiError('Not found', 404));
  return mockPromise(item);
};

// Engineering Rules
export const getEngineeringRules = () => mockPromise(mockEngineeringRules);
export const getEngineeringRule = (id: string) => {
  const rule = mockEngineeringRules.find((r) => r.id === id);
  if (!rule) return Promise.reject(new ApiError('Not found', 404));
  return mockPromise(rule);
};

// AI
export const getAiServers = (projectId: string) =>
  mockPromise(mockAiServers.filter((s) => s.project_id === projectId));
export const getAiPatterns = (projectId: string) =>
  mockPromise(mockAiPatterns.filter((p) => p.project_id === projectId));
export const updatePatternStatus = (id: string, status: AiLearnedPattern['status']) => {
  const pattern = mockAiPatterns.find((p) => p.id === id);
  if (!pattern) return Promise.reject(new ApiError('Not found', 404));
  return mockPromise<AiLearnedPattern>({ ...pattern, status });
};

// Proposals
export const getProposals = (projectId: string) =>
  mockPromise(mockProposals.filter((p) => p.project_id === projectId));

// Real fetch API (for when backend is available)
export { fetchWithAuth, API_BASE_URL, ApiError };
