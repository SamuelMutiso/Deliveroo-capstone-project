import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { courierApi } from '@/api/ordersApi'
import { extractError } from '@/utils/http'

const initialState = {
  items: [],
  meta: { page: 1, per_page: 10, total: 0, pages: 0, has_next: false, has_prev: false },
  listStatus: 'idle',
  listError: null,
  filters: { status: '', page: 1 },

  current: null,
  detailStatus: 'idle',
  detailError: null,

  stats: null,
  isAvailable: false,
  availabilitySaving: false,
  saving: false,
  saveError: null,
}

export const fetchAssignments = createAsyncThunk(
  'couriers/fetchAssignments',
  async (params, { rejectWithValue }) => {
    try {
      return await courierApi.list(params)
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not load your route'))
    }
  },
)

export const fetchAssignment = createAsyncThunk(
  'couriers/fetchAssignment',
  async (id, { rejectWithValue }) => {
    try {
      const data = await courierApi.detail(id)
      return data.order
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not load that delivery'))
    }
  },
)

export const advanceStage = createAsyncThunk(
  'couriers/advanceStage',
  async ({ id, status, note, receivedBy }, { rejectWithValue }) => {
    try {
      const data = await courierApi.advance(id, { status, note, received_by: receivedBy })
      return data.order
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not update the delivery stage'))
    }
  },
)

export const pushLocation = createAsyncThunk(
  'couriers/pushLocation',
  async ({ id, lat, lng, note }, { rejectWithValue }) => {
    try {
      const data = await courierApi.pushLocation(id, { lat, lng, note })
      return data.order
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not share your location'))
    }
  },
)

export const declareCash = createAsyncThunk(
  'couriers/declareCash',
  async (id, { rejectWithValue }) => {
    try {
      await courierApi.declareCash(id)
      const data = await courierApi.detail(id)
      return data.order
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not report the cash payment'))
    }
  },
)

export const fetchCourierStats = createAsyncThunk('couriers/stats', async () => courierApi.stats())

export const setAvailability = createAsyncThunk(
  'couriers/setAvailability',
  async (isAvailable, { rejectWithValue }) => {
    try {
      const data = await courierApi.setAvailability(isAvailable)
      return data.is_available
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not change your availability'))
    }
  },
)

const couriersSlice = createSlice({
  name: 'couriers',
  initialState,
  reducers: {
    setCourierFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearCourierError(state) {
      state.saveError = null
    },
    hydrateAvailability(state, action) {
      state.isAvailable = Boolean(action.payload)
    },
  },
  extraReducers: (builder) => {
    const applyOrder = (state, action) => {
      state.saving = false
      state.current = action.payload
      state.items = state.items.map((item) =>
        item.id === action.payload.id ? { ...item, ...action.payload } : item,
      )
    }

    builder
      .addCase(fetchAssignments.pending, (state) => {
        if (!state.items.length) state.listStatus = 'loading'
        state.listError = null
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.listStatus = 'ready'
        state.items = action.payload.items
        state.meta = action.payload.meta
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.listStatus = 'failed'
        state.listError = action.payload
      })

      .addCase(fetchAssignment.pending, (state) => {
        if (!state.current) state.detailStatus = 'loading'
        state.detailError = null
      })
      .addCase(fetchAssignment.fulfilled, (state, action) => {
        state.detailStatus = 'ready'
        state.current = action.payload
      })
      .addCase(fetchAssignment.rejected, (state, action) => {
        state.detailStatus = 'failed'
        state.detailError = action.payload
      })

      .addCase(advanceStage.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(advanceStage.fulfilled, applyOrder)
      .addCase(advanceStage.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(pushLocation.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(pushLocation.fulfilled, applyOrder)
      .addCase(pushLocation.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(declareCash.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(declareCash.fulfilled, applyOrder)
      .addCase(declareCash.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(fetchCourierStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })

      .addCase(setAvailability.pending, (state) => {
        state.availabilitySaving = true
        state.saveError = null
      })
      .addCase(setAvailability.fulfilled, (state, action) => {
        state.availabilitySaving = false
        state.isAvailable = action.payload
      })
      .addCase(setAvailability.rejected, (state, action) => {
        state.availabilitySaving = false
        state.saveError = action.payload
      })
  },
})

export const { setCourierFilters, clearCourierError, hydrateAvailability } =
  couriersSlice.actions

export const selectAssignments = (state) => state.couriers.items
export const selectAssignmentsMeta = (state) => state.couriers.meta
export const selectAssignmentsStatus = (state) => state.couriers.listStatus
export const selectAssignmentsError = (state) => state.couriers.listError
export const selectCourierFilters = (state) => state.couriers.filters
export const selectAssignment = (state) => state.couriers.current
export const selectAssignmentStatus = (state) => state.couriers.detailStatus
export const selectAssignmentError = (state) => state.couriers.detailError
export const selectCourierStats = (state) => state.couriers.stats
export const selectCourierSaving = (state) => state.couriers.saving
export const selectCourierSaveError = (state) => state.couriers.saveError
export const selectIsAvailable = (state) => state.couriers.isAvailable
export const selectAvailabilitySaving = (state) => state.couriers.availabilitySaving

export default couriersSlice.reducer
