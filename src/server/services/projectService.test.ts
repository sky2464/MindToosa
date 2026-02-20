import { vi, describe, it, expect, beforeEach } from 'vitest';
import { projectService } from './projectService';
import { AppError, ValidationError } from '@/lib/errors';

// Mock DB chain
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

const mockChain = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
} as any;

// Setup chainable returns
mockSelect.mockReturnValue(mockChain);
mockInsert.mockReturnValue(mockChain);
mockUpdate.mockReturnValue(mockChain);
mockDelete.mockReturnValue(mockChain);
mockEq.mockReturnValue(mockChain);
mockOrder.mockReturnValue(mockChain);
mockSingle.mockReturnValue(mockChain);

vi.mock('@/server/db', () => ({
    db: {
        from: vi.fn(() => mockChain),
    },
}));

describe('projectService', () => {
    const userId = 'user-123';
    const projectId = '123e4567-e89b-12d3-a456-426614174000';
    const spaceId = '123e4567-e89b-12d3-a456-426614174001';

    beforeEach(() => {
        vi.resetAllMocks();
        mockSelect.mockReturnValue(mockChain);
        mockInsert.mockReturnValue(mockChain);
        mockUpdate.mockReturnValue(mockChain);
        mockDelete.mockReturnValue(mockChain);
        mockEq.mockReturnValue(mockChain);
        mockOrder.mockReturnValue(mockChain);
        mockSingle.mockReturnValue(mockChain);
    });

    describe('getProjects', () => {
        it('should fetch projects successfully', async () => {
            const mockProjects = [{ id: projectId, title: 'Project 1' }];
            // Mock implicit await or .then()
            const thenableChain = {
                ...mockChain,
                then: (resolve: any) => resolve({ data: mockProjects, error: null })
            };
            mockSelect.mockReturnValue(thenableChain);
            mockEq.mockReturnValue(thenableChain);
            mockOrder.mockReturnValue(thenableChain);

            // Implementation only takes userId
            const result = await projectService.getProjects(userId);
            expect(result).toEqual(mockProjects);
            expect(mockEq).toHaveBeenCalledWith('user_id', userId);
        });
    });

    describe('createProject', () => {
        it('should create project successfully', async () => {
            const projectData = { title: 'New Project', space_id: spaceId, scope: 'Build an AI tool' };
            const createdProject = { id: projectId, ...projectData, user_id: userId };

            mockSingle.mockResolvedValueOnce({ data: createdProject, error: null });

            const result = await projectService.createProject(userId, projectData);
            expect(result).toEqual(createdProject);
        });

        it('should throw ValidationError on invalid data', async () => {
            await expect(projectService.createProject(userId, { title: '' }))
                .rejects.toThrow(ValidationError);
        });
    });

    describe('updateProject', () => {
        it('should validate UUID', async () => {
            await expect(projectService.updateProject(userId, 'invalid', {}))
                .rejects.toThrow(ValidationError);
        });

        it('should update project successfully', async () => {
            const updates = { title: 'Updated' };

            // Implementation returns void, just updates DB
            // We need to ensure the chain returns { error: null }
            const thenableChain = {
                ...mockChain,
                then: (resolve: any) => resolve({ error: null })
            };
            mockUpdate.mockReturnValue(thenableChain);
            mockEq.mockReturnValue(thenableChain);

            const result = await projectService.updateProject(userId, projectId, updates);
            expect(result).toBeUndefined();
            expect(mockUpdate).toHaveBeenCalledWith(updates);
        });
    });

    describe('deleteProject', () => {
        it('should validate UUID', async () => {
            await expect(projectService.deleteProject(userId, 'invalid'))
                .rejects.toThrow(ValidationError);
        });
    });
});
