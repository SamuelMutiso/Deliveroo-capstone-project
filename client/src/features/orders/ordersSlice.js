import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { ordersApi } from '@/api/ordersApi'
import { extractError } from '@/utils/http'

const emptyMeta = { page: 1, per_page: 10, total: 0, pages: 0, has_next: false, has_prev: false }

const initialState = {
  items: [],
  meta: emptyMeta,
  listStatus: 'idle',
  listError: null,
  filters: { status: '', search: '', page: 1 },

  current: null,
  detailStatus: 'idle',
  detailError: null,

  categories: [],
  couriers: [],
  quote: null,
  quoteStatus: 'idle',
  quoteError: null,

  saving: false,
  saveError: null,
}

function reject(error, fallback) {
  return extractError(error, fallback)
}

export const fetchOrders = createAsyncThunk(
  'orders/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      return await ordersApi.list(params)
    } catch (error) {
      return rejectWithValue(reject(error, 'Could not load your deliveries'))
    }
  },
)

export const fetchOrder = createAsyncThunk('orders/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const data = await ordersApi.detail(id)
    return data.order
  } catch (error) {
    return rejectWithValue(reject(error, 'Could not load that delivery'))
  }
})

export const fetchCategories = createAsyncThunk('orders/categories', async () => {
  const data = await ordersApi.categories()
  return data.categories
})

export const fetchAvailableCouriers = createAsyncThunk('orders/couriers', async () => {
  const data = await ordersApi.couriers()
  return data.couriers
})

export const fetchQuote = createAsyncThunk('orders/quote', async (payload, { rejectWithValue }) => {
  try {
    return await ordersApi.quote(payload)
  } catch (error) {
    return rejectWithValue(reject(error, 'Could not price that route'))
  }
})

export const createOrder = createAsyncThunk(
  'orders/create',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await ordersApi.create(payload)
      return data.order
    } catch (error) {
      return rejectWithValue(reject(error, 'Could not place your order'))
    }
  },
)

export const changeDestination = createAsyncThunk(
  'orders/changeDestination',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await ordersApi.changeDestination(id, payload)
      return data.order
    } catch (error) {
      return rejectWithValue(reject(error, 'Could not change the destination'))
    }
  },
)

export const cancelOrder = createAsyncThunk('orders/cancel', async (id, { rejectWithValue }) => {
  try {
    const data = await ordersApi.cancel(id)
    return data.order
  } catch (error) {
    return rejectWithValue(reject(error, 'Could not cancel that delivery'))
  }
})

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },
    resetFilters(state) {
      state.filters = { status: '', search: '', page: 1 }
    },
    clearQuote(state) {
      state.quote = null
      state.quoteStatus = 'idle'
      state.quoteError = null
    },
    clearCurrent(state) {
      state.current = null
      state.detailStatus = 'idle'
      state.detailError = null
    },
    clearSaveError(state) {
      state.saveError = null
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
      .addCase(fetchOrders.pending, (state) => {
        state.listStatus = 'loading'
        state.listError = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.listStatus = 'ready'
        state.items = action.payload.items
        state.meta = action.payload.meta
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.listStatus = 'failed'
        state.listError = action.payload
      })

      .addCase(fetchOrder.pending, (state) => {
        state.detailStatus = 'loading'
        state.detailError = null
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.detailStatus = 'ready'
        state.current = action.payload
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.detailStatus = 'failed'
        state.detailError = action.payload
      })

      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload
      })

      .addCase(fetchAvailableCouriers.fulfilled, (state, action) => {
        state.couriers = action.payload
      })

      .addCase(fetchQuote.pending, (state) => {
        state.quoteStatus = 'loading'
        state.quoteError = null
      })
      .addCase(fetchQuote.fulfilled, (state, action) => {
        state.quoteStatus = 'ready'
        state.quote = action.payload
      })
      .addCase(fetchQuote.rejected, (state, action) => {
        state.quoteStatus = 'failed'
        state.quoteError = action.payload
        state.quote = null
      })

      .addCase(createOrder.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.saving = false
        state.current = action.payload
        state.items = [action.payload, ...state.items]
        state.quote = null
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(changeDestination.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(changeDestination.fulfilled, applyOrder)
      .addCase(changeDestination.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(cancelOrder.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(cancelOrder.fulfilled, applyOrder)
      .addCase(cancelOrder.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })
  },
})

export const { setFilters, resetFilters, clearQuote, clearCurrent, clearSaveError } =
  ordersSlice.actions

export const selectOrders = (state) => state.orders.items
export const selectOrdersMeta = (state) => state.orders.meta
export const selectOrdersStatus = (state) => state.orders.listStatus
export const selectOrdersError = (state) => state.orders.listError
export const selectOrderFilters = (state) => state.orders.filters
export const selectCurrentOrder = (state) => state.orders.current
export const selectDetailStatus = (state) => state.orders.detailStatus
export const selectDetailError = (state) => state.orders.detailError
export const selectCategories = (state) => state.orders.categories
export const selectAvailableCouriers = (state) => state.orders.couriers
export const selectQuote = (state) => state.orders.quote
export const selectQuoteStatus = (state) => state.orders.quoteStatus
export const selectQuoteError = (state) => state.orders.quoteError
export const selectSaving = (state) => state.orders.saving
export const selectSaveError = (state) => state.orders.saveError

export default ordersSlice.reducer
