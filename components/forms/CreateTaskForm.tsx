"use client";

import { useState } from "react";
import { CheckSquare, User, Calendar, Flag, Link2, Save } from "lucide-react";

interface CreateTaskFormProps {
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  teamMembers: string[];
}

export interface TaskFormData {
  title: string;
  description: string;
  assignedTo: string;
  priority: string;
  dueDate: string;
  relatedType?: string;
  relatedTo?: string;
}

export function CreateTaskForm({ onSubmit, onCancel, teamMembers }: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState("");
  const [relatedType, setRelatedType] = useState("");
  const [relatedTo, setRelatedTo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assignedTo || !dueDate) return;
    
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    onSubmit({
      title,
      description,
      assignedTo,
      priority,
      dueDate,
      relatedType: relatedType || undefined,
      relatedTo: relatedTo || undefined,
    });
    setLoading(false);
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm text-white/60 font-light mb-2">
          <CheckSquare className="w-3 h-3 inline mr-1" />
          Task Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
          placeholder="What needs to be done?"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-white/60 font-light mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
          placeholder="Add more details about this task..."
        />
      </div>

      {/* Assignee and Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 font-light mb-2">
            <User className="w-3 h-3 inline mr-1" />
            Assign To *
          </label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
          >
            <option value="">Select team member</option>
            {teamMembers.map((member) => (
              <option key={member} value={member}>{member}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/60 font-light mb-2">
            <Flag className="w-3 h-3 inline mr-1" />
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-sm text-white/60 font-light mb-2">
          <Calendar className="w-3 h-3 inline mr-1" />
          Due Date *
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          min={today}
          required
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
        />
      </div>

      {/* Related To (Optional) */}
      <div>
        <label className="block text-sm text-white/60 font-light mb-2">
          <Link2 className="w-3 h-3 inline mr-1" />
          Related To (Optional)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <select
            value={relatedType}
            onChange={(e) => {
              setRelatedType(e.target.value);
              setRelatedTo("");
            }}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
          >
            <option value="">None</option>
            <option value="client">Client</option>
            <option value="order">Order</option>
            <option value="quote">Quote</option>
            <option value="delivery">Delivery</option>
          </select>
          {relatedType && (
            <input
              type="text"
              value={relatedTo}
              onChange={(e) => setRelatedTo(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
              placeholder={`Enter ${relatedType} name or ID`}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-white/10 rounded-lg text-white/60 font-light hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !title || !assignedTo || !dueDate}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-lg font-light hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Create Task
            </>
          )}
        </button>
      </div>
    </form>
  );
}

