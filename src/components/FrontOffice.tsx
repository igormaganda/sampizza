import { useState, useEffect } from 'react';
import { useAppContext, ItemCategory } from '@/context/AppContext';
import { ItemConfigurator } from './ItemConfigurator';
import { CartSidebar } from './CartSidebar';
import { ShoppingBag, Star, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Icons } from './Icons';

export function FrontOffice() {
  const { menuItems, cart, setCartVisible } = useAppContext();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ItemCategory | 'tout'>('tout');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenConfig = (item: any) => {
    setSelectedItem(item);
    setIsConfigOpen(true);
  };

  const filteredItems = activeCategory === 'tout' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  const categories: { id: ItemCategory | 'tout', label: string, icon: React.ReactNode }[] = [
    { id: 'tout', label: 'Tout', icon: <Star className="w-6 h-6" /> },
    { id: 'pizza', label: 'Pizzas', icon: <Icons.Pizza /> },
    { id: 'panini', label: 'Paninis', icon: <Icons.Burger /> },
    { id: 'salade', label: 'Salades', icon: <Icons.Pasta /> },
    { id: 'dessert', label: 'Desserts', icon: <Icons.Dessert /> },
    { id: 'boisson', label: 'Boissons', icon: <Icons.Drink /> },
  ];

  return (
    <div className="min-h-screen bg-bg-light font-sans text-text-dark">
      {/* Header */}
      <header className={`fixed top-0 left-0 w-full z-30 transition-all duration-300 ${isScrolled ? 'bg-primary/95 backdrop-blur-sm shadow-md py-4' : 'bg-primary py-6'} border-b-4 border-accent`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <a href="#" className="flex items-center gap-3 font-serif text-3xl font-bold text-white uppercase tracking-wider">
            <img src="/Sam-Pizza-Bondy.png" alt="Sam Pizza Bondy" className="w-10 h-10 object-contain rounded-full" />
            Sam Pizza
          </a>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#accueil" className="text-sm uppercase tracking-[2px] font-bold text-white hover:text-accent transition-colors">Accueil</a>
            <a href="#menu" className="text-sm uppercase tracking-[2px] font-bold text-white hover:text-accent transition-colors">La Carte</a>
            <a href="#avis" className="text-sm uppercase tracking-[2px] font-bold text-white hover:text-accent transition-colors">Avis</a>
            <a href="#contact" className="text-sm uppercase tracking-[2px] font-bold text-white hover:text-accent transition-colors">Contact</a>
            <button 
              onClick={() => setCartVisible(true)}
              className="relative flex items-center gap-2 bg-accent text-text-dark px-8 py-4 text-sm uppercase tracking-widest font-bold hover:bg-text-dark hover:text-white transition-colors rounded-full shadow-lg hover:shadow-xl"
            >
              <ShoppingBag className="w-5 h-5" />
              Panier
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-primary text-[12px] font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md">
                  {cartItemCount}
                </span>
              )}
            </button>
          </nav>

          <button className="md:hidden text-white hover:text-accent" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-20 bg-primary pt-24 px-4 pb-4 flex flex-col gap-6 md:hidden text-white">
          <a href="#accueil" onClick={() => setIsMobileMenuOpen(false)} className="text-lg uppercase tracking-wider font-bold border-b border-white/20 pb-4 hover:text-accent">Accueil</a>
          <a href="#menu" onClick={() => setIsMobileMenuOpen(false)} className="text-lg uppercase tracking-wider font-bold border-b border-white/20 pb-4 hover:text-accent">La Carte</a>
          <a href="#avis" onClick={() => setIsMobileMenuOpen(false)} className="text-lg uppercase tracking-wider font-bold border-b border-white/20 pb-4 hover:text-accent">Avis</a>
          <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="text-lg uppercase tracking-wider font-bold border-b border-white/20 pb-4 hover:text-accent">Contact</a>
          <button 
            onClick={() => { setCartVisible(true); setIsMobileMenuOpen(false); }}
            className="flex justify-center items-center gap-2 bg-accent text-text-dark px-6 py-4 text-sm uppercase tracking-widest font-bold mt-auto hover:bg-text-dark hover:text-white rounded-full transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            Panier ({cartItemCount})
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section id="accueil" className="relative h-[85vh] flex items-center justify-center text-center text-white pt-20 border-b-8 border-accent">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')" }}
        />
        <div className="relative z-20 max-w-4xl px-4">
          <h1 className="text-6xl md:text-8xl font-serif mb-6 font-bold tracking-tight text-accent drop-shadow-lg">Tradition & Excellence</h1>
          <p className="text-xl md:text-3xl font-medium text-white mb-10 drop-shadow-md">Pizzas artisanales et paninis gourmands. Service de livraison et à emporter à Bondy.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a href="#menu" className="bg-primary text-white px-10 py-5 text-lg uppercase tracking-[2px] font-bold hover:bg-text-dark transition-colors rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transform duration-200">
              Voir La Carte
            </a>
            <a href="tel:+33148486556" className="bg-accent text-text-dark px-10 py-5 text-lg uppercase tracking-[2px] font-bold hover:bg-text-dark hover:text-white transition-colors rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transform duration-200">
              01 48 48 65 56
            </a>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-24 bg-bg-light border-b border-border">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16 relative pb-6 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-24 after:h-[4px] after:bg-accent after:rounded-full">
            <h2 className="text-4xl md:text-5xl uppercase tracking-wider mb-2 font-bold text-primary font-oswald">Notre <span className="text-primary italic normal-case">Carte</span></h2>
            <p className="font-sans text-text-light text-lg tracking-wider font-medium mt-4">Sélection de produits frais et pâte maison</p>
          </div>

          {/* Custom Tabs */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-16">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex flex-col items-center gap-3 pb-4 border-b-4 transition-all duration-300 ${activeCategory === cat.id ? 'border-primary text-primary scale-110' : 'border-transparent text-text-light hover:text-primary hover:scale-105'}`}
              >
                <div className={`w-16 h-16 flex items-center justify-center rounded-full ${activeCategory === cat.id ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-500 shadow-sm'}`}>
                  {cat.icon}
                </div>
                <span className="text-sm uppercase tracking-[2px] font-bold">{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredItems.map(item => (
              <article key={item.id} className="bg-white rounded-none overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group border-2 border-primary">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-2xl font-oswald font-bold uppercase text-white leading-tight drop-shadow-md">{item.name}</h3>
                  </div>
                  {!item.available && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                      <span className="bg-primary text-white px-6 py-3 text-lg uppercase tracking-widest font-bold rounded-full shadow-lg">Épuisé</span>
                    </div>
                  )}
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <h3 className="text-2xl font-oswald font-bold uppercase text-text-dark leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                    <span className="text-3xl font-oswald font-bold text-primary shrink-0">{item.basePrice.toFixed(2)}€</span>
                  </div>
                  <p className="text-text-light text-base mb-8 flex-1">{item.description}</p>
                  <button 
                    onClick={() => handleOpenConfig(item)}
                    disabled={!item.available}
                    className="w-full py-4 bg-primary text-white rounded-full text-sm uppercase tracking-[2px] font-bold hover:bg-text-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    Ajouter au panier
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="avis" className="py-24 bg-bg-light border-b border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16 relative pb-6 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-24 after:h-[4px] after:bg-accent after:rounded-full">
            <span className="inline-block bg-accent text-text-dark px-6 py-2 text-sm font-bold tracking-widest mb-6 rounded-full shadow-md">4.4 / 5</span>
            <h2 className="text-4xl md:text-5xl uppercase tracking-wider font-bold text-primary font-oswald">Témoignages</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-3xl shadow-lg border-2 border-transparent hover:border-accent transition-all duration-300">
              <div className="text-accent text-2xl tracking-widest mb-6 flex gap-1">
                <Star className="w-6 h-6 fill-current" /><Star className="w-6 h-6 fill-current" /><Star className="w-6 h-6 fill-current" /><Star className="w-6 h-6 fill-current" /><Star className="w-6 h-6 fill-current" />
              </div>
              <p className="font-serif italic text-xl leading-relaxed mb-6 text-text-light">"Incontournable pour la livraison à Bondy. Les pizzas arrivent toujours chaudes et la pâte est incroyablement fine et croustillante."</p>
              <p className="text-sm font-bold text-primary uppercase tracking-[2px]">— Julien M.</p>
            </div>
            <div className="bg-white p-10 rounded-3xl shadow-lg border-2 border-transparent hover:border-accent transition-all duration-300">
              <div className="text-accent text-2xl tracking-widest mb-6 flex gap-1">
                <Star className="w-6 h-6 fill-current" /><Star className="w-6 h-6 fill-current" /><Star className="w-6 h-6 fill-current" /><Star className="w-6 h-6 fill-current" /><Star className="w-6 h-6 text-gray-300" />
              </div>
              <p className="font-serif italic text-xl leading-relaxed mb-6 text-text-light">"Super panini au poulet ! C'est rare de trouver des sandwichs aussi bien garnis. Je recommande les yeux fermés."</p>
              <p className="text-sm font-bold text-primary uppercase tracking-[2px]">— Amina K.</p>
            </div>
            <div className="bg-white p-10 rounded-3xl shadow-lg border-2 border-transparent hover:border-accent transition-all duration-300">
              <div className="text-accent text-2xl tracking-widest mb-6 flex gap-1">
                <Star className="w-6 h-6 fill-current" /><Star className="w-6 h-6 fill-current" /><Star className="w-6 h-6 fill-current" /><Star className="w-6 h-6 fill-current" /><Star className="w-6 h-6 fill-current" />
              </div>
              <p className="font-serif italic text-xl leading-relaxed mb-6 text-text-light">"Service à emporter très rapide. J'ai appelé à 19h, c'était prêt à 19h15. Bravo pour l'organisation."</p>
              <p className="text-sm font-bold text-primary uppercase tracking-[2px]">— Philippe D.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Info */}
      <section id="contact" className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16 relative pb-6 after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-24 after:h-[4px] after:bg-accent after:rounded-full">
            <h2 className="text-4xl md:text-5xl uppercase tracking-wider mb-2 font-bold text-primary font-oswald">Contact & <span className="text-primary italic normal-case">Retrait</span></h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="p-12 bg-bg-light rounded-3xl shadow-lg border-2 border-transparent hover:border-primary transition-all duration-300">
              <h3 className="text-lg uppercase tracking-widest mb-8 font-bold text-primary">Horaires</h3>
              <ul className="space-y-4 mb-12">
                <li className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-sm uppercase tracking-wider font-bold">Lundi - Dimanche</span>
                  <span className="text-text-light text-lg font-medium">11h00 – 14h30</span>
                </li>
                <li className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-sm uppercase tracking-wider font-bold">Lundi - Dimanche</span>
                  <span className="text-text-light text-lg font-medium">18h00 – 22h30</span>
                </li>
              </ul>
              <p className="text-sm text-accent font-bold italic mb-12">* Ouvert les jours fériés.</p>

              <h3 className="text-lg uppercase tracking-widest mb-8 font-bold text-primary">Coordonnées</h3>
              <div className="space-y-6">
                <p className="flex items-start gap-4 text-lg">
                  <strong className="w-32 text-sm uppercase tracking-wider flex-shrink-0 mt-1">Adresse</strong>
                  <span className="text-text-light">121 Rue Edouard Vaillant, 93140 Bondy</span>
                </p>
                <p className="flex items-center gap-4 text-lg">
                  <strong className="w-32 text-sm uppercase tracking-wider flex-shrink-0">Téléphone</strong>
                  <a href="tel:+33148486556" className="text-primary font-bold hover:underline">+33 1 48 48 65 56</a>
                </p>
                <p className="flex items-center gap-4 text-lg">
                  <strong className="w-32 text-sm uppercase tracking-wider flex-shrink-0">Email</strong>
                  <span className="text-text-light">contact@sampizza-bondy.fr</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col h-full">
              <div className="flex-1 min-h-[400px] bg-gray-200 relative rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2629.670475359789!2d2.4865!3d48.8969!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e6109029464b51%3A0x6a8c7b7b7b7b7b7b!2s121%20Rue%20%C3%89douard%20Vaillant%2C%2093140%20Bondy!5e0!3m2!1sfr!2sfr!4v1620000000000!5m2!1sfr!2sfr" 
                  className="absolute inset-0 w-full h-full border-0 transition-all duration-500"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <div className="mt-6 p-6 bg-accent text-text-dark text-center rounded-2xl shadow-md font-bold text-lg">
                <p>Pas de salle de restaurant, uniquement retrait et livraison.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text-dark text-gray-300 py-20 text-center border-t-8 border-primary">
        <div className="container mx-auto px-4 max-w-6xl">
          <span className="font-serif text-white text-4xl font-bold tracking-widest mb-8 block">SAM PIZZA</span>
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <a href="#accueil" className="text-sm font-bold uppercase tracking-[2px] hover:text-accent transition-colors">Accueil</a>
            <a href="#menu" className="text-sm font-bold uppercase tracking-[2px] hover:text-accent transition-colors">Menu</a>
            <a href="#avis" className="text-sm font-bold uppercase tracking-[2px] hover:text-accent transition-colors">Avis</a>
            <a href="#contact" className="text-sm font-bold uppercase tracking-[2px] hover:text-accent transition-colors">Contact</a>
            <a href="/suivi" className="text-sm font-bold uppercase tracking-[2px] hover:text-accent transition-colors text-primary">Suivre ma commande</a>
            <a href="https://www.societe.com/societe/m-b-l-828005637.html" target="_blank" rel="noopener noreferrer" className="text-sm font-bold uppercase tracking-[2px] hover:text-accent transition-colors">Mentions Légales</a>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-xs uppercase tracking-widest font-bold">© {new Date().getFullYear()} Sam Pizza Bondy. Livraison & Vente à emporter uniquement.</p>
          </div>
        </div>
      </footer>

      <ItemConfigurator 
        item={selectedItem} 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
      />
      <CartSidebar />
    </div>
  );
}
