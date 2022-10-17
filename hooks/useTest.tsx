import React from "react";
import { Provider } from "react-redux";
import store from "../state/store";

export default function useTest(component: JSX.Element) {
    return <Provider store={store}>
        {component}
    </Provider>
};