import { PayloadAction } from "@reduxjs/toolkit";
import { CallStatus } from "../../types/enums";
import { IChatInfo, IFriendInfo } from "../../pages/messages/[id]";
import { CallsType } from "./slice";

export default {
    setModalVisible: (state: CallsType, action: PayloadAction<boolean>) => {
        state.visible = action.payload;
    },
    setStatus: (state: CallsType, action: PayloadAction<CallStatus>) => {
        state.status = action.payload;
    },
    setCallId: (state: CallsType, action: PayloadAction<string | null>) => {
        state.callId = action.payload;
    },
    setLocalStream: (state: CallsType, action: PayloadAction<MediaStream | null>) => {
        if (!action.payload && state.localStream) {
            state.localStream.getTracks().forEach(track => track.stop());
        }

        state.localStream = action.payload;
    },
    setChatInfo: (state: CallsType, action: PayloadAction<IChatInfo | null>) => {
        state.chatInfo = action.payload;
    },
    setUsers: (state: CallsType, action: PayloadAction<IFriendInfo[]>) => {
        state.users = action.payload;
    },
};