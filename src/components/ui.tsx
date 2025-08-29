"use client";
import * as Tabs from "@radix-ui/react-tabs";
import * as Toast from "@radix-ui/react-toast";
import * as React from "react";
import { cn } from "@/lib/utils";

export { Tabs };

export function TabsList(props: React.ComponentProps<typeof Tabs.List>) {
  return <Tabs.List {...props} className={cn("inline-flex h-10 items-center gap-1 rounded-md bg-gray-100 p-1 text-gray-600", props.className)} />;
}
export const TabsTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Tabs.Trigger>>(function TabsTrigger({ className, ...p }, ref) {
  return <Tabs.Trigger ref={ref} {...p} className={cn("px-3 py-1.5 text-sm rounded-sm data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow", className)} />;
});
export const TabsContent = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof Tabs.Content>>(function TabsContent({ className, ...p }, ref) {
  return <Tabs.Content ref={ref} {...p} className={cn("mt-4", className)} />;
});

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={cn("inline-flex items-center justify-center rounded-md bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50", className)} />;
}
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400", className)} />;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <Toast.Provider swipeDirection="right">{children}</Toast.Provider>;
}
export const ToastViewport = React.forwardRef<HTMLOListElement, React.ComponentProps<typeof Toast.Viewport>>(function ToastViewport({ className, ...p }, ref) {
  return <Toast.Viewport ref={ref} {...p} className={cn("fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-[420px]", className)} />;
});
export function useToast() {
  const [items, setItems] = React.useState<{ id: string; title?: string; description?: string }[]>([]);
  const toast = (t: { title?: string; description?: string }) => setItems((s) => [...s, { id: crypto.randomUUID(), ...t }]);
  const remove = (id: string) => setItems((s) => s.filter((i) => i.id !== id));
  function Toaster() {
    return (
      <>
        {items.map((t) => (
          <Toast.Root key={t.id} duration={3500} onOpenChange={(open) => !open && remove(t.id)} className="rounded-md bg-white shadow border p-4">
            {t.title && <Toast.Title className="font-medium">{t.title}</Toast.Title>}
            {t.description && <Toast.Description className="text-sm text-gray-600">{t.description}</Toast.Description>}
          </Toast.Root>
        ))}
        <ToastViewport />
      </>
    );
  }
  return { toast, Toaster };
}


