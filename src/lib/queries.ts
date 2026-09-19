'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type {
  Activity,
  AppNotification,
  ArchNode,
  DiagramPayload,
  DiagramSummary,
  DiagramView,
  EdgePayload,
  NodePayload,
  BoardColumnDto,
  BoardDetail,
  BoardSummary,
  Comment,
  ColumnCategory,
  DashboardStats,
  KanbanBoard,
  PageResponse,
  Platform,
  Priority,
  SpaceKind,
  SpaceTemplate,
  TaskCard,
  TaskDetail,
  TaskType,
  User,
} from './types';

/**
 * A new board can reuse the key of one deleted a moment ago; whatever is still cached under that
 * key (the old board, its cards) must not be shown for it. Nothing is watching the key yet here.
 */
function forgetBoardKey(queryClient: ReturnType<typeof useQueryClient>, boardKey: string) {
  const key = boardKey.trim().toUpperCase();
  queryClient.removeQueries({ queryKey: ['board', key] });
  queryClient.removeQueries({ queryKey: ['kanban', key] });
  queryClient.removeQueries({ queryKey: ['board-activity', key] });
  // and the old board's tasks, cached by key (KEY-1, KEY-2 ...) for the task drawer
  queryClient.removeQueries({
    predicate: (query) =>
      query.queryKey[0] === 'task' &&
      typeof query.queryKey[1] === 'string' &&
      query.queryKey[1].toUpperCase().startsWith(`${key}-`),
  });
}

/* ------------------------------------------------------------------ dashboard */

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardStats>('/dashboard/stats')).data,
  });
}

/* ------------------------------------------------------------------ spaces (platforms in the API) */

export function usePlatforms() {
  return useQuery({
    queryKey: ['platforms'],
    queryFn: async () => (await api.get<Platform[]>('/platforms')).data,
  });
}

export interface PlatformPayload {
  name: string;
  code: string;
  description?: string;
  color?: string;
  icon?: string;
  active?: boolean;
  kind?: SpaceKind;
  /** Sent as an empty string to clear it. */
  goal?: string;
  /** yyyy-MM-dd, or null to clear it. */
  targetDate?: string | null;
}

export function useSavePlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: number; payload: PlatformPayload }) =>
      id
        ? (await api.put<Platform>(`/platforms/${id}`, payload)).data
        : (await api.post<Platform>('/platforms', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      // boards show their space's kind, and a board page its goal and countdown
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useSpaceTemplates() {
  return useQuery({
    queryKey: ['space-templates'],
    queryFn: async () => (await api.get<SpaceTemplate[]>('/platforms/templates')).data,
    staleTime: Infinity,
  });
}

export interface FromTemplatePayload {
  template: string;
  name: string;
  code: string;
  boardKey: string;
  goal?: string;
  targetDate?: string | null;
  color?: string;
}

/** One call makes the space, its board and the starter tasks - or nothing, if any part clashes. */
export function useCreateFromTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FromTemplatePayload) =>
      (await api.post<Platform>('/platforms/from-template', payload)).data,
    onSuccess: (_, payload) => {
      forgetBoardKey(queryClient, payload.boardKey);
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeletePlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/platforms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/* ------------------------------------------------------------------ boards */

export function useBoards(platformId?: number | null) {
  return useQuery({
    queryKey: ['boards', platformId ?? null],
    queryFn: async () =>
      (await api.get<BoardSummary[]>('/boards', { params: { platformId: platformId ?? undefined } })).data,
  });
}

export function useBoard(boardKey: string) {
  return useQuery({
    queryKey: ['board', boardKey],
    queryFn: async () => (await api.get<BoardDetail>(`/boards/${boardKey}`)).data,
    enabled: Boolean(boardKey),
  });
}

export interface KanbanFilters {
  type?: TaskType | null;
  priority?: Priority | null;
  search?: string | null;
}

export function useKanban(boardKey: string, filters: KanbanFilters) {
  return useQuery({
    queryKey: ['kanban', boardKey, filters],
    queryFn: async () =>
      (
        await api.get<KanbanBoard>(`/boards/${boardKey}/kanban`, {
          params: {
            type: filters.type ?? undefined,
            priority: filters.priority ?? undefined,
            search: filters.search?.trim() || undefined,
          },
        })
      ).data,
    enabled: Boolean(boardKey),
  });
}

export function useBoardActivity(boardKey: string) {
  return useQuery({
    queryKey: ['board-activity', boardKey],
    queryFn: async () => (await api.get<Activity[]>(`/boards/${boardKey}/activity`)).data,
    enabled: Boolean(boardKey),
  });
}

export interface BoardPayload {
  name: string;
  boardKey: string;
  description?: string;
  color?: string;
  /** The space, or null for a board of its own. */
  platformId: number | null;
}

export function useCreateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BoardPayload) => (await api.post<BoardDetail>('/boards', payload)).data,
    onSuccess: (board) => {
      forgetBoardKey(queryClient, board.boardKey);
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Omit<BoardPayload, 'boardKey'> & { archived?: boolean } }) =>
      (await api.put<BoardDetail>(`/boards/${id}`, payload)).data,
    onSuccess: (board) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['board', board.boardKey] });
      queryClient.invalidateQueries({ queryKey: ['kanban', board.boardKey] });
      // moving a board in or out of a space changes both spaces' counts
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/boards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export interface ColumnPayload {
  name: string;
  wipLimit?: number | null;
  category: ColumnCategory;
}

export function useSaveColumn(boardKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ boardId, columnId, payload }: { boardId: number; columnId?: number; payload: ColumnPayload }) =>
      columnId
        ? (await api.put<BoardColumnDto>(`/boards/columns/${columnId}`, payload)).data
        : (await api.post<BoardColumnDto>(`/boards/${boardId}/columns`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardKey] });
      queryClient.invalidateQueries({ queryKey: ['kanban', boardKey] });
    },
  });
}

export function useReorderColumns(boardKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ boardId, columnIds }: { boardId: number; columnIds: number[] }) =>
      (await api.put(`/boards/${boardId}/columns/reorder`, { columnIds })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardKey] });
      queryClient.invalidateQueries({ queryKey: ['kanban', boardKey] });
    },
  });
}

export function useDeleteColumn(boardKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (columnId: number) => api.delete(`/boards/columns/${columnId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardKey] });
      queryClient.invalidateQueries({ queryKey: ['kanban', boardKey] });
    },
  });
}

/* ------------------------------------------------------------------ tasks */

export interface TaskFilters {
  boardId?: number | null;
  type?: TaskType | null;
  priority?: Priority | null;
  category?: ColumnCategory | null;
  search?: string | null;
  page?: number;
  size?: number;
}

export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () =>
      (
        await api.get<PageResponse<TaskCard>>('/tasks', {
          params: {
            boardId: filters.boardId ?? undefined,
            type: filters.type ?? undefined,
            priority: filters.priority ?? undefined,
            category: filters.category ?? undefined,
            search: filters.search?.trim() || undefined,
            page: filters.page ?? 0,
            size: filters.size ?? 25,
          },
        })
      ).data,
  });
}

export function useTask(taskKey: string) {
  return useQuery({
    queryKey: ['task', taskKey],
    queryFn: async () => (await api.get<TaskDetail>(`/tasks/key/${taskKey}`)).data,
    enabled: Boolean(taskKey),
  });
}

export interface TaskPayload {
  title: string;
  description?: string;
  boardId?: number;
  columnId?: number | null;
  type?: TaskType;
  priority?: Priority;
  startDate?: string | null;
  dueDate?: string | null;
  storyPoints?: number | null;
  estimateHours?: number | null;
  labels?: string[];
}

function invalidateTaskViews(queryClient: ReturnType<typeof useQueryClient>, taskKey?: string) {
  queryClient.invalidateQueries({ queryKey: ['kanban'] });
  queryClient.invalidateQueries({ queryKey: ['tasks'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['boards'] });
  // a space shows its task count and how many are done
  queryClient.invalidateQueries({ queryKey: ['platforms'] });
  if (taskKey) {
    queryClient.invalidateQueries({ queryKey: ['task', taskKey] });
    queryClient.invalidateQueries({ queryKey: ['activity', taskKey] });
  }
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TaskPayload) => (await api.post<TaskDetail>('/tasks', payload)).data,
    onSuccess: (task) => invalidateTaskViews(queryClient, task.taskKey),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: TaskPayload }) =>
      (await api.put<TaskDetail>(`/tasks/${id}`, payload)).data,
    onSuccess: (task) => invalidateTaskViews(queryClient, task.taskKey),
  });
}

export function useMoveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, columnId, position }: { id: number; columnId: number; position: number }) =>
      (await api.patch<TaskCard>(`/tasks/${id}/move`, { columnId, position })).data,
    onSuccess: (task) => invalidateTaskViews(queryClient, task.taskKey),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/tasks/${id}`),
    onSuccess: () => invalidateTaskViews(queryClient),
  });
}

/* ------------------------------------------------------------------ comments + activity */

export function useComments(taskId?: number) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => (await api.get<Comment[]>(`/tasks/${taskId}/comments`)).data,
    enabled: Boolean(taskId),
  });
}

export function useAddComment(taskId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => (await api.post<Comment>(`/tasks/${taskId}/comments`, { body })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task-activity', taskId] });
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
    },
  });
}

export function useUpdateComment(taskId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, body }: { commentId: number; body: string }) =>
      (await api.put<Comment>(`/comments/${commentId}`, { body })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
  });
}

export function useDeleteComment(taskId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: number) => api.delete(`/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
    },
  });
}

export function useTaskActivity(taskId?: number) {
  return useQuery({
    queryKey: ['task-activity', taskId],
    queryFn: async () => (await api.get<Activity[]>(`/tasks/${taskId}/activity`)).data,
    enabled: Boolean(taskId),
  });
}

/* ------------------------------------------------------------------ notifications */

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: async () =>
      (await api.get<AppNotification[]>('/notifications', { params: { unreadOnly: unreadOnly || undefined } })).data,
    refetchInterval: 60_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => (await api.get<{ count: number }>('/notifications/unread-count')).data.count,
    refetchInterval: 45_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => api.post(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => api.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

/* ------------------------------------------------------------------ profile */

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { fullName: string; emailNotifications?: boolean }) =>
      (await api.put<User>('/auth/me', payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) =>
      api.post('/auth/change-password', payload),
  });
}

// ---------------------------------------------------------------- architecture

export function useDiagrams(platformId?: number | null) {
  return useQuery({
    queryKey: ['diagrams', platformId ?? 'all'],
    queryFn: async () =>
      (await api.get<DiagramSummary[]>('/architecture/diagrams', {
        params: platformId ? { platformId } : undefined,
      })).data,
  });
}

export function useDiagram(id: number) {
  return useQuery({
    queryKey: ['diagram', id],
    queryFn: async () => (await api.get<DiagramView>(`/architecture/diagrams/${id}`)).data,
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useSaveDiagram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: number; payload: DiagramPayload }) =>
      id
        ? (await api.put<DiagramSummary>(`/architecture/diagrams/${id}`, payload)).data
        : (await api.post<DiagramSummary>('/architecture/diagrams', payload)).data,
    onSuccess: (diagram) => {
      queryClient.invalidateQueries({ queryKey: ['diagrams'] });
      queryClient.invalidateQueries({ queryKey: ['diagram', diagram.id] });
    },
  });
}

export function useDeleteDiagram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/architecture/diagrams/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diagrams'] }),
  });
}

export function useSaveNode(diagramId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ nodeId, payload }: { nodeId?: number; payload: NodePayload }) =>
      nodeId
        ? (await api.put<ArchNode>(`/architecture/nodes/${nodeId}`, payload)).data
        : (await api.post<ArchNode>(`/architecture/diagrams/${diagramId}/nodes`, payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diagram', diagramId] }),
  });
}

/** The drag commit. Narrow on purpose so a drop cannot overwrite a label edited mid-gesture. */
export function useMoveNode(diagramId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ nodeId, x, y }: { nodeId: number; x: number; y: number }) =>
      (await api.patch<ArchNode>(`/architecture/nodes/${nodeId}/position`, { x, y })).data,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['diagram', diagramId] }),
  });
}

export function useDeleteNode(diagramId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nodeId: number) => api.delete(`/architecture/nodes/${nodeId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diagram', diagramId] }),
  });
}

export function useSaveEdge(diagramId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ edgeId, payload }: { edgeId?: number; payload: EdgePayload }) =>
      edgeId
        ? (await api.put(`/architecture/edges/${edgeId}`, payload)).data
        : (await api.post(`/architecture/diagrams/${diagramId}/edges`, payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diagram', diagramId] }),
  });
}

export function useDeleteEdge(diagramId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (edgeId: number) => api.delete(`/architecture/edges/${edgeId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diagram', diagramId] }),
  });
}
