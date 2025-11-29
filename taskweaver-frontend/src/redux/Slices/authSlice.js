import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  employee: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.employee = action.payload.data;
      state.token = action.payload.data.accessToken;
      localStorage.setItem('token', action.payload.data.accessToken);
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.employee = null;
      state.token = null;
      localStorage.removeItem('token');
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.employee = null;
      state.token = null;
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError } = authSlice.actions;
export default authSlice.reducer;