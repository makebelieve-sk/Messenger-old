import React from "react";
import { useRouter } from "next/router";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { Pages } from "../../types/enums";

import styles from "./copyright.module.scss";

export default React.memo(function Copyright() {
    const router = useRouter();

    return (
        <Typography variant="body2" color="text.secondary" align="center" className={styles["copyright"]}>
            Copyright ©
            <Link href={Pages.aboutUs} variant="body2" onClick={() => router.push(Pages.aboutUs)}>
                ВК-КЛОН
            </Link>
            {" "}{new Date().getFullYear()}.
        </Typography>
    );
});