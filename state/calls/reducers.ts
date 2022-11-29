import { PayloadAction } from "@reduxjs/toolkit";
import { CallStatus, CallTypes } from "../../config/enums";
import { IFriendInfo } from "../../pages/messages/[id]";
import { CallsType } from "./slice";

export default {
    setModalVisible: (state: CallsType, action: PayloadAction<boolean>) => {
        state.visible = action.payload;
    },
    setCallingUser: (state: CallsType, action: PayloadAction<IFriendInfo | null>) => {
        state.callingUser = action.payload;
    },
    setStatus: (state: CallsType, action: PayloadAction<CallStatus>) => {
        state.status = action.payload;
    },
    setType: (state: CallsType, action: PayloadAction<CallTypes | null>) => {
        state.type = action.payload;
    },
    setCallId: (state: CallsType, action: PayloadAction<string | null>) => {
        state.callId = action.payload;
    },
};