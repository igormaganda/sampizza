import { useState, useEffect } from 'react';
import { useAppContext, DeliveryMethod } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, ShoppingBag, Plus, Minus, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Initialize Stripe - public key will be loaded from environment
const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7J9');

export function CartSidebar() {
  const { cart, removeFromCart, updateCartItemQuantity, isCartVisible, setCartVisible, lastAddedItemId, placeOrder } = useAppContext();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('sur_place');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [comments, setComments] = useState('');

  // Set default delivery time (now + 35 minutes) when cart opens
  useEffect(() => {
    if (isCartVisible && (!deliveryDate || !deliveryTime)) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 35);
      setDeliveryDate(now.toISOString().split('T')[0]); // YYYY-MM-DD format
      setDeliveryTime(now.toTimeString().slice(0, 5)); // HH:MM format
    }
  }, [isCartVisible]);

  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);

    try {
      // Call backend API to create checkout session
      const response = await fetch('https://apisam.mgd-crm.com/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart,
          deliveryMethod,
          deliveryDate,
          deliveryTime,
          comments,
          total: total + (deliveryMethod === 'livraison' ? 2.5 : 0)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(errorData.error || 'Erreur lors de la création de la session de paiement');
      }

      const session = await response.json();

      if (session.url) {
        // Redirect to Stripe checkout
        window.location.href = session.url;
      } else if (session.error) {
        throw new Error(session.error);
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error) {
      console.error('Checkout error:', error);

      // Fallback: simulate payment for development/demo purposes
      if (confirm(`Erreur de paiement (${error.message}).\n\nVoulez-vous utiliser le mode paiement simulé pour continuer ?`)) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 35);
        const defaultDate = now.toISOString().split('T')[0];
        const defaultTime = now.toTimeString().slice(0, 5);

        placeOrder('Client Web (Paiement Simulé)', deliveryMethod, defaultDate, defaultTime, comments);
        alert('✅ Paiement simulé réussi ! Votre commande a été validée.');
        setCartVisible(false);
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!isCartVisible) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={() => setCartVisible(false)}
      />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
        <div className="p-6 bg-primary text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="text-lg font-serif font-bold tracking-wider uppercase">Votre Commande</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setCartVisible(false)} className="text-white hover:bg-white/20 rounded-none">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 mt-20">
              <ShoppingBag className="w-12 h-12 opacity-20" />
              <p className="font-serif">Votre panier est vide</p>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex gap-4 transition-all duration-500 ${lastAddedItemId === item.id ? 'bg-red-50 p-2 -mx-2 rounded-md' : ''}`}
                >
                  <img src={item.menuItem.image} alt={item.menuItem.name} className="w-20 h-20 rounded-none object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-sm">{item.menuItem.name}</h3>
                      <span className="font-bold text-primary font-oswald text-xl">{item.totalPrice.toFixed(2)}€</span>
                    </div>
                    
                    {item.configurations.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                        {item.configurations.map(c => (
                          <div key={c.id}>+ {c.name}</div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200">
                        <button 
                          className="px-2 py-1 hover:bg-gray-100 transition-colors"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-1 text-sm font-medium border-x border-gray-200">{item.quantity}</span>
                        <button 
                          className="px-2 py-1 hover:bg-gray-100 transition-colors"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button 
                        className="text-xs text-gray-400 hover:text-primary underline"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {cart.length > 0 && (
          <div className="p-6 bg-gray-50 border-t">
            <div className="mb-6 space-y-4">
              <Label className="text-base font-bold uppercase tracking-wider text-gray-700">Mode de retrait</Label>
              <RadioGroup 
                value={deliveryMethod} 
                onValueChange={(val) => setDeliveryMethod(val as DeliveryMethod)}
                className="flex flex-row space-x-2"
              >
                <div className="flex-1 flex items-center space-x-2 bg-white p-3 border border-gray-200 cursor-pointer hover:border-primary transition-colors rounded-md">
                  <RadioGroupItem value="sur_place" id="sur_place" />
                  <Label htmlFor="sur_place" className="flex-1 cursor-pointer font-bold text-sm">À emporter</Label>
                </div>
                <div className="flex-1 flex items-center space-x-2 bg-white p-3 border border-gray-200 cursor-pointer hover:border-primary transition-colors rounded-md">
                  <RadioGroupItem value="livraison" id="livraison" />
                  <Label htmlFor="livraison" className="flex-1 cursor-pointer font-bold text-sm">Livraison</Label>
                </div>
              </RadioGroup>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-xs font-bold uppercase text-gray-500">Date</Label>
                  <input 
                    type="date" 
                    id="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-xs font-bold uppercase text-gray-500">Heure</Label>
                  <input 
                    type="time" 
                    id="time"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="comments" className="text-xs font-bold uppercase text-gray-500">Commentaires</Label>
                <textarea 
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Instructions spéciales pour la commande..."
                  className="w-full p-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-primary min-h-[80px] resize-y"
                />
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Sous-total</span>
                <span>{total.toFixed(2)}€</span>
              </div>
              {deliveryMethod === 'livraison' && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Frais de livraison</span>
                  <span>2.50€</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg items-center">
                <span className="uppercase tracking-widest text-sm">Total</span>
                <span className="text-primary font-oswald text-3xl">{(total + (deliveryMethod === 'livraison' ? 2.5 : 0)).toFixed(2)}€</span>
              </div>
            </div>
            
            <Button 
              className="w-full rounded-md bg-primary hover:bg-text-dark text-white uppercase tracking-widest h-14 text-lg font-bold shadow-lg transition-colors"
              onClick={handleCheckout}
              disabled={isCheckingOut || !deliveryDate || !deliveryTime}
            >
              {isCheckingOut ? 'Traitement...' : (
                <span className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payer par C.B
                </span>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
