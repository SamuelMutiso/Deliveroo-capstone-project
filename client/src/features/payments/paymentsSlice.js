import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { paymentsApi } from '@/api/paymentsApi'
import { extractError } from '@/utils/http'

const initialState = {
  record: null,
  amountDue: null,
  status: 'idle',
  error: null,
  checkingOut: false,
  checkoutMessage: null,
  checkoutError: null,
}

export const fetchPayment = createAsyncThunk(
  'payments/fetch',
  async (orderId, { rejectWithValue }) => {
    try {
      return await paymentsApi.get(orderId)
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not load the payment'))
    }
  },
)

export const startCheckout = createAsyncThunk(
  'payments/checkout',
  async ({ orderId, phone }, { rejectWithValue }) => {
    try {
      return await paymentsApi.checkout(orderId, { phone })
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not start the M-Pesa payment'))
    }
  },
)

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearCheckout(state) {
      state.checkoutMessage = null
      state.checkoutError = null
    },
    resetPayment() {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayment.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchPayment.fulfilled, (state, action) => {
        state.status = 'ready'
        state.record = action.payload.payment
        state.amountDue = action.payload.amount_due_kes
      })
      .addCase(fetchPayment.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(startCheckout.pending, (state) => {
        state.checkingOut = true
        state.checkoutError = null
        state.checkoutMessage = null
      })
      .addCase(startCheckout.fulfilled, (state, action) => {
        state.checkingOut = false
        state.record = action.payload.payment
        state.checkoutMessage = action.payload.message
      })
      .addCase(startCheckout.rejected, (state, action) => {
        state.checkingOut = false
        state.checkoutError = action.payload
      })
  },
})

export const { clearCheckout, resetPayment } = paymentsSlice.actions

export const selectPayment = (state) => state.payments.record
export const selectAmountDue = (state) => state.payments.amountDue
export const selectPaymentStatus = (state) => state.payments.status
export const selectCheckingOut = (state) => state.payments.checkingOut
export const selectCheckoutMessage = (state) => state.payments.checkoutMessage
export const selectCheckoutError = (state) => state.payments.checkoutError

export default paymentsSlice.reducer
