import React from "react";
import { useRouter } from "next/router";
import { Link, Typography } from "@mui/material";

export default function Copyright(props: any) {
    const router = useRouter();
    
    return (
        <Typography variant="body2" color="text.secondary" align="center" {...props}>
            Copyright ©
            <Link href="/about-us" variant="body2" onClick={() => router.push("/about-us")}>
                VK-CLON
            </Link>
            {" "}{new Date().getFullYear()}.
        </Typography>
    );
};