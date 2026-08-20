import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { applicationsApi } from '@/api/applicationsApi'
import { extractError } from '@/utils/http'

const initialState = {
  mine: null,
  status: 'idle',
  error: null,
  vehicleTypes: [],
  submitting: false,
  submitError: null,
}

export const fetchVehicleTypes = createAsyncThunk('applications/vehicleTypes', async () => {
  const data = await applicationsApi.vehicleTypes()
  return data.vehicle_types
})

export const fetchMyApplication = createAsyncThunk(
  'applications/mine',
  async (_arg, { rejectWithValue }) => {
    try {
      const data = await applicationsApi.mine()
      return data.application
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not load your application'))
    }
  },
)

export const submitApplication = createAsyncThunk(
  'applications/submit',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await applicationsApi.apply(payload)
      return data.application
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not send your application'))
    }
  },
)

export const withdrawApplication = createAsyncThunk(
  'applications/withdraw',
  async (id, { rejectWithValue }) => {
    try {
      const data = await applicationsApi.withdraw(id)
      return data.application
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not withdraw your application'))
    }
  },
)

const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    clearApplicationError(state) {
      state.submitError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicleTypes.fulfilled, (state, action) => {
        state.vehicleTypes = action.payload
      })

      .addCase(fetchMyApplication.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchMyApplication.fulfilled, (state, action) => {
        state.status = 'ready'
        state.mine = action.payload
      })
      .addCase(fetchMyApplication.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      .addCase(submitApplication.pending, (state) => {
        state.submitting = true
        state.submitError = null
      })
      .addCase(submitApplication.fulfilled, (state, action) => {
        state.submitting = false
        state.mine = action.payload
      })
      .addCase(submitApplication.rejected, (state, action) => {
        state.submitting = false
        state.submitError = action.payload
      })

      .addCase(withdrawApplication.fulfilled, (state, action) => {
        state.mine = action.payload
      })
  },
})

export const { clearApplicationError } = applicationsSlice.actions

export const selectMyApplication = (state) => state.applications.mine
export const selectApplicationStatus = (state) => state.applications.status
export const selectVehicleTypes = (state) => state.applications.vehicleTypes
export const selectApplicationSubmitting = (state) => state.applications.submitting
export const selectApplicationSubmitError = (state) => state.applications.submitError

export default applicationsSlice.reducer
