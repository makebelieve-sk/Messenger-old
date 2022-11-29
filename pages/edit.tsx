import React from "react";
import { useRouter } from "next/router";
import { Box, CircularProgress, Paper, Tab, Tabs } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import dayjs from "dayjs";
import EditTabsModule from "../components/edit-tabs-module";
import AlertComponent from "../components/alert";
import { ApiRoutes } from "../config/enums";
import { IUser, IUserDetails } from "../types/models.types";
import Request from "../common/request";
import { selectUserState, setUser, setUserDetail } from "../state/user/slice";
import { useAppDispatch, useAppSelector } from "../hooks/useGlobalState";
import CatchErrors from "../axios/catch-errors";
import { REQUIRED_FIELD } from "../config";

import styles from "../styles/pages/edit.module.scss";

export interface IFormValues {
    name: string;
    surName: string;
    sex: string;
    birthday: dayjs.Dayjs | string;
    work: string;
    city: string;
    phone: string;
    email: string;
};

export interface IFormErrors {
    name?: string;
    surName?: string;
    phone?: string;
    email?: string;
};

export default function Edit() {
    const [tab, setTab] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [showAlert, setShowAlert] = React.useState(false);
    const [formValues, setFormValues] = React.useState<IFormValues | null>(null);
    const [formErrors, setFormErrors] = React.useState<IFormErrors | null>({});
    const [saveDisabled, setSaveDisabled] = React.useState(false);

    const { user, userDetail } = useAppSelector(selectUserState);

    const dispatch = useAppDispatch();
    const router = useRouter();

    // Установка disabled кнопке "Сохранить"
    React.useEffect(() => {
        setSaveDisabled(loading || Boolean(formErrors && Object.values(formErrors).some(Boolean)));
    }, [loading, formValues]);

    React.useEffect(() => {
        if (!userDetail && user) {
            // Получаем детальную информацию о пользователе
            Request.post(ApiRoutes.getUserDetail, { userId: user.id }, undefined,
                (data: { success: boolean, userDetail: IUserDetails }) => dispatch(setUserDetail(data.userDetail ? data.userDetail : null)),
                (error: any) => CatchErrors.catch(error, router, dispatch)
            );
        }
    }, [user]);

    React.useEffect(() => {
        if (user && userDetail) {
            setFormValues({
                name: user.firstName,
                surName: user.thirdName,
                sex: userDetail.sex,
                birthday: userDetail.birthday ? userDetail.birthday : "2000-01-01",
                work: userDetail.work,
                city: userDetail.city,
                phone: user.phone,
                email: user.email,
            });
        }
    }, [user, userDetail]);

    const onChangeTab = (_: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
        setShowAlert(false);
    };

    const onChange = (field: string, value: string | boolean | Date | null) => {
        if (formValues) {
            setFormValues({
                ...formValues,
                [field]: value
            });

            if (["name", "surName", "phone", "email"].includes(field)) {
                setFormErrors({
                    [field]: value ? "" : REQUIRED_FIELD
                })
            }
        }
    };

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        try {
            event.preventDefault();

            if (user && formValues && !saveDisabled) {
                const result = {
                    ...formValues,
                    userId: user.id
                };

                if (result["birthday"] && typeof result["birthday"] !== "string") {
                    result["birthday"] = (result["birthday"] as dayjs.Dayjs).format("YYYY-MM-DD");
                }

                Request.post(ApiRoutes.editInfo, result, setLoading,
                    (data: { success: boolean, user: IUser, userDetails: IUserDetails }) => {
                        if (data.success) {
                            dispatch(setUser(data.user));
                            dispatch(setUserDetail(data.userDetails));
                            setShowAlert(true);
                        }
                    },
                    (error) => CatchErrors.catch(error, router, dispatch)
                );
            } else {
                throw new Error("Нет пользователя");
            }
        } catch (error) {
            setLoading(false);
            CatchErrors.catch("Произошла ошибка при изменении информации о пользователе: " + error, router, dispatch)
        }
    };

    return <Paper className={styles["edit-container"]}>
        <Tabs
            orientation="vertical"
            value={tab}
            onChange={onChangeTab}
            aria-label="Edit tabs"
            className={styles["edit-container__tabs"]}
        >
            <Tab label="Основное" id="main" aria-controls="main" disabled={loading} className={styles["edit-container__tab-name"]} />
            <Tab label="Контакты" id="contacts" aria-controls="contacts" disabled={loading} className={styles["edit-container__tab-name"]} />
        </Tabs>

        <div className={styles["edit-container__module"]}>
            {user && userDetail && formValues
                ? <Box component="form" noValidate onSubmit={onSubmit}>
                    <EditTabsModule tab={tab} formValues={formValues} formErrors={formErrors} onChange={onChange} />

                    <LoadingButton
                        fullWidth
                        type="submit"
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        loading={loading}
                        disabled={saveDisabled}
                    >
                        Сохранить
                    </LoadingButton>

                    {showAlert
                        ? <AlertComponent show={showAlert}>
                            <><b>Изменения сохранены</b> - новые данные будут отражены на Вашей странице.</>
                        </AlertComponent>
                        : null
                    }
                </Box>
                : <div className="edit-container__module__spinner"><CircularProgress /></div>
            }
        </div>
    </Paper>
};