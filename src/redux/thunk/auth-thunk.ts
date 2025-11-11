import { createAsyncThunk } from "@reduxjs/toolkit";
import { API, serverAPI } from "../../api";
import { API_URL } from "../../api/url";
import type { IAuth, LoginCredentials, RegisterCredentials } from "../type";

export const loginUser = createAsyncThunk<IAuth, LoginCredentials>(
  "users/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const user = await API.post<{ result: IAuth }>(
        API_URL.auth.login,
        credentials
      );
      console.log(user);
      if (user.status !== 200) {
        return rejectWithValue("login failed");
      }
      if (user.data.result) {
        localStorage.setItem("hm-user-auth", JSON.stringify(user.data.result));
        serverAPI.setToken(user.data.result.accessToken);
        return user.data.result;
      } else {
        return {
          accessToken: "",
          refreshToken: "",
          refreshTokenExpires: "",
          accessTokenExpires: "",
          consultantId: 0,
        };
      }
    } catch (e) {
      return rejectWithValue("login failed");
    }
  }
);

export const registerUser = createAsyncThunk<IAuth, RegisterCredentials>(
  "users/register",
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const user = await API.post<IAuth>(API_URL.auth.register, credentials);
      console.log(user.data);
      return user.data;
    } catch (e) {
      return rejectWithValue("login failed");
    }
  }
);
