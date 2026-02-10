import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../components/ui/sidebar";
import {
    IconUsers,
    IconCalendar,
    IconBell,
    IconLogout,
    IconLayoutDashboard,
    IconHome,
    IconMessageCircle
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { useNavigate, useLocation } from 'react-router-dom';

interface AssistantLayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
    currentUser: string | null;
}

export function AssistantLayout({ children, onLogout, currentUser }: AssistantLayoutProps) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const isFullPageScreen = ['/history/', '/consult/', '/agenda', '/patients', '/assistant/agenda', '/assistant/patients'].some(path => location.pathname.includes(path));

    const links = [
        {
            label: "Inicio",
            href: "/app/assistant",
            icon: (
                <IconHome className="h-5 w-5 shrink-0 stroke-[3]" />
            ),
            onClick: () => navigate('/app/assistant')
        },
        {
            label: "Pacientes",
            href: "/app/assistant/patients",
            icon: (
                <IconUsers className="h-5 w-5 shrink-0 stroke-[3]" />
            ),
            onClick: () => navigate('/app/assistant/patients')
        },
        {
            label: "Agenda",
            href: "/app/assistant/agenda",
            icon: (
                <IconCalendar className="h-5 w-5 shrink-0 stroke-[3]" />
            ),
            onClick: () => navigate('/app/assistant/agenda')
        },
        {
            label: "Chat",
            href: "/app/assistant/chat",
            icon: (
                <IconMessageCircle className="h-5 w-5 shrink-0 stroke-[3]" />
            ),
            onClick: () => navigate('/app/assistant/chat')
        },
        {
            label: "Notificaciones",
            href: "/app/assistant/notifications",
            icon: (
                <IconBell className="h-5 w-5 shrink-0 stroke-[3]" />
            ),
            onClick: () => navigate('/app/assistant/notifications')
        },
        {
            label: "Cerrar Sesión",
            href: "#",
            icon: (
                <IconLogout className="h-5 w-5 shrink-0 stroke-[3]" />
            ),
            onClick: onLogout
        },
    ];

    return (
        <div
            className={cn(
                "flex flex-col md:flex-row bg-background-light w-full flex-1 max-w-full mx-auto overflow-hidden text-slate-800",
                "h-screen"
            )}
        >
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10">
                    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                        {open ? <Logo /> : <LogoIcon />}
                        <div className="mt-8 flex flex-col gap-2">
                            {links.map((link, idx) => (
                                <SidebarLink
                                    key={idx}
                                    link={link}
                                    isActive={link.href !== '#' && location.pathname === link.href}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <SidebarLink
                            link={{
                                label: currentUser || "Asistente",
                                href: "#",
                                icon: (
                                    <div className="h-7 w-7 shrink-0 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs">
                                        {currentUser ? currentUser.charAt(0).toUpperCase() : "A"}
                                    </div>
                                ),
                            }}
                        />
                    </div>
                </SidebarBody>
            </Sidebar>
            <div className="flex flex-1">
                <div className={cn(
                    "rounded-tl-2xl flex flex-col gap-2 flex-1 w-full h-full overflow-y-auto",
                    isFullPageScreen ? "p-0" : "p-2 md:p-10"
                )}>
                    {children}
                </div>
            </div>
        </div>
    );
}

export const Logo = () => {
    return (
        <a
            href="#"
            className="font-normal flex items-center py-1 relative z-20"
        >
            <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src="https://static.wixstatic.com/media/3743a7_bc65d6328e9c443e95b330a92181fbc8~mv2.png/v1/crop/x_13,y_9,w_387,h_61/fill/w_542,h_85,al_c,lg_1,q_85,enc_avif,quality_auto/logo-drmairenavalle.png"
                alt="Dr. Milton Mairena Valle"
                className="h-10 w-auto object-contain"
            />
        </a>
    );
};

export const LogoIcon = () => {
    return (
        <a
            href="#"
            className="font-normal flex items-center py-1 relative z-20"
        >
            <img
                src="https://static.wixstatic.com/media/3743a7_bc65d6328e9c443e95b330a92181fbc8~mv2.png/v1/crop/x_13,y_9,w_387,h_61/fill/w_542,h_85,al_c,lg_1,q_85,enc_avif,quality_auto/logo-drmairenavalle.png"
                alt="Dr. Milton Mairena Valle"
                className="h-8 w-auto object-contain"
            />
        </a>
    );
};
