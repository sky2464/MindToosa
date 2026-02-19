import { vi, describe, it, expect, beforeEach } from 'vitest';
import { spaceService } from './spaceService';
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

describe('spaceService', () => {
    const userId = 'user-123';
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

    describe('getSpaces', () => {
        it('should fetch spaces successfully', async () => {
            const mockSpaces = [{ id: spaceId, name: 'Work' }];
            const thenableChain = {
                ...mockChain,
                then: (resolve: any) => resolve({ data: mockSpaces, error: null })
            };
            mockSelect.mockReturnValue(thenableChain);
            mockEq.mockReturnValue(thenableChain);
            mockOrder.mockReturnValue(thenableChain);

            const result = await spaceService.getSpaces(userId);
            expect(result).toEqual(mockSpaces);
            expect(mockEq).toHaveBeenCalledWith('user_id', userId);
        });
    });

    describe('createSpace', () => {
        it('should create space successfully', async () => {
            const spaceName = 'New Space';
            // Implementation sets archived: false by default
            const createdSpace = { id: spaceId, name: spaceName, user_id: userId, archived: false };

            mockSingle.mockResolvedValueOnce({ data: createdSpace, error: null });

            const result = await spaceService.createSpace(userId, spaceName);
            expect(result).toEqual(createdSpace);
        });

        it('should throw ValidationError on invalid data', async () => {
            // Implementation uses safeParse on { name: '', ... }
            // SpaceSchema likely requires name.min(1)
            await expect(spaceService.createSpace(userId, ''))
                .rejects.toThrow(ValidationError);
        });
    });

    describe('updateSpace', () => {
        it('should validate UUID', async () => {
            await expect(spaceService.updateSpace(userId, 'invalid', {}))
                .rejects.toThrow(ValidationError);
        });

        it('should update space successfully', async () => {
            const updates = { name: 'Updated' };
            const updatedSpace = { id: spaceId, name: 'Updated' };

            mockSingle.mockResolvedValueOnce({ data: updatedSpace, error: null });

            const result = await spaceService.updateSpace(userId, spaceId, updates);
            expect(result).toEqual(updatedSpace);
        });
    });

    describe('archiveSpace', () => {
        it('should validate UUID', async () => {
            await expect(spaceService.archiveSpace(userId, 'invalid'))
                .rejects.toThrow(ValidationError);
        });

        it('should archive space successfully', async () => {
            const archivedSpace = { id: spaceId, archived: true };
            mockSingle.mockResolvedValueOnce({ data: archivedSpace, error: null });

            const result = await spaceService.archiveSpace(userId, spaceId);
            expect(result).toEqual(archivedSpace);
        });
    });
});
