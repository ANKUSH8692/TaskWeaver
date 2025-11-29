import { configureStore } from '@reduxjs/toolkit';
import authReducer from './Slices/authSlice.js';
import taskReducer from './Slices/taskSlice.js';

const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
  },
});

export default store;