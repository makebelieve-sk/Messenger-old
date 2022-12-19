import React from "react";
import { useRouter } from "next/router";
import { Link, Typography } from "@mui/material";
import { Pages } from "../../types/enums";

export default function Copyright(props: any) {
    const router = useRouter();

    return (
        <Typography variant="body2" color="text.secondary" align="center" {...props}>
            Copyright ©
            <Link href={Pages.aboutUs} variant="body2" onClick={() => router.push(Pages.aboutUs)}>
                ВК-КЛОН
            </Link>
            {" "}{new Date().getFullYear()}.
        </Typography>
    );
};