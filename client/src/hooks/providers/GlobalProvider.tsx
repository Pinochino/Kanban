import { store } from '@/store/store';
import React from 'react'
import { Provider } from 'react-redux';

interface IGlobalProvider {
    children: React.ReactNode;
}

const GlobalProvider = ({ children }: IGlobalProvider) => {
    return (
        <Provider store={store}>{children}</Provider>
    )
}

export default GlobalProvider