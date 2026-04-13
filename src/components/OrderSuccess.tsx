import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Clock, Home, ArrowRight } from 'lucide-react';

export function OrderSuccess() {
  const [orderInfo, setOrderInfo] = useState<any>(null);

  useEffect(() => {
    // Get order ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const customerName = urlParams.get('customerName') || 'Client';

    if (orderId && customerName) {
      setOrderInfo({ orderId, customerName });
    }

    // Clear cart from localStorage when order is successful
    localStorage.removeItem('sam_pizza_cart');
    console.log('Cart cleared after successful payment');

    // Clear URL parameters without page reload
    window.history.replaceState({}, '', '/');
  }, []);

  const handleTrackOrder = () => {
    if (orderInfo?.orderId) {
      window.location.href = `/suivi?orderId=${orderInfo.orderId}`;
    }
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  if (!orderInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4 font-sans">
        <Card className="border-none shadow-xl max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Chargement des informations de commande...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl">
        <Card className="border-none shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <CardTitle className="text-4xl font-bold text-green-700">
              Merci {orderInfo.customerName} !
            </CardTitle>
            <CardDescription className="text-xl text-gray-600 mt-3">
              Votre commande a été confirmée avec succès
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Order Number */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
              <div className="text-center">
                <p className="text-sm font-medium text-green-700 uppercase tracking-wide mb-2">
                  Numéro de commande
                </p>
                <p className="text-3xl font-bold text-green-900 tracking-wider">
                  #{orderInfo.orderId}
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Gardez ce numéro pour suivre votre commande
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">Commande confirmée</h3>
                  <p className="text-sm text-green-700">
                    Votre paiement a été accepté et votre commande est enregistrée
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">En préparation</h3>
                  <p className="text-sm text-blue-700">
                    Nos équipes préparent votre commande avec soin
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900 mb-1">Prête en 15-20 minutes</h3>
                  <p className="text-sm text-purple-700">
                    Votre commande sera prête rapidement ! Vous pourrez suivre l'avancement en temps réel.
                  </p>
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Ce qui se passe ensuite :</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1 font-bold">✓</span>
                  <span>Confirmation immédiate de votre commande</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1 font-bold">→</span>
                  <span>Préparation de votre commande par nos équipes pizzaïologues</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1 font-bold">★</span>
                  <span>Votre commande est prête ! Vous serez notifié</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-1 font-bold">🍕</span>
                  <span>Dégustation de votre délicieuse pizza Sam Pizza !</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleTrackOrder}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
                size="lg"
              >
                Suivre ma commande
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <div className="flex gap-3">
                <Button
                  onClick={handleBackToHome}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  size="lg"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </div>
            </div>

            {/* Contact info */}
            <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
              <p className="mb-1">Questions ? N'hésitez pas à nous contacter</p>
              <p>Un email de confirmation vous sera envoyé prochainement.</p>
              <p className="mt-3 font-semibold text-green-700">Merci pour votre confiance ! 🍕</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
