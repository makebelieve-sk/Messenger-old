import { createSlice } from "@reduxjs/toolkit";
import reducers from "./reducers";
import { InitialStateType, RootState } from "../../types/redux.types";
import { CallStatus } from "../../types/enums";

export type CallsType = Pick<InitialStateType, 
    "visible" | 
    "status" | 
    "callId" | 
    "localStream" |
    "chatInfo" |
    "users"
>;

// Начальное состояние
export const initialState: CallsType = {
    visible: false,
    status: CallStatus.NOT_CALL,
    callId: null,
    localStream: null,
    chatInfo: null,
    users: null,
};

export const callsSlice = createSlice({
    name: "calls",
    initialState,
    reducers,
});

// Состояние
export const selectCallsState = (state: RootState) => state.calls;

// Экшены
export const { 
    setModalVisible, 
    // setCallingUser, 
    setStatus,
    setCallId, 
    // setIsSingle, 
    // setChatName, 
    setLocalStream,
    // setCallSettings,
    setChatInfo,
    setUsers,
} = callsSlice.actions;

// Редьюсер
export default callsSlice.reducer;