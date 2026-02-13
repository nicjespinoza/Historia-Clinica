import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const CLIENT_ID = "843268367458-vs3kq8sa17dpe4c93ec461kf9q0ld58c.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar";

declare global {
    interface Window {
        google: any;
        gapi: any;
    }
}

export interface CalendarEvent {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string; timeZone?: string };
    end: { dateTime?: string; date?: string; timeZone?: string };
    description?: string;
    htmlLink?: string;
}

export const useGoogleCalendar = () => {
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('google_access_token'));
    const [isAuthorized, setIsAuthorized] = useState(!!localStorage.getItem('google_access_token'));
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);

    // Initialize Google Identity Services
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.google) {
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (response: any) => {
                        if (response.access_token) {
                            setAccessToken(response.access_token);
                            setIsAuthorized(true);
                            localStorage.setItem('google_access_token', response.access_token);
                            toast.success('Calendario conectado exitosamente');
                            // Load events immediately after login
                            listUpcomingEvents(response.access_token);
                        }
                    },
                });
                setTokenClient(client);
            }
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Initial load if already authorized
    useEffect(() => {
        if (accessToken && isAuthorized) {
            listUpcomingEvents(accessToken);
        }
    }, [accessToken, isAuthorized]);

    const login = () => {
        if (tokenClient) {
            // Skip prompt if we want seamless re-auth, but usually prompt is good for switching accounts
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            toast.error('Google Services no cargado aún. Intente de nuevo.');
        }
    };

    const logout = () => {
        const token = accessToken;
        if (token && window.google) {
            window.google.accounts.oauth2.revoke(token, () => {
                console.log('Token revoked');
            });
        }
        setAccessToken(null);
        setIsAuthorized(false);
        setEvents([]);
        localStorage.removeItem('google_access_token');
        toast.info('Calendario desconectado');
    };

    // --- API OPERATIONS ---

    const listUpcomingEvents = async (token = accessToken, timeMin?: string, timeMax?: string) => {
        if (!token) return;
        setLoading(true);
        try {
            const min = timeMin || new Date().toISOString();
            // Default max: 30 days from min if not provided, or undefined (API default)
            const queryParams = new URLSearchParams({
                timeMin: min,
                maxResults: '250', // Increase limit
                singleEvents: 'true',
                orderBy: 'startTime'
            });
            if (timeMax) queryParams.append('timeMax', timeMax);

            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.items) {
                setEvents(data.items);
            } else if (data.error) {
                if (data.error.code === 401) {
                    // Token expired
                    logout();
                    toast.error('Sesión de Google expirada. Conecte de nuevo.');
                }
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Error al cargar eventos de Google');
        } finally {
            setLoading(false);
        }
    };

    const createEvent = async (event: { summary: string; description: string; start: string; end: string; location?: string, email?: string }) => {
        if (!accessToken) {
            toast.error('No conectado a Google Calendar');
            return null;
        }

        const eventResource = {
            summary: event.summary,
            location: event.location || 'Consultorio Dr. Milton Mairena',
            description: event.description,
            start: {
                dateTime: event.start, // ISO String
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
                dateTime: event.end, // ISO String
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            attendees: event.email ? [{ email: event.email }] : [],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 30 },
                ],
            },
        };

        try {
            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventResource),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Evento creado en Google Calendar');
                listUpcomingEvents(); // Refresh
                return data;
            } else {
                console.error('GCalendar Error:', data);
                toast.error('Error al crear evento en Google: ' + (data.error?.message || 'Unknown'));
                return null;
            }
        } catch (error) {
            console.error('Network Error:', error);
            toast.error('Error de red al conectar con Google');
            return null;
        }
    };

    const updateEvent = async (eventId: string, event: { summary: string; description: string; start: string; end: string; location?: string, email?: string }) => {
        if (!accessToken) return null;

        const eventResource = {
            summary: event.summary,
            location: event.location || 'Consultorio Dr. Milton Mairena',
            description: event.description,
            start: { dateTime: event.start, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            end: { dateTime: event.end, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            attendees: event.email ? [{ email: event.email }] : [],
        };

        try {
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventResource),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success('Evento actualizado en Google Calendar');
                listUpcomingEvents();
                return data;
            } else {
                console.error('GCalendar Update Error:', data);
                return null;
            }
        } catch (error) {
            console.error('Network Error:', error);
            return null;
        }
    };

    const deleteEvent = async (eventId: string) => {
        if (!accessToken) return false;
        try {
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            if (response.ok) {
                toast.success('Evento eliminado de Google Calendar');
                listUpcomingEvents();
                return true;
            } else {
                console.error('GCalendar Delete Error');
                return false;
            }
        } catch (error) {
            console.error('Network Error:', error);
            return false;
        }
    };

    return {
        login,
        logout,
        isAuthorized,
        events,
        createEvent,
        updateEvent,
        deleteEvent,
        refreshEvents: (min?: string, max?: string) => listUpcomingEvents(accessToken, min, max),
        loading
    };
};
