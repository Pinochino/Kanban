import { combineReducers } from "@reduxjs/toolkit";
import { authReducer } from "./AuthSlice";

const reducers = combineReducers({
    auth: authReducer,
    
})
export default reducers;