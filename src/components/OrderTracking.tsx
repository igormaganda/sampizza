import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, CheckCircle2, Clock, ChefHat, Truck, Package } from 'lucide-react';
import { OrderStatus } from '@/context/AppContext';

export function OrderTracking() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Parse URL for order ID if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setOrderId(id);
      fetchOrder(id);
    }
  }, []);

  const fetchOrder = async (id: string) => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) {
        throw new Error('Commande introuvable');
      }
      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderId);
  };

  const statusSteps = [
    { id: 'attente_paiement', label: 'Paiement', icon: <Clock className="w-6 h-6" /> },
    { id: 'en_attente', label: 'Confirmée', icon: <CheckCircle2 className="w-6 h-6" /> },
    { id: 'en_preparation', label: 'En préparation', icon: <ChefHat className="w-6 h-6" /> },
    { id: 'pret', label: 'Prête', icon: <Package className="w-6 h-6" /> },
    { id: 'livre', label: 'Livrée', icon: <Truck className="w-6 h-6" /> },
  ];

  const getStepIndex = (status: OrderStatus) => {
    return statusSteps.findIndex(s => s.id === status);
  };

  return (
    <div className="min-h-screen bg-bg-light p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <a href="/" className="inline-flex items-center text-primary hover:underline mb-8 font-bold uppercase tracking-wider">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'accueil
        </a>

        <Card className="border-none shadow-xl">
          <CardHeader className="text-center pb-8 border-b">
            <CardTitle className="text-3xl font-oswald uppercase tracking-wider text-primary">Suivi de commande</CardTitle>
            <CardDescription className="text-lg">Entrez votre numéro de commande pour suivre son état.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSearch} className="flex gap-4 mb-12">
              <Input 
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Ex: ord_123456789" 
                className="h-14 text-lg"
              />
              <Button type="submit" className="h-14 px-8 bg-primary hover:bg-primary/90 text-white" disabled={isLoading}>
                {isLoading ? 'Recherche...' : <Search className="w-6 h-6" />}
              </Button>
            </form>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center font-medium border border-red-200">
                {error}
              </div>
            )}

            {order && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Commande {order.id}</h3>
                  <p className="text-gray-500">Passée le {new Date(order.createdAt).toLocaleString('fr-FR')}</p>
                </div>

                <div className="relative">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0 hidden md:block"></div>
                  <div 
                    className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 hidden md:block transition-all duration-500"
                    style={{ width: `${(getStepIndex(order.status) / (statusSteps.length - 1)) * 100}%` }}
                  ></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 md:gap-0">
                    {statusSteps.map((step, index) => {
                      const currentIndex = getStepIndex(order.status);
                      const isCompleted = index <= currentIndex;
                      const isCurrent = index === currentIndex;
                      
                      return (
                        <div key={step.id} className="flex md:flex-col items-center gap-4 md:gap-2">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-colors duration-300 ${
                            isCompleted ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-400'
                          } ${isCurrent ? 'ring-4 ring-primary/30' : ''}`}>
                            {step.icon}
                          </div>
                          <span className={`font-bold uppercase tracking-wider text-sm ${isCompleted ? 'text-text-dark' : 'text-gray-400'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border">
                  <h4 className="font-bold uppercase tracking-wider mb-4 border-b pb-2">Détails de la commande</h4>
                  <div className="space-y-4">
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-start">
                        <div>
                          <span className="font-bold">{item.quantity}x</span> {item.menuItem.name}
                          {item.configurations && item.configurations.length > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                              {item.configurations.map((c: any) => c.name).join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold">{item.totalPrice.toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t flex justify-between items-center text-xl font-bold">
                    <span>Total</span>
                    <span className="text-primary">{order.total.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
