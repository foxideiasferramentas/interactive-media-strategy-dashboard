import { RouterProvider } from "react-router";
import { router } from "./routes";
import { StoreProvider } from "./data/store";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <StoreProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" closeButton richColors />
    </StoreProvider>
  );
}
