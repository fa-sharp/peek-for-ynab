import { NotificationsContext, useNotificationsProvider } from "./notificationsContext";

export default function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useNotificationsProvider();

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
