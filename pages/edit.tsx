import React from "react";
import { useRouter } from "next/router";
import { Paper, Tab, Tabs } from "@mui/material";
import EditTabsModule from "../components/edit-tabs-module";
import { IMainValues } from "../components/edit-tabs-module/main";
import { ApiRoutes, Pages } from "../config/enums";
import { IUser, IUserDetails } from "../types/models.types";
import Request from "../common/request";
import { selectUserState, setUser, setUserDetail } from "../state/user/slice";
import { useAppDispatch, useAppSelector } from "../hooks/useGlobalState";
import CatchErrors from "../axios/catch-errors";
import AlertComponent from "../components/alert";
import { IContactsValues } from "../components/edit-tabs-module/contacts";

import styles from "../styles/pages/edit.module.scss";

export default function Edit() {
    const [tab, setTab] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [showAlert, setShowAlert] = React.useState(false);

    const { user } = useAppSelector(selectUserState);

    const dispatch = useAppDispatch();
    const router = useRouter();

    const onChangeTab = (_: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
        setShowAlert(false);
    };

    const onChange = (field: string, value: string | boolean | Date | null, setFormValues: React.Dispatch<React.SetStateAction<any>>, formValues: IMainValues | IContactsValues) => {
        setFormValues({
            ...formValues,
            [field]: value
        });
    };

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>, route: ApiRoutes, formValues: IMainValues | IContactsValues) => {
        try {
            event.preventDefault();

            if (user) {
                Request.post(route, { ...formValues, userId: user.id }, setLoading, 
                    (data: { success: boolean, user: IUser, userDetail: IUserDetails }) => {
                        dispatch(setUser(data.user));
                        dispatch(setUserDetail(data.userDetail));
                        setShowAlert(true);
                    }, 
                    (error: any) => CatchErrors.catch(error, router, dispatch)
                );
            } else {
                throw new Error("Нет пользователя");
            }
        } catch (error) {
            setLoading(false);
            console.log("Произошла ошибка при изменении информации о пользователе: ", error);
            router.push(Pages.error);
        }
    };

    return <Paper sx={{ display: "flex", flexGrow: 1, width: "100%" }}>
        <Tabs
            orientation="vertical"
            value={tab}
            onChange={onChangeTab}
            aria-label="Edit tabs"
            sx={{ borderRight: 1, borderColor: "divider", width: "20%" }}
        >
            <Tab label="Основное" id="main" aria-controls="main-control" disabled={loading} />
            <Tab label="Контакты" id="contacts" aria-controls="contacts-control" disabled={loading} />
        </Tabs>

        <div className={styles["edit-container_edit-tabs-module"]}>
            <AlertComponent show={showAlert}>
                <><b>Изменения сохранены</b> - новые данные будут отражены на Вашей странице.</>
            </AlertComponent>
            <EditTabsModule tab={tab} loading={loading} onSubmit={onSubmit} onChange={onChange} />
        </div>
    </Paper>
};