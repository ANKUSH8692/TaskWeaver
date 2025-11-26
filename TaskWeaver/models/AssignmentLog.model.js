import mongoose from 'mongoose';

const assignmentLogSchema = new mongoose.Schema({
  taskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task', 
    required: true 
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  assignedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  assignedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'reassigned', 'unassigned'],
    required: true
  }
}, { timestamps: true });

const TaskAssignmentLog = mongoose.model('TaskAssignmentLog', assignmentLogSchema);

export default TaskAssignmentLog;