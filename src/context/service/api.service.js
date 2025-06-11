import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Create a base query instance for Redux Toolkit Query
const baseQuery = fetchBaseQuery({
  baseUrl: "https://lolaaftol-b.vercel.app/api",
  // baseUrl: "http://localhost:8081/api",
  prepareHeaders: (headers, { getState }) => {
    const token = localStorage.getItem("access_token");

    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});
export const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  if (result?.error && result?.error?.status === 401) {
    localStorage.clear();
    sessionStorage.clear();
  }
  return result;
};
// gfhghf
// Create an auto-generated hooks for each endpoint
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["update", "device", "Sales", "Debtor"],
  endpoints: (builder) => ({}),
});
