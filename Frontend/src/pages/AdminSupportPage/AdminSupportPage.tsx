import "./AdminSupportPage.scss";
import Button from "../../components/Button/Button";
import Textarea from "../../components/Textarea/Textarea";
import { getAdminTickets, getMessages, answerTicket, updateTicketStatus } from "../../api/ApiSupport";
import { useCallback, useEffect, useRef, useState } from "react";

export default function AdminSupportPage() {
    const [supportTickets, setSupportTickets] = useState<any[]>([]);
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [chatInputText, setChatInputText] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [sortStatus, setSortStatus] = useState("all");

    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchTicketMessages = useCallback(async (ticketId: number) => {
        const messages = await getMessages(ticketId);
        setChatMessages(messages);
    }, []);

    const fetchSupportTickets = useCallback(async () => {
        const tickets = await getAdminTickets();
        setSupportTickets(tickets);
    }, []);

    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    const startPolling = useCallback(() => {
        fetchSupportTickets();
        pollingIntervalRef.current = setInterval(() => {
            fetchSupportTickets();
            setSelectedTicketId((currentId) => {
                if (currentId) fetchTicketMessages(currentId);
                return currentId;
            });
        }, 5000);
    }, [fetchSupportTickets, fetchTicketMessages]);

    useEffect(() => {
        startPolling();
        return () => stopPolling();
    }, [startPolling, stopPolling]);

    const handleSelectTicket = (ticketId: number) => {
        setSelectedTicketId(ticketId);
        fetchTicketMessages(ticketId);
    };

    const handleChatInputChange = (e: React.FormEvent<HTMLTextAreaElement>) => {
        setChatInputText((e.target as HTMLTextAreaElement).value);
    };

    const handleSendMessage = async () => {
        if (!selectedTicketId) return;
        const resp = await answerTicket(selectedTicketId, chatInputText);
        if (resp) {
            setChatInputText("");
            setChatMessages((prev) => [...prev, resp]);
        }
    };

    const handleFilterChange = (category: string) => {
        setFilterCategory(category);
        setSelectedTicketId(null);
        setChatMessages([]);
    };

    const handleSortChange = (status: string) => {
        setSortStatus(status);
        setSelectedTicketId(null);
        setChatMessages([]);
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedTicketId) return;
        try {
            await updateTicketStatus(selectedTicketId, newStatus);
            setSupportTickets((prev) => prev.map((t) => (t.ticket_id === selectedTicketId ? { ...t, status: newStatus } : t)));
        } catch (error) {
            console.error("Failed to update ticket status:", error);
        }
    };

    const getTicketStatus = (ticket: any) => {
        const status = ticket.status;
        if (status === "in_progress") return "pending";
        return status;
    };

    const getFilteredSortedTickets = () => {
        let filtered = supportTickets;

        if (filterCategory !== "all") {
            filtered = filtered.filter((t: any) => t.theme === filterCategory);
        }

        if (sortStatus !== "all") {
            const priority = sortStatus;
            filtered = [...filtered].sort((a: any, b: any) => {
                if (a.status === priority && b.status !== priority) return -1;
                if (a.status !== priority && b.status === priority) return 1;
                return 0;
            });
        } else {
            const statusOrder: any = { open: 0, pending: 1, closed: 2 };
            filtered = [...filtered].sort((a: any, b: any) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3));
        }
        return filtered;
    };

    const tickets = getFilteredSortedTickets();

    const selectedTicket = supportTickets.find((t: any) => t.ticket_id === selectedTicketId);

    return (
        <div className="admin-support-page">
            <div className="support-tickets-panel">
                <div className="support-tickets-header">
                    <h2>Поддержка (Админ)</h2>
                </div>

                <div className="admin-filter-row">
                    <div className="filter-group">
                        <label>Категория</label>
                        <select value={filterCategory} onChange={(e: any) => handleFilterChange(e.target.value)}>
                            <option value="all">Все</option>
                            <option value="bug">Баг</option>
                            <option value="proposal">Предложение</option>
                            <option value="complaint">Жалоба</option>
                            <option value="other">Другое</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Сорт. по статусу</label>
                        <select value={sortStatus} onChange={(e: any) => handleSortChange(e.target.value)}>
                            <option value="all">Все</option>
                            <option value="open">Открытые</option>
                            <option value="pending">Обработка</option>
                            <option value="closed">Закрытые</option>
                        </select>
                    </div>
                </div>

                <ul className="tickets-list">
                    {tickets.map((ticket: any) => (
                        <li
                            key={ticket.id}
                            className={`ticket-item ${selectedTicketId === ticket.id ? "active" : ""}`}
                            onClick={() => handleSelectTicket(ticket.ticket_id)}>
                            <div className="ticket-subject">{ticket.header}</div>
                            <div className="ticket-meta">
                                <span className="ticket-status" data-status={getTicketStatus(ticket)}>
                                    {getTicketStatus(ticket)}
                                </span>
                                <span className="ticket-category" data-category={ticket.theme}>
                                    {ticket.theme}
                                </span>
                            </div>
                            <div className="ticket-preview">{ticket.lastMessagePreview}</div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="support-chat-panel">
                {!selectedTicketId ? (
                    <div className="chat-empty">Выберите тикет для просмотра</div>
                ) : (
                    <>
                        <div className="admin-chat-bar">
                            <div className="status-control">
                                <label>Статус:</label>
                                <select value={selectedTicket?.status || ""} onChange={(e: any) => handleStatusChange(e.target.value)}>
                                    <option value="open">Открыт</option>
                                    <option value="pending">В обработке</option>
                                    <option value="closed">Закрыт</option>
                                </select>
                            </div>
                        </div>
                        <div className="chat-messages">
                            {chatMessages.map((msg: any) => (
                                <div key={msg.id} className={`message ${msg.is_admin ? "admin" : "user"}`}>
                                    <div className="message-bubble">
                                        <div className="message-text">{msg.text}</div>
                                        {/*<div className="message-time">
												{new Date(msg.timestamp).toLocaleTimeString()}
											</div>*/}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="chat-input-area">
                            <Textarea
                                className="chat-input"
                                placeholder="Ответить как администратор..."
                                value={chatInputText}
                                onInput={handleChatInputChange}
                            />
                            <Button title="Send" name="send-message" onClick={handleSendMessage} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
