import { NavbarCenlae } from '@/components/NavbarCenlae';
import { HeroCenlae } from '@/components/HeroCenlae';
import { FooterCenlae } from '@/components/FooterCenlae';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <NavbarCenlae activePage="inicio" />

      <main className="flex-grow">
        <HeroCenlae />

        {/* Placeholder for other sections (Services, Profile Snippet) which will be migrated next */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-cenlae-primary mb-4">Nuestros Servicios</h2>
            <p className="text-gray-600">Sección en construcción - Migrando contenido...</p>
          </div>
        </section>
      </main>

      <FooterCenlae />
    </div>
  );
}
