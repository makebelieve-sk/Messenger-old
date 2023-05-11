import React from "react";
import { IFormErrors, IFormValues } from "../../pages/edit";
import Contacts from "./contacts";
import Main from "./main";

interface IEditTabsModule extends ITabModule {
    tab: number;
};

export interface ITabModule {
    formValues: IFormValues;
    formErrors: IFormErrors | null;
    onChange: (field: string, value: string | boolean | Date | null) => void;
};

enum TAB_NUMBER {
    MAIN = 0,
    CONTACTS = 1
};

export default React.memo(function EditTabsModule({ tab, formValues, formErrors, onChange }: IEditTabsModule) {
    switch (tab) {
        case TAB_NUMBER.MAIN:
            return <div 
                role="tabpanel" 
                id={`vertical-tabpanel-${TAB_NUMBER.MAIN}`} 
                aria-labelledby={`vertical-tab-${TAB_NUMBER.MAIN}`}
            >
                <Main formValues={formValues} formErrors={formErrors} onChange={onChange} />
            </div>;
        case TAB_NUMBER.CONTACTS:
            return <div 
                role="tabpanel" 
                id={`vertical-tabpanel-${TAB_NUMBER.CONTACTS}`} 
                aria-labelledby={`vertical-tab-${TAB_NUMBER.CONTACTS}`}
            >
                <Contacts formValues={formValues} formErrors={formErrors} onChange={onChange} />
            </div>;
        default:
            return null;
    }
});