/**
 * Компонент отрисовывается при каждом рендере любой существующей страницы
 * В файле _app.tsx в теге Head нужно использовать теги meta и title
 * Нельзя использовать теги link
 */
import React from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Provider } from "react-redux";
import store from "../state/store";
import App from "../components/app";

import styles from "../styles/pages/_app.module.scss";
import "../styles/ui.css";
import "../styles/globals.css";

export default function _App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <title>Мессенджер</title>
      </Head>

      <div className={styles["main"]}>
        <Provider store={store}>
          <App Component={Component} pageProps={pageProps} />
        </Provider>
      </div>
    </>
  );
};