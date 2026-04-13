import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ShoppingCart, Home } from 'lucide-react';

export function PaymentCanceled() {
  const handleBackToHome = () => {
    window.location.href = '/';
  };

  const handleTryAgain = () => {
    window.history.back();
  };

  useEffect(() => {
    // Clear the URL parameters without triggering a page reload
    window.history.replaceState({}, '', '/');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg">
        <Card className="border-none shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-red-700">
              Paiement Annulé
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              Vous avez annulé le processus de paiement
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h3 className="font-semibold text-red-900 mb-2">Ce qui s'est passé :</h3>
              <p className="text-sm text-red-700">
                Vous avez choisi de ne pas finaliser votre paiement. Aucune somme n'a été débitée de votre carte.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Votre panier est conservé</h3>
              <p className="text-sm text-blue-700">
                Rassurez-vous, vos articles sont toujours dans votre panier. Vous pouvez continuer votre commande quand vous le souhaitez.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Vérifiez votre panier</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Assurez-vous que tous les articles sont corrects
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Procédez au paiement</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Choisissez votre méthode de livraison et finalisez le paiement
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Validez la commande</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Suivez l'état de préparation de votre commande en temps réel
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleTryAgain}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                size="lg"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Réessayer le paiement
              </Button>
              <Button
                onClick={handleBackToHome}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Accueil
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Besoin d'aide ? Nos équipes sont à votre disposition.</p>
              <p className="mt-1">Nous espérons vous voir très bientôt ! 🍕</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Questions fréquentes ?{' '}
            <a href="/" className="text-red-600 hover:underline font-medium">
              Consulter notre aide
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
