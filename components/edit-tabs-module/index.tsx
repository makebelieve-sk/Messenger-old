import React from "react";
import Contacts, { IContacts } from "./contacts";
import Main, { IMain } from "./main";

type IEditTabsModule = IMain & IContacts & {
    tab: number;
};

enum TAB_NUMBER {
    MAIN = 0,
    CONTACTS = 1
};

export default function EditTabsModule({ tab, loading, onSubmit, onChange }: IEditTabsModule) {
    switch (tab) {
        case TAB_NUMBER.MAIN:
            return <div role="tabpanel" id={`vertical-tabpanel-${TAB_NUMBER.MAIN}`} aria-labelledby={`vertical-tab-${TAB_NUMBER.MAIN}`}>
                <Main loading={loading} onSubmit={onSubmit} onChange={onChange} />
            </div>;
        case TAB_NUMBER.CONTACTS:
            return <div role="tabpanel" id={`vertical-tabpanel-${TAB_NUMBER.CONTACTS}`} aria-labelledby={`vertical-tab-${TAB_NUMBER.CONTACTS}`}>
                <Contacts loading={loading} onSubmit={onSubmit} onChange={onChange} />
            </div>;
        default:
            return null;
    }
};