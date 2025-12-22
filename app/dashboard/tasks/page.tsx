"use client";

import { useState } from "react";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Circle,
  MoreHorizontal,
  ChevronDown,
  Flag,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { CreateTaskForm, TaskFormData } from "@/components/forms/CreateTaskForm";

type TaskPriority = "low" | "normal" | "high" | "urgent";
type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  relatedTo?: {
    type: "client" | "order" | "quote" | "delivery";
    id: string;
    name: string;
  };
  comments: number;
}

const PRIORITY_INFO: Record<TaskPriority, { label: string; color: string; icon: string }> = {
  low: { label: "Low", color: "text-white/40", icon: "↓" },
  normal: { label: "Normal", color: "text-white/60", icon: "―" },
  high: { label: "High", color: "text-white", icon: "↑" },
  urgent: { label: "Urgent", color: "text-red-400", icon: "!!" },
};

const STATUS_INFO: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-white/10 text-white/60" },
  in_progress: { label: "In Progress", color: "bg-white/20 text-white" },
  completed: { label: "Completed", color: "bg-white/30 text-white" },
  cancelled: { label: "Cancelled", color: "bg-white/5 text-white/40" },
};

const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "Follow up with James Richardson about bathroom tiles",
    description: "Client requested additional marble samples. Need to send photos and arrange viewing.",
    assignedTo: "Sarah",
    assignedBy: "Mateo",
    priority: "high",
    status: "pending",
    dueDate: "2024-12-23",
    createdAt: "2024-12-20T10:00:00Z",
    relatedTo: { type: "client", id: "1", name: "James Richardson" },
    comments: 2,
  },
  {
    id: "2",
    title: "Prepare quote for Chelsea Manor project",
    description: "Full bathroom renovation including Stone Sanctuary bath and brass fittings.",
    assignedTo: "Mateo",
    assignedBy: "Mateo",
    priority: "urgent",
    status: "in_progress",
    dueDate: "2024-12-22",
    createdAt: "2024-12-19T14:00:00Z",
    relatedTo: { type: "quote", id: "Q-2024-015", name: "Sarah Mitchell" },
    comments: 0,
  },
  {
    id: "3",
    title: "Confirm delivery schedule with Thompson order",
    description: "Coordinate with warehouse on dining table availability.",
    assignedTo: "Tom",
    assignedBy: "Mateo",
    priority: "normal",
    status: "completed",
    dueDate: "2024-12-21",
    createdAt: "2024-12-18T09:00:00Z",
    completedAt: "2024-12-21T11:30:00Z",
    relatedTo: { type: "order", id: "HOC-2024-003", name: "David Thompson" },
    comments: 3,
  },
  {
    id: "4",
    title: "Send welcome email to new signups",
    description: "3 new accounts created this week without submissions - send personalized outreach.",
    assignedTo: "Sarah",
    assignedBy: "Mateo",
    priority: "normal",
    status: "pending",
    dueDate: "2024-12-24",
    createdAt: "2024-12-22T08:00:00Z",
    comments: 0,
  },
  {
    id: "5",
    title: "Review Anderson quote before sending",
    description: "Lisa Anderson kitchen hardware upgrade quote needs final review.",
    assignedTo: "Mateo",
    assignedBy: "Sarah",
    priority: "high",
    status: "pending",
    dueDate: "2024-12-23",
    createdAt: "2024-12-21T16:00:00Z",
    relatedTo: { type: "quote", id: "Q-2024-018", name: "Lisa Anderson" },
    comments: 1,
  },
  {
    id: "6",
    title: "Update inventory spreadsheet",
    description: "Add new brass fixture range to product catalog.",
    assignedTo: "Tom",
    assignedBy: "Mateo",
    priority: "low",
    status: "pending",
    dueDate: "2024-12-27",
    createdAt: "2024-12-20T11:00:00Z",
    comments: 0,
  },
  {
    id: "7",
    title: "Schedule consultation with Jennifer Clark",
    description: "Follow up on emerald sofa inquiry - client prefers afternoon slots.",
    assignedTo: "Mateo",
    assignedBy: "Mateo",
    priority: "normal",
    status: "in_progress",
    dueDate: "2024-12-26",
    createdAt: "2024-12-21T09:00:00Z",
    relatedTo: { type: "client", id: "8", name: "Jennifer Clark" },
    comments: 1,
  },
];

const TEAM_MEMBERS = ["Mateo", "Sarah", "Tom", "Mike"];

// Task Row Component
function TaskRow({ 
  task, 
  onStatusChange,
  onSelect 
}: { 
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onSelect: () => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "completed" && task.status !== "cancelled";
  const dueDate = new Date(task.dueDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const getDueDateLabel = () => {
    if (dueDate.toDateString() === today.toDateString()) return "Today";
    if (dueDate.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div 
      className={`group p-4 rounded-lg border transition-all cursor-pointer ${
        task.status === "completed" 
          ? "bg-white/5 border-white/5 opacity-60" 
          : isOverdue 
            ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10" 
            : "bg-white/5 border-white/10 hover:bg-white/10"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <div 
          className="mt-0.5 relative"
          onClick={(e) => {
            e.stopPropagation();
            setShowStatusMenu(!showStatusMenu);
          }}
        >
          {task.status === "completed" ? (
            <CheckCircle className="w-5 h-5 text-white/40" />
          ) : task.status === "in_progress" ? (
            <div className="w-5 h-5 rounded-full border-2 border-white/60 flex items-center justify-center">
              <div className="w-2 h-2 bg-white/60 rounded-full" />
            </div>
          ) : (
            <Circle className="w-5 h-5 text-white/40 hover:text-white/60" />
          )}
          
          {/* Status dropdown */}
          {showStatusMenu && (
            <div className="absolute top-full left-0 mt-1 bg-black border border-white/10 rounded-lg overflow-hidden z-10 min-w-[140px]">
              {(Object.keys(STATUS_INFO) as TaskStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, status);
                    setShowStatusMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm font-light hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <span className={`px-2 py-0.5 rounded text-xs ${STATUS_INFO[status].color}`}>
                    {STATUS_INFO[status].label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <p className={`font-light ${task.status === "completed" ? "text-white/40 line-through" : "text-white"}`}>
              {task.title}
            </p>
            {task.priority === "urgent" && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded flex-shrink-0">
                URGENT
              </span>
            )}
            {task.priority === "high" && (
              <Flag className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-2 text-sm">
            {/* Due date */}
            <span className={`flex items-center gap-1 ${isOverdue ? "text-red-400" : "text-white/40"}`}>
              <Calendar className="w-3.5 h-3.5" />
              {getDueDateLabel()}
            </span>
            
            {/* Assigned to */}
            <span className="flex items-center gap-1 text-white/40">
              <User className="w-3.5 h-3.5" />
              {task.assignedTo}
            </span>
            
            {/* Related to */}
            {task.relatedTo && (
              <span className="text-white/30 font-light">
                → {task.relatedTo.name}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <button 
          onClick={(e) => e.stopPropagation()}
          className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="w-4 h-4 text-white/40" />
        </button>
      </div>
    </div>
  );
}

// Task Detail Panel
function TaskDetailPanel({ 
  task, 
  onClose,
  onStatusChange 
}: { 
  task: Task;
  onClose: () => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  return (
    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-black border-l border-white/10 z-50 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs ${STATUS_INFO[task.status].color}`}>
                {STATUS_INFO[task.status].label}
              </span>
              <span className={`text-xs ${PRIORITY_INFO[task.priority].color}`}>
                {PRIORITY_INFO[task.priority].icon} {PRIORITY_INFO[task.priority].label}
              </span>
            </div>
            <h2 className="text-xl font-light text-white">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span className="text-white/40">✕</span>
          </button>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm text-white/40 font-light mb-2">Description</h3>
          <p className="text-white/80 font-light">{task.description || "No description"}</p>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm text-white/40 font-light mb-1">Assigned To</h3>
            <p className="text-white font-light flex items-center gap-2">
              <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs">
                {task.assignedTo[0]}
              </div>
              {task.assignedTo}
            </p>
          </div>
          <div>
            <h3 className="text-sm text-white/40 font-light mb-1">Assigned By</h3>
            <p className="text-white font-light">{task.assignedBy}</p>
          </div>
          <div>
            <h3 className="text-sm text-white/40 font-light mb-1">Due Date</h3>
            <p className="text-white font-light">
              {new Date(task.dueDate).toLocaleDateString("en-GB", { 
                weekday: "short",
                day: "numeric", 
                month: "short",
                year: "numeric"
              })}
            </p>
          </div>
          <div>
            <h3 className="text-sm text-white/40 font-light mb-1">Created</h3>
            <p className="text-white font-light">
              {new Date(task.createdAt).toLocaleDateString("en-GB", { 
                day: "numeric", 
                month: "short" 
              })}
            </p>
          </div>
        </div>

        {/* Related */}
        {task.relatedTo && (
          <div>
            <h3 className="text-sm text-white/40 font-light mb-2">Related To</h3>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-white/40 font-light capitalize">{task.relatedTo.type}</p>
              <p className="text-white font-light">{task.relatedTo.name}</p>
              <p className="text-sm text-white/40 font-light">{task.relatedTo.id}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-4 border-t border-white/10">
          <p className="text-sm text-white/40 font-light mb-3">Update Status</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(STATUS_INFO) as TaskStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange(task.id, status)}
                className={`px-3 py-2 rounded-lg border transition-colors text-sm font-light ${
                  task.status === status
                    ? "bg-white/20 border-white/30 text-white"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                }`}
              >
                {STATUS_INFO[status].label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(tasks.map(t => 
      t.id === taskId 
        ? { ...t, status: newStatus, completedAt: newStatus === "completed" ? new Date().toISOString() : undefined }
        : t
    ));
    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }
  };

  const handleCreateTask = (data: TaskFormData) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      assignedTo: data.assignedTo,
      assignedBy: "Mateo", // Current user
      priority: data.priority as TaskPriority,
      status: "pending",
      dueDate: data.dueDate,
      createdAt: new Date().toISOString(),
      relatedTo: data.relatedTo ? {
        type: data.relatedType as "client" | "order" | "quote" | "delivery",
        id: data.relatedTo,
        name: data.relatedTo,
      } : undefined,
      comments: 0,
    };
    setTasks([newTask, ...tasks]);
    setShowCreateTask(false);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      searchQuery === "" ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAssignee = 
      assigneeFilter === "all" || task.assignedTo === assigneeFilter;
    
    const matchesStatus = 
      statusFilter === "all" || task.status === statusFilter;
    
    const matchesCompleted = 
      showCompleted || task.status !== "completed";

    return matchesSearch && matchesAssignee && matchesStatus && matchesCompleted;
  });

  // Group tasks by status for display
  const pendingTasks = filteredTasks.filter(t => t.status === "pending");
  const inProgressTasks = filteredTasks.filter(t => t.status === "in_progress");
  const completedTasks = filteredTasks.filter(t => t.status === "completed");

  const overdueTasks = tasks.filter(t => 
    new Date(t.dueDate) < new Date() && 
    t.status !== "completed" && 
    t.status !== "cancelled"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-white">Tasks</h1>
          <p className="text-white/40 font-light mt-1">
            Manage team tasks and assignments
          </p>
        </div>
        <button 
          onClick={() => setShowCreateTask(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-light"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <p className="text-2xl font-light text-white">{pendingTasks.length}</p>
          <p className="text-sm text-white/40 font-light">Pending</p>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <p className="text-2xl font-light text-white">{inProgressTasks.length}</p>
          <p className="text-sm text-white/40 font-light">In Progress</p>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <p className="text-2xl font-light text-white">{completedTasks.length}</p>
          <p className="text-sm text-white/40 font-light">Completed</p>
        </div>
        {overdueTasks.length > 0 ? (
          <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
            <p className="text-2xl font-light text-red-400">{overdueTasks.length}</p>
            <p className="text-sm text-red-400/60 font-light">Overdue</p>
          </div>
        ) : (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-2xl font-light text-white">0</p>
            <p className="text-sm text-white/40 font-light">Overdue</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
          />
        </div>
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
        >
          <option value="all">All Team</option>
          {TEAM_MEMBERS.map((member) => (
            <option key={member} value={member}>{member}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <label className="flex items-center gap-2 text-white/60 font-light cursor-pointer">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="rounded border-white/20"
          />
          Show completed
        </label>
      </div>

      {/* Task Sections */}
      <div className="space-y-6">
        {/* Overdue */}
        {overdueTasks.length > 0 && assigneeFilter === "all" && statusFilter === "all" && (
          <div>
            <h2 className="text-sm font-light text-red-400 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Overdue ({overdueTasks.length})
            </h2>
            <div className="space-y-2">
              {overdueTasks.map((task) => (
                <TaskRow 
                  key={task.id} 
                  task={task} 
                  onStatusChange={handleStatusChange}
                  onSelect={() => setSelectedTask(task)}
                />
              ))}
            </div>
          </div>
        )}

        {/* In Progress */}
        {inProgressTasks.length > 0 && (statusFilter === "all" || statusFilter === "in_progress") && (
          <div>
            <h2 className="text-sm font-light text-white/60 mb-3">
              In Progress ({inProgressTasks.length})
            </h2>
            <div className="space-y-2">
              {inProgressTasks.map((task) => (
                <TaskRow 
                  key={task.id} 
                  task={task}
                  onStatusChange={handleStatusChange}
                  onSelect={() => setSelectedTask(task)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pending */}
        {pendingTasks.length > 0 && (statusFilter === "all" || statusFilter === "pending") && (
          <div>
            <h2 className="text-sm font-light text-white/60 mb-3">
              Pending ({pendingTasks.length})
            </h2>
            <div className="space-y-2">
              {pendingTasks.filter(t => !overdueTasks.includes(t)).map((task) => (
                <TaskRow 
                  key={task.id} 
                  task={task}
                  onStatusChange={handleStatusChange}
                  onSelect={() => setSelectedTask(task)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {showCompleted && completedTasks.length > 0 && (statusFilter === "all" || statusFilter === "completed") && (
          <div>
            <h2 className="text-sm font-light text-white/40 mb-3">
              Completed ({completedTasks.length})
            </h2>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <TaskRow 
                  key={task.id} 
                  task={task}
                  onStatusChange={handleStatusChange}
                  onSelect={() => setSelectedTask(task)}
                />
              ))}
            </div>
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-white/40 font-light">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tasks found</p>
          </div>
        )}
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedTask(null)}
          />
          <TaskDetailPanel
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onStatusChange={handleStatusChange}
          />
        </>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        title="Create Task"
        subtitle="Assign a new task to a team member"
        size="lg"
      >
        <CreateTaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setShowCreateTask(false)}
          teamMembers={TEAM_MEMBERS}
        />
      </Modal>
    </div>
  );
}

