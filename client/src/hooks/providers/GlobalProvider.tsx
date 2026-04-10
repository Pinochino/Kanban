import { ThemeProvider } from "@/components/themes/ThemeProvider";
import { store } from "@/store/store";
import React from "react";
import { Provider } from "react-redux";

interface IGlobalProvider {
  children: React.ReactNode;
}

const GlobalProvider = ({ children }: IGlobalProvider) => {
  return (
    <Provider store={store}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        {children}
      </ThemeProvider>
    </Provider>
  );
};

export default GlobalProvider;
