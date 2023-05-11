import React from "react";

export default function useDebounce(value: string = "", delay: number = 500) {
    const [debouncedValue, setDebouncedValue] = React.useState("");

    React.useEffect(() => {
        let timerId: NodeJS.Timeout | undefined = undefined;

        timerId = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timerId);
        }
    }, [value]);

    return debouncedValue;
};