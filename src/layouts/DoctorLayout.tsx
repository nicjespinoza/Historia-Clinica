import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../components/ui/sidebar";
import {
    IconArrowLeft,
    IconBrandTabler,
    IconSettings,
    IconUserBolt,
    IconUsers,
    IconCalendar,
    IconReportAnalytics,
    IconLogout,
    IconHome
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { useNavigate, useLocation } from 'react-router-dom';

interface DoctorLayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
    currentUser: string | null;
}

export function DoctorLayout({ children, onLogout, currentUser }: DoctorLayoutProps) {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const isFullPageScreen = ['/history/', '/consult/', '/agenda', '/patients'].some(path => location.pathname.includes(path));

    const links = [
        {
            label: "Inicio",
            href: "/app/home",
            icon: (
                <IconHome className="h-5 w-5 shrink-0 stroke-[3]" />
            ),
            onClick: () => navigate('/app/home')
        },
        {
            label: "Pacientes",
            href: "/app/patients",
            icon: (
                <IconUsers className="h-5 w-5 shrink-0 stroke-[3]" />
            ),
            onClick: () => navigate('/app/patients')
        },
        {
            label: "Agenda",
            href: "/app/agenda",
            icon: (
                <IconCalendar className="h-5 w-5 shrink-0 stroke-[3]" />
            ),
            onClick: () => navigate('/app/agenda')
        },
        {
            label: "Reportes",
            href: "/app/reports",
            icon: (
                <IconReportAnalytics className="h-5 w-5 shrink-0 stroke-[3]" />
            ),
            onClick: () => navigate('/app/reports')
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
                                    isActive={link.href !== '#' && location.pathname.startsWith(link.href)}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <SidebarLink
                            link={{
                                label: currentUser || "Doctor",
                                href: "#",
                                icon: (
                                    <div className="h-7 w-7 shrink-0 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                                        {currentUser ? currentUser.charAt(0).toUpperCase() : "D"}
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
