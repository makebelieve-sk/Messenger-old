import { PayloadAction } from "@reduxjs/toolkit";
import { ErrorType } from "./slice";

export default {
    setError: (state: ErrorType, action: PayloadAction<string | null>) => {
        state.error = action.payload;
    },
};