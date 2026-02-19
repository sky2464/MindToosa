import { vi, describe, it, expect, beforeEach } from 'vitest';
import { taskService } from './taskService';
import { AppError, ValidationError } from '@/lib/errors';

// Mock DB chain
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();

const mockChain = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
    gte: mockGte,
    lte: mockLte,
} as any;

// Setup chainable returns
mockSelect.mockReturnValue(mockChain);
mockInsert.mockReturnValue(mockChain);
mockUpdate.mockReturnValue(mockChain);
mockDelete.mockReturnValue(mockChain);
mockEq.mockReturnValue(mockChain);
mockOrder.mockReturnValue(mockChain);
mockSingle.mockReturnValue(mockChain);
mockGte.mockReturnValue(mockChain);
mockLte.mockReturnValue(mockChain);

vi.mock('@/server/db', () => ({
    db: {
        from: vi.fn(() => mockChain),
    },
}));

describe('taskService', () => {
    const userId = 'user-123';
    const taskId = '123e4567-e89b-12d3-a456-426614174000';
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
        mockGte.mockReturnValue(mockChain);
        mockLte.mockReturnValue(mockChain);
    });

    describe('getTasks', () => {
        it('should fetch tasks with filters', async () => {
            const mockTasks = [{ id: taskId, title: 'Test Task' }];
            // Mock implicit await on the chain (since getTasks awaits query)
            // The chain itself needs to be thenable or we stick with the structure:
            // const { data, error } = await query;
            // Since we mock the chain, we need to mock the *result* of the promise.
            // But wait, in the implementation: `const { data, error } = await query;`
            // `query` is the chain object.
            // So the chain object must be thenable or return a promise.
            // Vitest mocks are synchronous by default unless we use mockResolvedValue.
            // If the code awaits `query`, `query` itself must differ from standard Supabase chaining if we aren't calling `.then()`.
            // Supabase `PostgrestBuilder` is thenable.
            // So we need to make `mockChain` thenable for `await query`.

            const thenableChain = {
                ...mockChain,
                then: (resolve: any) => resolve({ data: mockTasks, error: null })
            };

            // We need `db.from` to return this thenable chain eventually or the specific filter methods to return it.
            // Let's make all filter methods return `thenableChain`.
            mockSelect.mockReturnValue(thenableChain);
            mockEq.mockReturnValue(thenableChain);
            mockGte.mockReturnValue(thenableChain);
            mockLte.mockReturnValue(thenableChain);

            const result = await taskService.getTasks(userId, { spaceId });
            expect(result).toEqual(mockTasks);
            expect(mockEq).toHaveBeenCalledWith('space_id', spaceId);
        });

        it('should validate inputs if applicable', async () => {
            // getTasks checks options.spaceId validation?
            // Checking implementation... yes: `if (!UUIDSchema.safeParse(options.spaceId).success)`

            await expect(taskService.getTasks(userId, { spaceId: 'invalid' }))
                .rejects.toThrow(ValidationError);
        });
    });

    describe('createTask', () => {
        it('should create task successfully', async () => {
            const taskData = { title: 'New Task', space_id: spaceId };
            const createdTask = { id: taskId, ...taskData, user_id: userId };

            mockSingle.mockResolvedValueOnce({ data: createdTask, error: null });

            const result = await taskService.createTask(userId, taskData);
            expect(result).toEqual(createdTask);
        });

        it('should throw ValidationError on invalid data', async () => {
            await expect(taskService.createTask(userId, { title: '' }))
                .rejects.toThrow(ValidationError);
        });
    });

    describe('updateTask', () => {
        it('should validate UUID', async () => {
            await expect(taskService.updateTask(userId, 'invalid', {}))
                .rejects.toThrow(ValidationError);
        });

        it('should update task successfully', async () => {
            const updates = { title: 'Updated' };
            const updatedTask = { id: taskId, title: 'Updated' };

            mockSingle
                .mockResolvedValueOnce({ data: { id: taskId, title: 'Old Title', user_id: userId, space_id: spaceId }, error: null }) // 1. Initial fetch
                .mockResolvedValueOnce({ data: updatedTask, error: null }); // 2. Update result

            const result = await taskService.updateTask(userId, taskId, updates);
            console.log('Update Task Result:', result);
            console.log('Mock Single Calls:', mockSingle.mock.calls.length);
            expect(result).toEqual(updatedTask);
        });
    });

    describe('deleteTask', () => {
        it('should validate UUID', async () => {
            await expect(taskService.deleteTask(userId, 'invalid'))
                .rejects.toThrow(ValidationError);
        });
    });
});
