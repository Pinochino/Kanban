import { ActionReducerMapBuilder, createSlice, SliceCaseReducers, ValidateSliceCaseReducers } from "@reduxjs/toolkit";

export interface GenericState<T> {
    status: 'idle' | 'pending' | 'succeeded' | 'failed';
    data: T | null;
    error: string | null;
}

export const createGenericSlice = <
    State,
    T,
    Reducers extends SliceCaseReducers<State>
>({
    name = "",
    initialState,
    reducers,
    extraReducers
}: {
    name: string,
    initialState: State,
    reducers: ValidateSliceCaseReducers<State, Reducers>,
    extraReducers?: (builder: ActionReducerMapBuilder<State>) => void;
}) => {
    return createSlice({
        name,
        initialState,
        reducers,
        extraReducers
    })
}