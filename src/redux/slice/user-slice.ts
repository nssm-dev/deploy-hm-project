import {
  createDraftSafeSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { loginUser, registerUser } from "../thunk/auth-thunk";
import type { IAuth, IAuthUserState, RootState } from "../type";

const authInitialState: IAuthUserState = {
  user: null,
  loading: "idle",
  error: null,
};

export const authUserSlice = createSlice({
  name: "auth-user-slice",
  initialState: authInitialState,
  reducers: {
    setUserData: (state, action: PayloadAction<IAuth>) => {
      state.user = action.payload;
      state.loading = "succeeded";
    },
    clearUser: (state) => {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      loginUser.fulfilled,
      (state: IAuthUserState, action: PayloadAction<IAuth>) => {
        state.loading = "succeeded";
        state.user = action.payload;
      }
    );
    builder.addCase(loginUser.rejected, (state: IAuthUserState, action) => {
      state.error = action.payload as string;
      state.loading = "failed";
      state.user = null;
    });
    builder.addCase(
      registerUser.fulfilled,
      (state: IAuthUserState, action: PayloadAction<IAuth>) => {
        state.loading = "succeeded";
        state.user = action.payload;
      }
    );
    builder.addCase(registerUser.rejected, (state: IAuthUserState, action) => {
      state.error = action.payload as string;
      state.loading = "failed";
      state.user = null;
    });
  },
});

export const { clearUser, setUserData } = authUserSlice.actions;
export const authUserSliceReducer = authUserSlice.reducer;

export const authUserSelector = createDraftSafeSelector(
  (state: RootState) => state.authUser,
  (auth: IAuthUserState) => auth
);
