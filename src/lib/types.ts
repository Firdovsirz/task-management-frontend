export type TaskType = 'TASK' | 'BUG' | 'STORY' | 'EPIC' | 'IMPROVEMENT';
export type Priority = 'LOWEST' | 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST';
export type ColumnCategory = 'TODO' | 'IN_PROGRESS' | 'DONE';
/** A single owner is never told about their own changes - only deadlines interrupt. */
export type NotificationType = 'DUE_SOON';
export type ActivityType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_MOVED'
  | 'TASK_DELETED'
  | 'COMMENT_ADDED'
  | 'COMMENT_DELETED';

/** Who recorded something. There is only ever one person, so this is never picked in the UI. */
export interface UserSummary {
  id: number;
  fullName: string;
  initials: string;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  initials: string;
  emailNotifications: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresAt: string;
  user: User;
}

/** What a space is for. Spaces made before kinds existed come back as PLATFORM. */
export type SpaceKind = 'PLATFORM' | 'STUDY' | 'CAREER' | 'RESEARCH' | 'PERSONAL' | 'OTHER';

/**
 * A space - a product, an exam like IELTS, a job hunt - that groups boards and diagrams.
 * The API still calls it a platform, so the type and the endpoints keep that name.
 */
export interface Platform {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  color: string;
  icon: string;
  active: boolean;
  kind: SpaceKind;
  /** What done looks like, e.g. "Overall band 7.0". */
  goal?: string | null;
  /** yyyy-MM-dd: the exam, the deadline, the date the goal is due. */
  targetDate?: string | null;
  boardCount: number;
  taskCount: number;
  doneCount: number;
  createdAt: string;
}

/** A ready-made space: the board, columns and starter tasks it will create. */
export interface SpaceTemplate {
  key: string;
  name: string;
  kind: SpaceKind;
  description: string;
  code: string;
  color: string;
  goal: string;
  boardName: string;
  boardKey: string;
  columns: string[];
  taskCount: number;
  /** How many starter tasks are dated back from the target date. */
  datedTaskCount: number;
  /** What the target date means for this template, e.g. "Exam date". */
  targetDateLabel: string;
}

export interface BoardColumnDto {
  id: number;
  name: string;
  position: number;
  wipLimit?: number | null;
  category: ColumnCategory;
  taskCount: number;
}

export interface BoardSummary {
  id: number;
  name: string;
  boardKey: string;
  description?: string | null;
  color: string;
  platformId?: number | null;
  platformName?: string | null;
  platformColor?: string | null;
  platformKind?: SpaceKind | null;
  taskCount: number;
  doneCount: number;
  archived: boolean;
  createdAt: string;
}

export interface BoardDetail {
  id: number;
  name: string;
  boardKey: string;
  description?: string | null;
  color: string;
  platform?: Platform | null;
  columns: BoardColumnDto[];
  taskCount: number;
  archived: boolean;
  createdAt: string;
}

export interface TaskCard {
  id: number;
  taskKey: string;
  title: string;
  type: TaskType;
  priority: Priority;
  columnId: number;
  category: ColumnCategory;
  orderIndex: number;
  dueDate?: string | null;
  overdue: boolean;
  storyPoints?: number | null;
  labels: string[];
  commentCount: number;
  updatedAt: string;
}

export interface TaskDetail {
  id: number;
  taskKey: string;
  title: string;
  description?: string | null;
  type: TaskType;
  priority: Priority;
  boardId: number;
  boardName: string;
  boardKey: string;
  columnId: number;
  columnName: string;
  category: ColumnCategory;
  labels: string[];
  startDate?: string | null;
  dueDate?: string | null;
  overdue: boolean;
  storyPoints?: number | null;
  estimateHours?: number | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanColumn {
  id: number;
  name: string;
  position: number;
  wipLimit?: number | null;
  category: ColumnCategory;
  tasks: TaskCard[];
}

export interface KanbanBoard {
  board: BoardDetail;
  columns: KanbanColumn[];
}

export interface Comment {
  id: number;
  body: string;
  author: UserSummary;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: number;
  type: ActivityType;
  taskKey?: string | null;
  taskTitle?: string | null;
  boardKey?: string | null;
  actor?: UserSummary | null;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message?: string | null;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalPlatforms: number;
  totalBoards: number;
  totalTasks: number;
  openTasks: number;
  overdueTasks: number;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  tasksByPriority: Record<string, number>;
  tasksByType: Record<string, number>;
  /** Open work, soonest deadline first. */
  nextUp: TaskCard[];
  upcomingDeadlines: TaskCard[];
  recentActivity: Activity[];
  boards: BoardSummary[];
  /** Active spaces whose target date is today or later, nearest first. */
  upcomingGoals: Platform[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ---------------------------------------------------------------- architecture

export type ArchNodeKind = 'COMPONENT' | 'SERVICE' | 'DATABASE' | 'EXTERNAL' | 'NOTE';
export type ArchNoteKind = 'DECISION' | 'CONSTRAINT' | 'RISK' | 'ASSUMPTION' | 'NOTE';
export type ArchNoteStatus = 'PROPOSED' | 'ACCEPTED' | 'SUPERSEDED' | 'REJECTED';
export type DiagramStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'DEPRECATED';

/**
 * Nullable fields are declared optional, not `| null` alone: the API sets
 * spring.jackson.default-property-inclusion=non_null, so a null value is omitted from the JSON
 * entirely and arrives as undefined.
 */
export interface ArchNode {
  id: number;
  name: string;
  kind: ArchNodeKind;
  description?: string | null;
  technology?: string | null;
  color?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  noteKind?: ArchNoteKind | null;
  noteStatus?: ArchNoteStatus | null;
  decidedOn?: string | null;
  author?: UserSummary | null;
  updatedAt?: string | null;
}

export interface ArchEdge {
  id: number;
  sourceNodeId: number;
  targetNodeId: number;
  label?: string | null;
  technology?: string | null;
  dashed: boolean;
}

export interface DiagramSummary {
  id: number;
  name: string;
  description?: string | null;
  color?: string | null;
  status: DiagramStatus;
  platformId?: number | null;
  platformName?: string | null;
  platformColor?: string | null;
  nodeCount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DiagramView {
  diagram: DiagramSummary;
  nodes: ArchNode[];
  edges: ArchEdge[];
}

export interface DiagramPayload {
  name: string;
  description?: string | null;
  color?: string | null;
  status?: DiagramStatus;
  platformId: number;
}

export interface NodePayload {
  name: string;
  kind: ArchNodeKind;
  description?: string | null;
  technology?: string | null;
  color?: string | null;
  x: number;
  y: number;
  width?: number;
  height?: number;
  noteKind?: ArchNoteKind | null;
  noteStatus?: ArchNoteStatus | null;
  decidedOn?: string | null;
}

export interface EdgePayload {
  sourceNodeId: number;
  targetNodeId: number;
  label?: string | null;
  technology?: string | null;
  dashed?: boolean;
}
