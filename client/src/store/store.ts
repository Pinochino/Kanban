import { configureStore, createAsyncThunk } from '@reduxjs/toolkit';
import reducers from './slice/RootSlice';
import logger from 'redux-logger';
import storage from "redux-persist/lib/storage";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";

const persistConfig = {
    key: "root",
    storage,
    whitelist: ["auth"],
};

const persistedReducer = persistReducer(persistConfig, reducers); 

export const store = configureStore({
    reducer: persistedReducer, 
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER], 
            },
        }).concat(logger)
});

export const persistor = persistStore(store); 

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

