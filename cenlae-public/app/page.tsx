import { NavbarCenlae } from '@/components/NavbarCenlae';
import { HeroCenlae } from '@/components/HeroCenlae';
import { FooterCenlae } from '@/components/FooterCenlae';
import { ProfileCenlae } from '@/components/ProfileCenlae';
import { ServicesCenlae } from '@/components/ServicesCenlae';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <NavbarCenlae activePage="inicio" />

      <main className="flex-grow">
        <HeroCenlae />
        <ProfileCenlae />
        <ServicesCenlae />
      </main>

      <FooterCenlae />
    </div>
  );
}
