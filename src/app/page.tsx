import Header from '../components/Header';

export default function Home() {
  return (
    <div>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bienvenue sur KRAC RADIO
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Votre musique préférée 24h/24, 7j/7
          </p>
        </div>
      </main>
    </div>
  );
}