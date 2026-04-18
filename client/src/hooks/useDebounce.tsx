import React, { useEffect, useState } from 'react'

interface IUseDebounce {
    value: string | number;
    delay: number;
}

const useDebounce = ({ value, delay }: IUseDebounce) => {

    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);

    }, [value, delay])

    return debouncedValue;
}

export default useDebounce