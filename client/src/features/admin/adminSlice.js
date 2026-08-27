import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { adminApi } from '@/api/adminApi'
import { extractError } from '@/utils/http'

const emptyMeta = { page: 1, per_page: 10, total: 0, pages: 0, has_next: false, has_prev: false }

const initialState = {
  orders: [],
  ordersMeta: emptyMeta,
  ordersStatus: 'idle',
  ordersError: null,
  orderFilters: { status: '', courier_id: '', search: '', page: 1 },

  current: null,
  detailStatus: 'idle',
  detailError: null,

  users: [],
  usersMeta: emptyMeta,
  usersStatus: 'idle',
  usersError: null,
  userFilters: { role: '', search: '', page: 1 },

  couriers: [],

  applications: [],
  applicationsStatus: 'idle',
  applicationsError: null,
  pendingApplications: 0,
  applicationFilter: 'pending',
  lastCredentials: null,

  stats: null,
  statsStatus: 'idle',
  statsError: null,

  saving: false,
  saveError: null,
}

export const fetchAdminOrders = createAsyncThunk(
  'admin/orders',
  async (params, { rejectWithValue }) => {
    try {
      return await adminApi.orders(params)
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not load orders'))
    }
  },
)

export const fetchAdminOrder = createAsyncThunk(
  'admin/order',
  async (id, { rejectWithValue }) => {
    try {
      const data = await adminApi.order(id)
      return data.order
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not load that order'))
    }
  },
)

export const fetchStats = createAsyncThunk('admin/stats', async (_, { rejectWithValue }) => {
  try {
    return await adminApi.stats()
  } catch (error) {
    return rejectWithValue(extractError(error, 'Could not load the dashboard'))
  }
})

export const fetchCouriers = createAsyncThunk('admin/couriers', async () => {
  const data = await adminApi.couriers()
  return data.couriers
})

export const fetchUsers = createAsyncThunk('admin/users', async (params, { rejectWithValue }) => {
  try {
    return await adminApi.users(params)
  } catch (error) {
    return rejectWithValue(extractError(error, 'Could not load people'))
  }
})

export const assignCourier = createAsyncThunk(
  'admin/assign',
  async ({ id, courierId }, { rejectWithValue }) => {
    try {
      const data = await adminApi.assign(id, { courier_id: courierId })
      return data.order
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not assign that courier'))
    }
  },
)

export const setOrderStatus = createAsyncThunk(
  'admin/setStatus',
  async ({ id, status, note }, { rejectWithValue }) => {
    try {
      const data = await adminApi.setStatus(id, { status, note })
      return data.order
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not change the status'))
    }
  },
)

export const setOrderLocation = createAsyncThunk(
  'admin/setLocation',
  async ({ id, lat, lng, note }, { rejectWithValue }) => {
    try {
      const data = await adminApi.setLocation(id, { lat, lng, note })
      return data.order
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not move the parcel'))
    }
  },
)

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await adminApi.updateUser(id, payload)
      return data.user
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not update that account'))
    }
  },
)

export const fetchApplications = createAsyncThunk(
  'admin/applications',
  async (status, { rejectWithValue }) => {
    try {
      return await adminApi.applications({ status })
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not load rider applications'))
    }
  },
)

export const approveApplication = createAsyncThunk(
  'admin/approveApplication',
  async ({ id, note }, { rejectWithValue }) => {
    try {
      return await adminApi.approveApplication(id, { note })
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not approve this application'))
    }
  },
)

export const rejectApplication = createAsyncThunk(
  'admin/rejectApplication',
  async ({ id, note }, { rejectWithValue }) => {
    try {
      const data = await adminApi.rejectApplication(id, { note })
      return data.application
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not reject this application'))
    }
  },
)

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setAdminOrderFilters(state, action) {
      state.orderFilters = { ...state.orderFilters, ...action.payload }
    },
    setAdminUserFilters(state, action) {
      state.userFilters = { ...state.userFilters, ...action.payload }
    },
    setApplicationFilter(state, action) {
      state.applicationFilter = action.payload
    },
    clearCredentials(state) {
      state.lastCredentials = null
    },
    clearAdminError(state) {
      state.saveError = null
    },
  },
  extraReducers: (builder) => {
    const applyOrder = (state, action) => {
      state.saving = false
      state.current = action.payload
      state.orders = state.orders.map((order) =>
        order.id === action.payload.id ? { ...order, ...action.payload } : order,
      )
    }
    const savePending = (state) => {
      state.saving = true
      state.saveError = null
    }
    const saveRejected = (state, action) => {
      state.saving = false
      state.saveError = action.payload
    }

    builder
      .addCase(fetchAdminOrders.pending, (state) => {
        if (!state.orders.length) state.ordersStatus = 'loading'
        state.ordersError = null
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.ordersStatus = 'ready'
        state.orders = action.payload.items
        state.ordersMeta = action.payload.meta
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.ordersStatus = 'failed'
        state.ordersError = action.payload
      })

      .addCase(fetchAdminOrder.pending, (state) => {
        if (!state.current) state.detailStatus = 'loading'
        state.detailError = null
      })
      .addCase(fetchAdminOrder.fulfilled, (state, action) => {
        state.detailStatus = 'ready'
        state.current = action.payload
      })
      .addCase(fetchAdminOrder.rejected, (state, action) => {
        state.detailStatus = 'failed'
        state.detailError = action.payload
      })

      .addCase(fetchStats.pending, (state) => {
        if (!state.stats) state.statsStatus = 'loading'
        state.statsError = null
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.statsStatus = 'ready'
        state.stats = action.payload
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.statsStatus = 'failed'
        state.statsError = action.payload
      })

      .addCase(fetchCouriers.fulfilled, (state, action) => {
        state.couriers = action.payload
      })

      .addCase(fetchUsers.pending, (state) => {
        if (!state.users.length) state.usersStatus = 'loading'
        state.usersError = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.usersStatus = 'ready'
        state.users = action.payload.items
        state.usersMeta = action.payload.meta
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.usersStatus = 'failed'
        state.usersError = action.payload
      })

      .addCase(assignCourier.pending, savePending)
      .addCase(assignCourier.fulfilled, applyOrder)
      .addCase(assignCourier.rejected, saveRejected)

      .addCase(setOrderStatus.pending, savePending)
      .addCase(setOrderStatus.fulfilled, applyOrder)
      .addCase(setOrderStatus.rejected, saveRejected)

      .addCase(setOrderLocation.pending, savePending)
      .addCase(setOrderLocation.fulfilled, applyOrder)
      .addCase(setOrderLocation.rejected, saveRejected)

      .addCase(updateUser.pending, savePending)
      .addCase(updateUser.fulfilled, (state, action) => {
        state.saving = false
        state.users = state.users.map((user) =>
          user.id === action.payload.id ? action.payload : user,
        )
      })
      .addCase(updateUser.rejected, saveRejected)

      .addCase(fetchApplications.pending, (state) => {
        if (!state.applications.length) state.applicationsStatus = 'loading'
        state.applicationsError = null
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.applicationsStatus = 'ready'
        state.applications = action.payload.applications
        state.pendingApplications = action.payload.pending_count
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.applicationsStatus = 'failed'
        state.applicationsError = action.payload
      })

      .addCase(approveApplication.pending, savePending)
      .addCase(approveApplication.fulfilled, (state, action) => {
        state.saving = false
        state.lastCredentials = action.payload.credentials
        state.applications = state.applications.filter(
          (item) => item.id !== action.payload.application.id,
        )
        state.pendingApplications = Math.max(0, state.pendingApplications - 1)
      })
      .addCase(approveApplication.rejected, saveRejected)

      .addCase(rejectApplication.pending, savePending)
      .addCase(rejectApplication.fulfilled, (state, action) => {
        state.saving = false
        state.applications = state.applications.filter((item) => item.id !== action.payload.id)
        state.pendingApplications = Math.max(0, state.pendingApplications - 1)
      })
      .addCase(rejectApplication.rejected, saveRejected)
  },
})

export const {
  setAdminOrderFilters,
  setAdminUserFilters,
  setApplicationFilter,
  clearCredentials,
  clearAdminError,
} = adminSlice.actions

export const selectAdminOrders = (state) => state.admin.orders
export const selectAdminOrdersMeta = (state) => state.admin.ordersMeta
export const selectAdminOrdersStatus = (state) => state.admin.ordersStatus
export const selectAdminOrdersError = (state) => state.admin.ordersError
export const selectAdminOrderFilters = (state) => state.admin.orderFilters
export const selectAdminOrder = (state) => state.admin.current
export const selectAdminDetailStatus = (state) => state.admin.detailStatus
export const selectAdminDetailError = (state) => state.admin.detailError
export const selectAdminUsers = (state) => state.admin.users
export const selectAdminUsersMeta = (state) => state.admin.usersMeta
export const selectAdminUsersStatus = (state) => state.admin.usersStatus
export const selectAdminUsersError = (state) => state.admin.usersError
export const selectAdminUserFilters = (state) => state.admin.userFilters
export const selectCouriersList = (state) => state.admin.couriers
export const selectStats = (state) => state.admin.stats
export const selectStatsStatus = (state) => state.admin.statsStatus
export const selectStatsError = (state) => state.admin.statsError
export const selectAdminSaving = (state) => state.admin.saving
export const selectAdminSaveError = (state) => state.admin.saveError
export const selectApplications = (state) => state.admin.applications
export const selectApplicationsStatus = (state) => state.admin.applicationsStatus
export const selectApplicationsError = (state) => state.admin.applicationsError
export const selectPendingApplications = (state) => state.admin.pendingApplications
export const selectApplicationFilter = (state) => state.admin.applicationFilter
export const selectLastCredentials = (state) => state.admin.lastCredentials

export default adminSlice.reducer
