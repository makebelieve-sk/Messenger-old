import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./user/slice";
import errorReducer from "./error/slice";
import friendsReducer from "./friends/slice";
import mainReducer from "./main/slice";
import messagesReducer from "./messages/slice";
import callsReducer from "./calls/slice";

export default configureStore({
    reducer: {
        main: mainReducer,
        users: userReducer,
        error: errorReducer,
        friends: friendsReducer,
        messages: messagesReducer,
        calls: callsReducer,
    },
    // Мидлвар для устранения предупреждения при передаче не сериализованных объектов
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false
    }),
});