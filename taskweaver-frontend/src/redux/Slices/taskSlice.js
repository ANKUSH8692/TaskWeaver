import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tasks: [],
  currentTask: null,
  loading: false,
  error: null,
  stats: null,
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    startLoading: (state) => {
      state.loading = true;
      state.error = null;
    },
    getTasksSuccess: (state, action) => {
      state.loading = false;
      state.tasks = action.payload;
    },
    getTaskSuccess: (state, action) => {
      state.loading = false;
      state.currentTask = action.payload;
    },
    createTaskSuccess: (state, action) => {
      state.loading = false;
      state.tasks.push(action.payload);
    },
    updateTaskSuccess: (state, action) => {
      state.loading = false;
      const index = state.tasks.findIndex(task => task._id === action.payload._id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
      if (state.currentTask && state.currentTask._id === action.payload._id) {
        state.currentTask = action.payload;
      }
    },
    deleteTaskSuccess: (state, action) => {
      state.loading = false;
      state.tasks = state.tasks.filter(task => task._id !== action.payload);
    },
    getStatsSuccess: (state, action) => {
      state.loading = false;
      state.stats = action.payload;
    },
    actionFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
  },
});

export const {
  startLoading,
  getTasksSuccess,
  getTaskSuccess,
  createTaskSuccess,
  updateTaskSuccess,
  deleteTaskSuccess,
  getStatsSuccess,
  actionFailure,
  clearCurrentTask,
} = taskSlice.actions;
export default taskSlice.reducer;