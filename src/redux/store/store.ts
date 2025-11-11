import {configureStore} from "@reduxjs/toolkit";
import {authUserSliceReducer} from "../slice/user-slice";

export const reduxStore = configureStore({
    reducer: {
        authUser: authUserSliceReducer
    }
})