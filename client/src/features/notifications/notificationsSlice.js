import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { notificationsApi } from '@/api/notificationsApi'
import { logout } from '@/features/auth/authSlice'
import { extractError } from '@/utils/http'

const initialState = {
  items: [],
  unread: 0,
  status: 'idle',
  error: null,
}

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationsApi.list({ per_page: 12 })
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not load your notifications'))
    }
  },
)

export const fetchUnreadCount = createAsyncThunk(
  'notifications/unread',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationsApi.unreadCount()
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not check for notifications'))
    }
  },
)

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      return await notificationsApi.markRead(id)
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not update that notification'))
    }
  },
)

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationsApi.markAllRead()
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not clear your notifications'))
    }
  },
)

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications() {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        if (!state.items.length) state.status = 'loading'
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.items
        state.unread = action.payload.unread
        state.error = null
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unread = action.payload
      })

      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const updated = action.payload
        const existing = state.items.find((item) => item.id === updated.id)
        if (existing && !existing.is_read) {
          existing.is_read = true
          state.unread = Math.max(0, state.unread - 1)
        }
      })

      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items = state.items.map((item) => ({ ...item, is_read: true }))
        state.unread = 0
      })

      .addCase(logout.fulfilled, () => initialState)
      .addCase(logout.rejected, () => initialState)
  },
})

export const { clearNotifications } = notificationsSlice.actions

export const selectNotifications = (state) => state.notifications.items
export const selectUnreadCount = (state) => state.notifications.unread
export const selectNotificationsStatus = (state) => state.notifications.status
export const selectNotificationsError = (state) => state.notifications.error

export default notificationsSlice.reducer
