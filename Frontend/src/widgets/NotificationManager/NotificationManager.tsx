import { useEffect, useState } from "react";
import Notification from "../Notification/Notification";

type Modal = {
  id: number;
  status: boolean;
  message?: string;
};

type Subscriber = (_modals: Modal[]) => void;

let modals: Modal[] = [];
const subscribers = new Set<Subscriber>();

function notifySubscribers() {
  subscribers.forEach((cb) => cb([...modals]));
}

export const NotificationManager = {
  show(status: boolean, message?: string): void {
    const id = Date.now() + Math.random();
    modals = [...modals, { id, status, message }];
    notifySubscribers();
  },

  removeModal(id: number): void {
    modals = modals.filter((m) => m.id !== id);
    notifySubscribers();
  },

  subscribe(cb: Subscriber): () => void {
    subscribers.add(cb);
    cb([...modals]);
    return () => {
      subscribers.delete(cb);
    };
  },
};

export default function NotificationManagerComponent() {
    const [list, setList] = useState<Modal[]>([]);

    useEffect(() => {
        const unsubscribe = NotificationManager.subscribe(setList);
        return unsubscribe;
    }, []);

    return (
        <div className="popup-manager">
            {list.map((modal, index) => (
                <Notification
                    key={modal.id}
                    isOpen={true}
                    onClose={() => NotificationManager.removeModal(modal.id)}
                    isStatus={modal.status}
                    message={modal.message}
                    index={index}
                />
            ))}
        </div>
    );
}