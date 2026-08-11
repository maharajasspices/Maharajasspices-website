import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

type NotificationType = "success" | "error" | "warning" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  duration?: number;
}

interface NotificationContextType {
  notify: (notification: Omit<Notification, "id">) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: "text-green-500",
  error: "text-destructive",
  warning: "text-yellow-500",
  info: "text-primary",
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  const notify = (notification: Omit<Notification, "id">) => {
    const id = crypto.randomUUID();
    const newNotification = { ...notification, id };
    setNotifications((prev) => [...prev, newNotification]);
  };

  useEffect(() => {
    if (!currentNotification && notifications.length > 0) {
      setCurrentNotification(notifications[0]);
      setNotifications((prev) => prev.slice(1));
    }
  }, [currentNotification, notifications]);

  const handleClose = () => {
    setCurrentNotification(null);
  };

  const Icon = currentNotification ? iconMap[currentNotification.type] : null;

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <AlertDialog open={!!currentNotification} onOpenChange={(open) => !open && handleClose()}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {Icon && <Icon className={`h-5 w-5 ${colorMap[currentNotification?.type || "info"]}`} />}
              {currentNotification?.title}
            </AlertDialogTitle>
            {currentNotification?.description && (
              <AlertDialogDescription>
                {currentNotification.description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleClose}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NotificationContext.Provider>
  );
}
