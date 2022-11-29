import { AnyAction, Dispatch, ThunkDispatch } from "@reduxjs/toolkit";
import { NextRouter } from "next/router";
import { HTTPStatuses, Pages } from "../config/enums";
import { setError } from "../state/error/slice";
import { RootState } from "../types/redux.types";

type DispatchType = ThunkDispatch<RootState, undefined, AnyAction> & Dispatch<AnyAction>;
type BadRequestType = { success: boolean; message: string; field?: string; } | string | null;

class CatchErrors {
    private errorMessage = "Ошибка";
    private errorTimeout = "Возникли проблемы с БД или время ожидания ответа превысило 15 секунд";

    public catch(error: any, router: NextRouter, dispatch: DispatchType): BadRequestType {
        console.error(error);

        if (error.response) {
            const { status } = error.response;

            switch (status) {
                case HTTPStatuses.PermanentRedirect: return this.PermanentRedirect(error, router);
                case HTTPStatuses.BadRequest: return this.BadRequest(error);
                case HTTPStatuses.Unauthorized: return this.Unauthorized(error, router);
                case HTTPStatuses.Forbidden: return this.Forbidden(error, router);
                case HTTPStatuses.NotFound: return this.NotFound(error, dispatch);
                case HTTPStatuses.ServerError: return this.ServerError(error, dispatch);
                default: return this.ServerError(error, dispatch);
            };
        } else if (error.request) {
            return this.TimeoutError(error.message ?? this.errorTimeout, dispatch);
        } else {
            return this.ServerError(error, dispatch);
        }
    };

    // Статус 308
    private PermanentRedirect(_: any, router: NextRouter) {
        router.replace(Pages.profile);
        return null;
    };

    // Статус 400
    private BadRequest(error: any): BadRequestType {
        return error.response.data ?? error.message ?? this.errorMessage;
    };

    // Статус 401
    private Unauthorized(_: any, router: NextRouter) {
        router.replace(router.pathname !== Pages.signUp ? Pages.signIn : Pages.signUp);
        return null;
    };

    // Статус 403
    private Forbidden(error: any, router: NextRouter) {
        console.log("forbidden", error);
        router.push(Pages.signIn);
        return null;
    };

    // Статус 404 - скорее всего 404 не будет использоваться
    private NotFound(error: any, dispatch: DispatchType) {
        dispatch(setError(error.message));
        return null;
    };
    
    // Статус 500 или серъезная ошибка сервера
    private ServerError(error: any, dispatch: DispatchType) {
        dispatch(setError(error.message));
        return null;
    };

    // Время ожидания ответа от сервера
    private TimeoutError(message: string, dispatch: DispatchType) {
        dispatch(setError(message));
        return null;
    };
};

export default new CatchErrors();