/**
 * Repository interfaces for the MindToosa data layer.
 *
 * These interfaces decouple services from the Supabase client, enabling:
 * - Unit tests with in-memory / mock implementations
 * - Future database swaps without touching service logic
 * - Cleaner dependency injection
 *
 * Usage:
 *   Services receive a repository via constructor / factory injection.
 *   Production code passes SupabaseTaskRepository.
 *   Tests pass MockTaskRepository (or vitest mocks).
 *
 * Current state: interfaces defined; SupabaseTaskRepository demonstrates
 * the pattern. Full migration of all services is a future Tier 7 task.
 */

import type { Task, Goal, Project, Space } from "@/core/planTypes";

// ─── Task Repository ──────────────────────────────────────────────────────────

export interface TaskFilters {
  spaceId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  projectId?: string;
  parentId?: string;
  limit?: number;
  offset?: number;
}

export interface ITaskRepository {
  findMany(userId: string, filters?: TaskFilters): Promise<Task[]>;
  findById(userId: string, taskId: string): Promise<Task | null>;
  create(userId: string, data: Partial<Task>): Promise<Task>;
  update(userId: string, taskId: string, data: Partial<Task>): Promise<Task>;
  softDelete(userId: string, taskId: string): Promise<void>;
  restore(userId: string, taskId: string): Promise<void>;
  permanentDelete(userId: string, taskId: string): Promise<void>;
  findDeleted(userId: string): Promise<Task[]>;
}

// ─── Goal Repository ──────────────────────────────────────────────────────────

export interface GoalFilters {
  archived?: boolean;
  spaceId?: string;
}

export interface IGoalRepository {
  findMany(userId: string, filters?: GoalFilters): Promise<Goal[]>;
  findById(userId: string, goalId: string): Promise<Goal | null>;
  create(userId: string, data: Partial<Goal>): Promise<Goal>;
  update(userId: string, goalId: string, data: Partial<Goal>): Promise<Goal>;
  delete(userId: string, goalId: string): Promise<void>;
}

// ─── Project Repository ───────────────────────────────────────────────────────

export interface IProjectRepository {
  findMany(userId: string): Promise<Project[]>;
  findById(userId: string, projectId: string): Promise<Project | null>;
  create(userId: string, data: Partial<Project>): Promise<Project>;
  update(userId: string, projectId: string, data: Partial<Project>): Promise<Project>;
  delete(userId: string, projectId: string): Promise<void>;
}

// ─── Space Repository ─────────────────────────────────────────────────────────

export interface ISpaceRepository {
  findMany(userId: string): Promise<Space[]>;
  findById(userId: string, spaceId: string): Promise<Space | null>;
  create(userId: string, data: Partial<Space>): Promise<Space>;
  update(userId: string, spaceId: string, data: Partial<Space>): Promise<Space>;
  delete(userId: string, spaceId: string): Promise<void>;
}
