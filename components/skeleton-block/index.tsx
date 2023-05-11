import React from "react";
import Skeleton from "@mui/material/Skeleton";

interface ISkeletonBlock {
    keyProp: string;
    className: string;
};

export default React.memo(function SkeletonBlock({ keyProp, className }: ISkeletonBlock) {
    const skeletonsPossibleFriends: JSX.Element[] = new Array(5).fill(
        <div className="skeleton-container__block">
            <Skeleton variant="circular" className="skeleton-container__img" />
            <Skeleton variant="text" className="skeleton-container__text" />
        </div>
    );

    return <>
        {skeletonsPossibleFriends.map((skeleton, index) => {
            return <div key={keyProp + index} className={className}>
                {skeleton}
            </div>
        })}
    </>;
});