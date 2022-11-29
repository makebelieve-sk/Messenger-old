import { createSlice } from "@reduxjs/toolkit";
import reducers from "./reducers";
import { InitialStateType, RootState } from "../../types/redux.types";
import { CallStatus } from "../../config/enums";

export type CallsType = Pick<InitialStateType, "visible" | "status" | "type" | "callingUser" | "callId">;

// Начальное состояние
export const initialState: CallsType = {
    visible: false,
    status: CallStatus.NOT_CALL,
    type: null,
    callingUser: null,
    callId: null,
};

export const callsSlice = createSlice({
    name: "calls",
    initialState,
    reducers,
});

// Состояние
export const selectCallsState = (state: RootState) => state.calls;

// Экшены
export const { setModalVisible, setCallingUser, setStatus, setType, setCallId } = callsSlice.actions;

// Редьюсер
export default callsSlice.reducer;