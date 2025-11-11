import axios, { type AxiosResponse } from "axios";
import { API_URL } from "./url";
import type { HTTPMethod } from "../types";

export const API = axios.create({
  baseURL: API_URL.base,
  headers: {
    "Content-Type": "application/json",
  },
});

class APIHandle {
  private token: string = "";

  setToken(token: string) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  get<R = unknown>(url: string) {
    return this.mainAPI<R>(url);
  }

  post<R = unknown, D = unknown>(url: string, body: D) {
    return this.mainAPI<R, D>(url, "POST", body);
  }

  put<R = unknown, D = unknown>(url: string, body: D) {
    return this.mainAPI<R, D>(url, "PUT", body);
  }

  delete<R = unknown>(url: string) {
    return this.mainAPI<R>(url, "DELETE");
  }

  private mainAPI<R = unknown, D = unknown>(
    url: string,
    method?: HTTPMethod,
    data?: D
  ) {
    return API.request<any, AxiosResponse<R>>({
      url,
      method: method || "GET",
      headers: {
        Authorization: "Bearer " + this.token,
      },
      data,
    });
  }
}

export const serverAPI = new APIHandle();
