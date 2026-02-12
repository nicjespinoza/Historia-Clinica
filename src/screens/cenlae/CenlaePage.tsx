import React from 'react';
import { NavbarCenlae } from './NavbarCenlae';
import { HeroCenlae } from './HeroCenlae';
import { ProfileCenlae } from './ProfileCenlae';
import { ServicesCenlae } from './ServicesCenlae';
import { FooterCenlae } from './FooterCenlae';


const CenlaePage = () => {
    return (
        <div className="bg-white text-gray-700 min-h-screen flex flex-col font-sans">
            <NavbarCenlae />

            <main className="flex-grow w-full">
                <section id="hero">
                    <HeroCenlae />
                </section>

                <ProfileCenlae />

                <ServicesCenlae />
            </main>

            <FooterCenlae />

        </div>
    );
};

export default CenlaePage;
