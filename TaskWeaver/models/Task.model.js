import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    document: [{
        type: String,
        required: false
    }],
    status: {
        type: String,
        enum: ['pending', 'assigned', 'in-progress', 'completed'],
        default: 'pending',
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
        required: true
    },
    dueDate: {
        type: Date,
        required: false
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: false
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    progress: [{
        update: {
            type: String,
            required: true
        },
        submittedAt: {
            type: Date,
            default: Date.now
        },
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true
        }
    }],
    adminRating: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comments: String,
        ratedAt: Date,
        ratedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee'
        }
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

export default Task;