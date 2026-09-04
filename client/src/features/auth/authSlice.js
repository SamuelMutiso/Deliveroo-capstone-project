import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { authApi } from '@/api/authApi'
import { TOKEN_KEY, clearTokens, extractError, readToken, writeTokens } from '@/utils/http'

const initialState = {
  user: null,
  status: readToken(TOKEN_KEY) ? 'loading' : 'guest',
  error: null,
  submitting: false,
}

export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const data = await authApi.login(payload)
    writeTokens(data)
    return data.user
  } catch (error) {
    const body = error?.response?.data
    if (body?.verification_required) {
      return rejectWithValue({
        message: body.message,
        verificationRequired: true,
        email: body.email || payload.email,
      })
    }
    return rejectWithValue(extractError(error, 'Could not sign you in'))
  }
})

export const googleSignIn = createAsyncThunk(
  'auth/google',
  async (credential, { rejectWithValue }) => {
    try {
      const data = await authApi.google(credential)
      writeTokens(data)
      return data.user
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not sign you in with Google'))
    }
  },
)

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const data = await authApi.register(payload)
    return { email: payload.email, message: data.message }
  } catch (error) {
    return rejectWithValue(extractError(error, 'Could not create your account'))
  }
})

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.verifyEmail(payload)
      writeTokens(data)
      return data.user
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not confirm that code'))
    }
  },
)

export const resendCode = createAsyncThunk(
  'auth/resendCode',
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.resendCode(payload)
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not send another code'))
    }
  },
)

export const restoreSession = createAsyncThunk(
  'auth/restore',
  async (_, { rejectWithValue }) => {
    if (!readToken(TOKEN_KEY)) return rejectWithValue(null)
    try {
      const data = await authApi.me()
      return data.user
    } catch (error) {
      clearTokens()
      return rejectWithValue(extractError(error, null))
    }
  },
)

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.updateProfile(payload)
      return data.user
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not save your profile'))
    }
  },
)

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.changePassword(payload)
    } catch (error) {
      return rejectWithValue(extractError(error, 'Could not change your password'))
    }
  },
)

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout()
  } finally {
    clearTokens()
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionExpired(state) {
      state.user = null
      state.status = 'guest'
      state.error = 'Your session ended. Please sign in again.'
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    const authenticate = (state, action) => {
      state.user = action.payload
      state.status = 'authenticated'
      state.error = null
      state.submitting = false
    }

    builder
      .addCase(login.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(login.fulfilled, authenticate)
      .addCase(login.rejected, (state, action) => {
        state.submitting = false
        state.error = action.payload?.message ?? action.payload
      })
      .addCase(googleSignIn.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(googleSignIn.fulfilled, authenticate)
      .addCase(googleSignIn.rejected, (state, action) => {
        state.submitting = false
        state.error = action.payload
      })

      .addCase(register.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(register.fulfilled, (state) => {
        state.submitting = false
        state.error = null
      })
      .addCase(register.rejected, (state, action) => {
        state.submitting = false
        state.error = action.payload
      })
      .addCase(verifyEmail.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(verifyEmail.fulfilled, authenticate)
      .addCase(verifyEmail.rejected, (state, action) => {
        state.submitting = false
        state.error = action.payload
      })
      .addCase(restoreSession.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(restoreSession.fulfilled, authenticate)
      .addCase(restoreSession.rejected, (state) => {
        state.user = null
        state.status = 'guest'
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.status = 'guest'
        state.error = null
      })
  },
})

export const { sessionExpired, clearAuthError } = authSlice.actions

export const selectUser = (state) => state.auth.user
export const selectRole = (state) => state.auth.user?.role ?? null
export const selectAuthStatus = (state) => state.auth.status
export const selectAuthError = (state) => state.auth.error
export const selectAuthSubmitting = (state) => state.auth.submitting

export default authSlice.reducer
