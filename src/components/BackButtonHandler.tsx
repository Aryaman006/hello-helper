import { App as CapacitorApp } from "@capacitor/app";
import { Toast } from "@capacitor/toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import type { PluginListenerHandle } from "@capacitor/core";

const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPress = useRef<number>(0);

  useEffect(() => {
    let listener: PluginListenerHandle | null = null;

    const setupListener = async () => {
      listener = await CapacitorApp.addListener("backButton", () => {
        // If not on home, go back
        if (location.pathname !== "/") {
          navigate(-1);
          return;
        }

        // Double back to exit on home
        const now = Date.now();
        if (now - lastBackPress.current < 2000) {
          CapacitorApp.exitApp();
        } else {
          lastBackPress.current = now;
          Toast.show({
            text: "Press back again to exit",
            duration: "short",
          });
        }
      });
    };

    setupListener();

    return () => {
      listener?.remove();
    };
  }, [location.pathname, navigate]);

  return null;
};

export default BackButtonHandler;
